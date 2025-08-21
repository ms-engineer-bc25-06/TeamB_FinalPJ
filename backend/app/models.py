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
    Date,
    text,
)
from datetime import datetime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    pass


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    uid: Mapped[str] = mapped_column(String, unique=True, nullable=False, index=True)
    email: Mapped[str] = mapped_column(String, unique=True, nullable=False, index=True)
    email_verified: Mapped[bool] = mapped_column(Boolean, nullable=False)
    nickname: Mapped[str] = mapped_column(String, nullable=True)

    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    # TODO: 管理者画面を作成したら以下にnullable=Falseを入れること
    last_login_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    login_count: Mapped[int] = mapped_column(Integer, default=0)
    role: Mapped[str] = mapped_column(String, default="user")

    # Relationships
    subscriptions = relationship("Subscription", back_populates="user", uselist=False)
    children = relationship("Child", back_populates="user")
    emotion_logs = relationship("EmotionLog", back_populates="user")
    daily_reports = relationship("DailyReport", back_populates="user")
    weekly_reports = relationship("WeeklyReport", back_populates="user")
    report_notifications = relationship("ReportNotification", back_populates="user")


class Subscription(Base):
    __tablename__ = "subscriptions"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, unique=True, index=True)
    stripe_customer_id: Mapped[str] = mapped_column(String, nullable=True, unique=True)
    stripe_subscription_id: Mapped[str | None] = mapped_column(String, nullable=True)
    subscription_status: Mapped[str] = mapped_column(String, nullable=True)
    is_trial: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    trial_started_at: Mapped[DateTime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    trial_expires_at: Mapped[DateTime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    is_paid: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationship
    user = relationship("User", back_populates="subscriptions")


class Child(Base):
    __tablename__ = "children"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    nickname: Mapped[str] = mapped_column(String, nullable=False)
    birth_date: Mapped[Date] = mapped_column(Date, nullable=False)
    gender: Mapped[str] = mapped_column(String, nullable=False)

    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    user = relationship("User", back_populates="children")
    emotion_logs = relationship("EmotionLog", back_populates="child")
    daily_reports = relationship("DailyReport", back_populates="child")
    weekly_reports = relationship("WeeklyReport", back_populates="child")
    report_notifications = relationship("ReportNotification", back_populates="child")


class EmotionCard(Base):
    __tablename__ = "emotion_cards"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    label: Mapped[str] = mapped_column(String, nullable=False)
    image_url: Mapped[str] = mapped_column(String, nullable=False)
    color: Mapped[str] = mapped_column(String, nullable=False)

    # Relationships
    emotion_logs = relationship("EmotionLog", back_populates="emotion_card")


class Intensity(Base):
    __tablename__ = "intensity"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    color_modifier: Mapped[int] = mapped_column(Integer, nullable=False)

    # Relationships
    emotion_logs = relationship("EmotionLog", back_populates="intensity")


class EmotionLog(Base):
    __tablename__ = "emotion_logs"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    child_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("children.id"), nullable=False, index=True)
    emotion_card_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("emotion_cards.id"), nullable=False)
    intensity_id: Mapped[int] = mapped_column(Integer, ForeignKey("intensity.id"), nullable=False)
    voice_note: Mapped[str | None] = mapped_column(Text, nullable=True)

    text_file_path: Mapped[str | None] = mapped_column(String, nullable=True)  # テキストファイルのS3パス
    audio_file_path: Mapped[str] = mapped_column(String)  # 音声ファイルのS3パス

    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    user = relationship("User", back_populates="emotion_logs")
    child = relationship("Child", back_populates="emotion_logs")
    emotion_card = relationship("EmotionCard", back_populates="emotion_logs")
    intensity = relationship("Intensity", back_populates="emotion_logs")
    daily_report = relationship("DailyReport", back_populates="emotion_log", uselist=False)


class DailyReport(Base):
    __tablename__ = "daily_reports"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    child_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("children.id"), nullable=False, index=True)
    emotion_log_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("emotion_logs.id"), nullable=False, unique=True)
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    user = relationship("User", back_populates="daily_reports")
    child = relationship("Child", back_populates="daily_reports")
    emotion_log = relationship("EmotionLog", back_populates="daily_report", uselist=False)


class WeeklyReport(Base):
    __tablename__ = "weekly_reports"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    child_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("children.id"), nullable=False, index=True)
    week_start_date: Mapped[Date] = mapped_column(Date, nullable=False)
    week_end_date: Mapped[Date] = mapped_column(Date, nullable=False)
    trend_summary: Mapped[str] = mapped_column(Text, nullable=False)
    advice_for_child: Mapped[str] = mapped_column(Text, nullable=False)
    growth_points: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    user = relationship("User", back_populates="weekly_reports")
    child = relationship("Child", back_populates="weekly_reports")


class ReportNotification(Base):
    __tablename__ = "report_notifications"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    child_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("children.id"), nullable=False, index=True)
    notification_day: Mapped[str] = mapped_column(String)
    enabled: Mapped[bool] = mapped_column(Boolean, nullable=False)
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    user = relationship("User", back_populates="report_notifications")
    child = relationship("Child", back_populates="report_notifications")
