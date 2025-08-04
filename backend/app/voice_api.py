from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime
import uuid
from typing import Optional
from pydantic import BaseModel

from main import get_db
from models import VoiceRecord
from s3_service import S3Service

router = APIRouter(prefix="/voice", tags=["voice"])

# リクエストモデル
class UploadRequest(BaseModel):
    user_id: int
    file_type: str  # "audio" or "text"
    file_format: Optional[str] = "webm"  # "webm", "wav", "mp3" など。今回はwebmを使用。

class SaveRecordRequest(BaseModel):
    user_id: int
    audio_file_path: str
    text_file_path: Optional[str] = None

# S3に直接アップロードするための署名付きURLを発行するAPI
@router.post("/get-upload-url")
async def get_upload_url(
    request: UploadRequest,
    db: AsyncSession = Depends(get_db)
):
    """Presigned URLを生成して返す"""
    
    try:
        s3_service = S3Service()
        
        # ファイル名を生成
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        unique_id = str(uuid.uuid4())[:8]
        
        if request.file_type == "audio":
            # ファイル形式に応じて拡張子とContent-Typeを設定
            if request.file_format == "webm":
                file_extension = "webm"
                content_type = "audio/webm"
            elif request.file_format == "wav":
                file_extension = "wav"
                content_type = "audio/wav"
            elif request.file_format == "mp3":
                file_extension = "mp3"
                content_type = "audio/mpeg"
            else:
                # デフォルトはWebMでいく
                file_extension = "webm"
                content_type = "audio/webm"
            
            file_path = f"audio/{request.user_id}/audio_{timestamp}_{unique_id}.{file_extension}"
        elif request.file_type == "text":
            file_path = f"text/{request.user_id}/text_{timestamp}_{unique_id}.txt"
            content_type = "text/plain"
        else:
            raise HTTPException(status_code=400, detail="Invalid file type")
        
        # Presigned URLを生成
        presigned_url = s3_service.generate_presigned_upload_url(file_path, content_type)
        if not presigned_url:
            raise HTTPException(status_code=500, detail="Failed to generate upload URL")
        
        return {
            "success": True,
            "upload_url": presigned_url,
            "file_path": file_path,
            "s3_url": s3_service.get_file_url(file_path),
            "content_type": content_type
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# 音声・文字ファイルのパスをDBに保存するAPI
@router.post("/save-record")
async def save_record(
    request: SaveRecordRequest,
    db: AsyncSession = Depends(get_db)
):
    """ファイルパスをDBに保存"""
    
    try:
        # DBに記録を保存
        voice_record = VoiceRecord(
            user_id=request.user_id,
            audio_file_path=request.audio_file_path,
            text_file_path=request.text_file_path
        )
        
        db.add(voice_record)
        await db.commit()
        await db.refresh(voice_record)
        
        return {
            "success": True,
            "record_id": voice_record.id,
            "message": "Record saved successfully"
        }
        
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

# 指定ユーザーのファイル情報とダウンロード用Presigned URLを返すAPI
@router.get("/records/{user_id}")
async def get_records(user_id: int, db: AsyncSession = Depends(get_db)):
    """ユーザーの音声記録一覧を取得（ダウンロードURL付き）"""
    try:
        s3_service = S3Service()
        query = select(VoiceRecord).where(VoiceRecord.user_id == user_id).order_by(VoiceRecord.id.desc())
        result = await db.execute(query)
        records = result.scalars().all()
        
        return {
            "success": True,
            "records": [
                {
                    "id": record.id,
                    "audio_path": record.audio_file_path,
                    "text_path": record.text_file_path,
                    "audio_download_url": s3_service.generate_presigned_download_url(record.audio_file_path.replace(f"s3://{s3_service.bucket_name}/", "")),
                    "text_download_url": s3_service.generate_presigned_download_url(record.text_file_path.replace(f"s3://{s3_service.bucket_name}/", "")) if record.text_file_path else None,
                    "created_at": record.audio_file_path.split('/')[-1].split('_')[1:3]  # ファイル名から日時を抽出
                }
                for record in records
            ]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) 