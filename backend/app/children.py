import logging
from typing import List
from uuid import UUID 
from fastapi import APIRouter, Depends, HTTPException, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from firebase_admin import auth

from app.database import get_db
from app.models import User
import app.crud as crud
import app.schemas as schemas

router = APIRouter(tags=["children"])

# HTTPBearer認証スキーム
security = HTTPBearer()

async def get_current_user(
    token: HTTPAuthorizationCredentials = Security(security),
    db: AsyncSession = Depends(get_db)
) -> User:
    """認証トークンからユーザー情報を取得"""
    try:
        decoded_token = auth.verify_id_token(token.credentials)
        uid = decoded_token["uid"]
        
        user = await crud.get_user_by_uid(db, uid)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        return user
    except Exception as e:
        logging.error(f"Authentication failed: {e}")
        raise HTTPException(status_code=401, detail="Invalid authentication token")

@router.post("", response_model=schemas.ChildResponse)
async def create_child(
    child_data: schemas.ChildBase,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """子どものプロフィールを作成"""
    try:
        child = await crud.create_child(
            db,
            user_id=current_user.id,
            nickname=child_data.nickname,
            birth_date=child_data.birth_date,
            gender=child_data.gender,
        )
        
        if not child:
            raise HTTPException(status_code=500, detail="Failed to create child profile")
        
        return child
        
    except Exception as e:
        logging.error(f"Failed to create child profile: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("", response_model=List[schemas.ChildResponse])
async def get_children(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """ユーザーに紐づく子どものリストを取得"""
    try:
        children = await crud.get_children_by_user_id(db, current_user.id)
        return children
        
    except Exception as e:
        logging.error(f"Failed to get children: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/count")
async def get_children_count(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """ユーザーに紐づく子供の数を取得"""
    try:
        children = await crud.get_children_by_user_id(db, current_user.id)
        return {"count": len(children)}
        
    except Exception as e:
        logging.error(f"Failed to get children count: {e}")
        raise HTTPException(status_code=500, detail="Internal server error") 
    
@router.put("/{child_id}", response_model=schemas.ChildResponse)
async def update_child(
    child_id: UUID,
    child_data: schemas.ChildBase,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """子どものプロフィールを更新"""
    try:

        child = await crud.get_child_by_id(db, child_id)
        if not child:
            raise HTTPException(status_code=404, detail="Child not found")

        return await crud.update_child(
            db,
            child_id=child_id,
            nickname=child_data.nickname,
            birth_date=child_data.birth_date,
            gender=child_data.gender,
        )
    except Exception as e:
        logging.error(f"Failed to update child profile: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")
