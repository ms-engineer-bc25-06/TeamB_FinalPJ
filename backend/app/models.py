import uuid
from sqlalchemy import (
    Column,
    String,
    Boolean,
    DateTime,
    Integer,
    Text,
    ForeignKey,
    func,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    pass


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    uid = Column(String, unique=True, nullable=False, index=True)
    email = Column(String, unique=True, nullable=False, index=True)
    email_verified = Column(Boolean, default=False, nullable=False)
    nickname = Column(String)

    is_trial = Column(Boolean, default=True, nullable=False)
    trial_started_at = Column(DateTime(timezone=True))
    trial_expires_at = Column(DateTime(timezone=True))

    is_paid = Column(Boolean, default=False, nullable=False)
    subscription_status = Column(String)
    stripe_customer_id = Column(String, unique=True)

    created_at = Column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )
    deleted_at = Column(DateTime(timezone=True))

    last_login_at = Column(DateTime(timezone=True))
    login_count = Column(Integer, default=0, nullable=False)
    role = Column(String, default="user", nullable=False)


class VoiceRecord(Base):
    __tablename__ = "voice_records"

    id = Column(Integer, primary_key=True, index=True)
    # Userテーブルのidを参照
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)

    # S3パス
    audio_file_path = Column(String, nullable=False)  # 音声ファイルのS3パス
    text_file_path = Column(String)  # テキストファイルのS3パス

    created_at = Column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
