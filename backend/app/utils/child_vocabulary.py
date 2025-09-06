"""
子ども向け音声認識の精度向上のための語彙定義とプロンプト生成

このモジュールは、Whisperの音声認識精度を向上させるための
初期プロンプトを生成し、子どもの感情表現と日常会話に特化した
最適化を行います。

主な機能:
- 感情表現語彙の優先指定
- 日常会話の認識精度向上
- 子どもの発音特徴への対応
"""

from typing import List
from dataclasses import dataclass
from enum import Enum


class PromptPriority(Enum):
    """プロンプトの優先度レベル（感情表現の重要度に基づく）"""

    CRITICAL = "critical"  # 最重要（基本的な感情表現と家族）
    HIGH = "high"  # 高（日常的な活動とコミュニケーション）
    MEDIUM = "medium"  # 中（遊びや状況に応じた語彙）
    LOW = "low"  # 低（補助的な語彙）


@dataclass
class VocabularyCategory:
    """語彙カテゴリの定義（子どもの発達段階に応じた語彙分類）"""

    name: str  # カテゴリ名
    words: List[str]  # 語彙リスト
    priority: PromptPriority  # 優先度
    description: str  # カテゴリの説明


# 最重要語彙：基本的な感情表現と家族の呼び方
CRITICAL_VOCABULARY = VocabularyCategory(
    name="最重要語彙",
    words=[
        "ママ",
        "パパ",
        "楽しい",
        "悲しい",
        "怒る",
        "嬉しい",
        "おもちゃ",
        "遊ぶ",
        "泣く",
        "笑う",
        "嫌だ",
        "好き",
    ],
    priority=PromptPriority.CRITICAL,
    description="基本的な感情表現と家族の呼び方（最重要）",
)

# 高優先度語彙：日常的な活動と基本的なコミュニケーション
HIGH_PRIORITY_VOCABULARY = VocabularyCategory(
    name="高優先度語彙",
    words=[
        "食べる",
        "飲む",
        "寝る",
        "起きる",
        "行く",
        "来る",
        "一緒に",
        "一人で",
        "貸して",
        "ありがとう",
        "ごめん",
        "ダメ",
        "プールに行く",
        "プールに行くよ",
        "プールに行きたい",
    ],
    priority=PromptPriority.HIGH,
    description="日常的な活動と基本的なコミュニケーション",
)

# 中優先度語彙：遊びや状況に応じた語彙
MEDIUM_PRIORITY_VOCABULARY = VocabularyCategory(
    name="中優先度語彙",
    words=[
        "おもちゃ",
        "本",
        "絵",
        "歌",
        "踊る",
        "走る",
        "けんか",
        "仲良く",
        "優しく",
        "怖い",
        "痛い",
        "大丈夫",
        "プール",
        "水泳",
        "泳ぐ",
        "水",
    ],
    priority=PromptPriority.MEDIUM,
    description="遊びや状況に応じた語彙",
)

# 低優先度語彙：補助的な語彙（現在は使用しない）
LOW_PRIORITY_VOCABULARY = VocabularyCategory(
    name="低優先度語彙",
    words=[],  # 将来の拡張用
    priority=PromptPriority.LOW,
    description="補助的な語彙（将来の拡張用）",
)

ALL_VOCABULARY_CATEGORIES = [
    CRITICAL_VOCABULARY,
    HIGH_PRIORITY_VOCABULARY,
    MEDIUM_PRIORITY_VOCABULARY,
    LOW_PRIORITY_VOCABULARY,
]


def generate_whisper_prompt(optimization_level: str = "balanced") -> str:
    """
    Whisper用の最適化された初期プロンプトを生成

    子どもの感情表現と日常会話に特化したプロンプトを生成し、
    音声認識の精度を向上させます。

    Args:
        optimization_level: 最適化レベル
            - "precision": 精度重視（語彙数15個、詳細な指示）
            - "speed": 速度重視（語彙数8個、簡潔な指示）
            - "balanced": バランス重視（語彙数10個、デフォルト）

    Returns:
        最適化されたプロンプト文字列（感情表現重視）
    """
    # 最適化レベルに応じた語彙選択（感情表現の重要度に基づく）
    if optimization_level == "precision":
        vocabulary_limit = 15  # 精度重視：多くの語彙で詳細な認識
        prompt_emphasis = "【精度重視】"
    elif optimization_level == "speed":
        vocabulary_limit = 8  # 速度重視：最小限の語彙で高速処理
        prompt_emphasis = "【速度最優先】"
    else:  # balanced
        vocabulary_limit = 10  # バランス重視：適度な語彙数で効率的な処理
        prompt_emphasis = "【バランス】"

    # 優先度順に語彙を選択（感情表現の重要度に基づく）
    selected_words = []
    for category in ALL_VOCABULARY_CATEGORIES:
        if len(selected_words) < vocabulary_limit:
            remaining_slots = vocabulary_limit - len(selected_words)
            selected_words.extend(category.words[:remaining_slots])

    vocabulary_text = "、".join(selected_words)

    return (
        f"{prompt_emphasis} 子どもの音声認識最適化プロンプト\n\n"
        "【文脈】今日は楽しい一日でした。ママと一緒に過ごして、プールに行って遊びました。\n\n"
        "【最重要】感情表現の正確な認識\n"
        "・「楽しい」「悲しい」「怒る」「嬉しい」を確実に区別\n"
        "・「ママ」「パパ」の呼び方を正確に認識\n"
        "・「嫌だ」「好き」の感情を正確に把握\n"
        "・濁音・半濁音の正確な認識\n"
        "\n【重要】日常会話の理解\n"
        "・「食べる」「飲む」「寝る」などの基本動作\n"
        "・「一緒に」「一人で」などの状況表現\n"
        "・「ありがとう」「ごめん」などの挨拶\n"
        "・「プールに行く」「プールに行くよ」などの活動表現\n"
        f"\n【優先語彙】{vocabulary_text}\n\n"
        "【処理指示】\n"
        "・感情表現を最優先で認識\n"
        "・子どもの発音の特徴を考慮（「プール」は「プール」と認識）\n"
        "・文脈から意味を推測\n"
        "・活動表現（「〜に行く」「〜に行くよ」）を正確に認識\n"
        "\n【出力形式】\n"
        "・自然な日本語として出力\n"
        "・感情のニュアンスを保持\n"
        "・子どもの話し方の特徴を反映"
    )
