import uuid
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from app.models import EmotionCard, Intensity, User, Child


async def seed_emotion_cards(db: AsyncSession):
    """感情カードのシードデータを作成"""
    emotion_cards = [
        {
            "id": uuid.uuid4(),
            "label": "ふゆかい",
            "image_url": "/images/emotions/fuyukai.webp",
            "color": "#FF0000",
        },
        {
            "id": uuid.uuid4(),
            "label": "いかり",
            "image_url": "/images/emotions/ikari.webp",
            "color": "#FF0000",
        },
        {
            "id": uuid.uuid4(),
            "label": "はずかしい",
            "image_url": "/images/emotions/hazukashii.webp",
            "color": "#FF0000",
        },
        {
            "id": uuid.uuid4(),
            "label": "きんちょう",
            "image_url": "/images/emotions/kinchou.webp",
            "color": "#FF0000",
        },
        {
            "id": uuid.uuid4(),
            "label": "こわい",
            "image_url": "/images/emotions/kowai.webp",
            "color": "#0000FF",
        },
        {
            "id": uuid.uuid4(),
            "label": "かなしい",
            "image_url": "/images/emotions/kanashii.webp",
            "color": "#0000FF",
        },
        {
            "id": uuid.uuid4(),
            "label": "こまった",
            "image_url": "/images/emotions/komatta.webp",
            "color": "#0000FF",
        },
        {
            "id": uuid.uuid4(),
            "label": "あんしん",
            "image_url": "/images/emotions/anshin.webp",
            "color": "#00CC66",
        },
        {
            "id": uuid.uuid4(),
            "label": "びっくり",
            "image_url": "/images/emotions/bikkuri.webp",
            "color": "#00CC66",
        },
        {
            "id": uuid.uuid4(),
            "label": "わからない",
            "image_url": "/images/emotions/wakaranai.webp",
            "color": "#999999",
        },
        {
            "id": uuid.uuid4(),
            "label": "うれしい",
            "image_url": "/images/emotions/ureshii.webp",
            "color": "#FFCC00",
        },
        {
            "id": uuid.uuid4(),
            "label": "ゆかい",
            "image_url": "/images/emotions/yukai.webp",
            "color": "#FFCC00",
        },
    ]

    for card_data in emotion_cards:
        card = EmotionCard(**card_data)
        db.add(card)

    await db.commit()
    print(f"✅ {len(emotion_cards)}個の感情カードをシードしました")


async def seed_intensities(db: AsyncSession):
    """強度のシードデータを作成"""
    intensities = [
        {"id": 1, "color_modifier": 40},
        {"id": 2, "color_modifier": 70},
        {"id": 3, "color_modifier": 100},
    ]

    for intensity_data in intensities:
        intensity = Intensity(**intensity_data)
        db.add(intensity)

    await db.commit()
    print(f"✅ {len(intensities)}個の強度をシードしました")


async def seed_test_user_and_child(db: AsyncSession):
    """テスト用のユーザーと子供のデータを作成"""
    # テスト用ユーザーを作成
    test_user = User(
        id=uuid.uuid4(),
        uid="test-user-123",
        email="test@example.com",
        nickname="Test User",
        email_verified=True,
        created_at=datetime.now(),
        updated_at=datetime.now(),
    )
    
    # 既存のユーザーをチェック
    from sqlalchemy import select
    result = await db.execute(select(User).where(User.uid == "test-user-123"))
    existing_user = result.scalar_one_or_none()
    
    if not existing_user:
        db.add(test_user)
        await db.commit()
        print("✅ テスト用ユーザーを作成しました")
    else:
        print("⚠️ テスト用ユーザーは既に存在します")
        test_user = existing_user
    
    # テスト用の子供を作成
    test_child = Child(
        id=uuid.uuid4(),
        user_id=test_user.id,
        nickname="テストくん",
        birth_date=datetime(2018, 4, 15).date(),
        gender="男の子",
        created_at=datetime.now(),
        updated_at=datetime.now(),
    )
    
    # 既存の子供をチェック
    result = await db.execute(select(Child).where(Child.user_id == test_user.id))
    existing_children = result.scalars().all()
    
    if not existing_children:
        db.add(test_child)
        await db.commit()
        print("✅ テスト用の子供を作成しました")
    else:
        print(f"⚠️ テスト用の子供は既に{len(existing_children)}人存在します")


async def run_seeds(db: AsyncSession):
    """全てのシードを実行"""
    print("シードデータを作成中...")

    # 既存データをチェック
    from sqlalchemy import select

    # 感情カードのチェック
    result = await db.execute(select(EmotionCard))
    existing_cards = result.scalars().all()
    if not existing_cards:
        await seed_emotion_cards(db)
    else:
        print(f"⚠️ 感情カードは既に{len(existing_cards)}個存在します")

    # 強度のチェック
    result = await db.execute(select(Intensity))
    existing_intensities = result.scalars().all()
    if not existing_intensities:
        await seed_intensities(db)
    else:
        print(f"⚠️ 強度は既に{len(existing_intensities)}個存在します")

    # テスト用ユーザーと子供のチェック
    await seed_test_user_and_child(db)

    print("✅ シード完了！")
