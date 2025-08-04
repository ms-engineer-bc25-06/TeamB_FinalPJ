from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.sql import func

Base = declarative_base()

class VoiceRecord(Base):
    __tablename__ = "voice_records"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False)
    
    # S3パス
    audio_file_path = Column(String, nullable=False)  # 音声ファイルのS3パス
    text_file_path = Column(String)  # テキストファイルのS3パス 