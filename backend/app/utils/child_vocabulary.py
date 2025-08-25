"""
子ども向け語彙のヒント定義
音声認識の精度向上のため、よく使われる表現を定義
"""
from typing import List

# 最重要語彙を最初に配置（Whisperの優先度が高い）
CRITICAL_VOCABULARY = [
    "おもちゃ", "とられた", "けんか", "けんかした",  # 目標語彙
    "かして", "かえして", "いじわる", "だめ", "やめて"  # 関連語彙
]

# よく使われる文脈パターン
COMMON_PATTERNS = [
    "おもちゃとられた", "けんかした", "いじわるされた",
    "かして", "かえして", "だめ"
]

# 感情表現
EMOTIONS = [
    "うれしい", "かなしい", "いらいら", "こわい", "びっくり",
    "たのしい", "つかれた", "ねむい", "おなかすいた", "のどかわいた"
]

# おもちゃ・遊び
TOYS_AND_PLAY = [
    "おもちゃ", "ブロック", "ぬいぐるみ", "ボール", "おえかき",
    "あそぶ", "かして", "かえして", "とられた", "もらった",
    "かって", "かってあげる", "いっしょにあそぼう"
]

# 喧嘩・トラブル
CONFLICTS = [
    "けんか", "けんかした", "けんかになった", "とられた", "とった",
    "いじわる", "ぶった", "ぶたれた", "なぐった", "なぐられた",
    "だめ", "やめて", "いや", "こわい", "たすけて"
]

# 日常会話
DAILY_CONVERSATION = [
    "おはよう", "こんにちは", "こんばんは", "おやすみ",
    "ありがとう", "ごめんなさい", "だいじょうぶ", "がんばって",
    "いってきます", "いってらっしゃい", "ただいま", "おかえり"
]

# 家族・友達
FAMILY_FRIENDS = [
    "おかあさん", "おとうさん", "おばあちゃん", "おじいちゃん",
    "おねえさん", "おにいさん", "ともだち", "せんせい"
]

# 場所・移動
PLACES_MOVEMENT = [
    "えき", "がっこう", "ようちえん", "こうえん", "スーパー",
    "いく", "くる", "かえる", "あるく", "はしる"
]

# 食べ物・飲み物
FOOD_DRINK = [
    "おやつ", "アイス", "ジュース", "おちゃ", "ごはん",
    "パン", "くだもの", "やさい", "おいしい", "まずい"
]

# 身体・健康
BODY_HEALTH = [
    "あたま", "おなか", "て", "あし", "め", "はな", "くち",
    "いたい", "だるい", "ねむい", "おなかいたい", "かぜ"
]

# 全語彙を統合（最重要語彙を最初に配置）
ALL_CHILD_VOCABULARY = (
    CRITICAL_VOCABULARY +  # 最重要語彙を最初に配置
    EMOTIONS + TOYS_AND_PLAY + CONFLICTS + DAILY_CONVERSATION +
    FAMILY_FRIENDS + PLACES_MOVEMENT + FOOD_DRINK + BODY_HEALTH
)

# 音声認識用の初期プロンプト生成
def generate_whisper_prompt() -> str:
    """Whisper用の初期プロンプトを生成"""
    vocabulary_text = "、".join(ALL_CHILD_VOCABULARY[:50])
    
    return (
        "句読点は『、。』を使用。半角英数。日付・数値はそのまま数字で。"
        f"以下の語彙を優先使用してください：{vocabulary_text}。"
        "子ども向けの自然な表現を使用。日常会話の語調を維持。"
        "「おもちゃ」は必ず「おもちゃ」と表記。省略形「もちゃ」は使用しない。"
        "「けんか」は必ず「けんか」と表記。"
        "「とられた」は必ず「とられた」と表記。"
        "音声の最初の部分を特に注意深く聞き取ってください。"
        "「おもちゃ」の「お」を聞き逃さないでください。"
        "子どもの発音の特徴を考慮してください。"
    )

# 特定のシチュエーション用プロンプト
def generate_situation_prompt(situation: str) -> str:
    """特定のシチュエーション用のプロンプトを生成"""
    if "おもちゃ" in situation or "とられた" in situation:
        toys_vocab = "、".join(TOYS_AND_PLAY)
        conflicts_vocab = "、".join(CONFLICTS)
        return (
            f"おもちゃや喧嘩に関する語彙を優先：{toys_vocab}、{conflicts_vocab}。"
            "「おもちゃ」は必ず「おもちゃ」と表記。省略形「もちゃ」は使用しない。"
            "音声の最初の部分「おもちゃ」を特に注意深く聞き取ってください。"
            "「お」の音を聞き逃さないでください。"
            "子どもの発音の特徴を考慮してください。"
            "子どもがよく使う表現を重視してください。"
        )
    
    return generate_whisper_prompt()

# 音声認識の精度向上のための補助関数
def get_critical_words() -> List[str]:
    """最重要語彙を取得"""
    return CRITICAL_VOCABULARY.copy()

def get_toys_conflicts_words() -> List[str]:
    """おもちゃ・喧嘩関連の語彙を取得"""
    return TOYS_AND_PLAY + CONFLICTS

def validate_transcription(text: str) -> bool:
    """音声認識結果の検証（「おもちゃ」が正しく認識されているか）"""
    if "もちゃ" in text and "おもちゃ" not in text:
        return False
    return True