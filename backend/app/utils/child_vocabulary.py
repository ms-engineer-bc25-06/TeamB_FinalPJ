"""
子ども向け音声認識の精度向上と速度最適化のための語彙定義（高速版）

このモジュールは、OpenAI Whisperの音声認識精度を向上させるための
初期プロンプトを生成し、子どもの発音特徴に特化した最適化を行います。

主な機能:
- 重要語彙の優先指定
- 音節レベルの正確性向上
- 処理速度の最適化
- 状況別プロンプトの生成
"""

from typing import List, Dict, Optional
from dataclasses import dataclass
from enum import Enum


class PromptPriority(Enum):
    """プロンプトの優先度レベル"""

    CRITICAL = "critical"  # 最重要（語頭音節）
    HIGH = "high"  # 高（音節境界）
    MEDIUM = "medium"  # 中（語彙優先）
    LOW = "low"  # 低（処理速度）


@dataclass
class VocabularyCategory:
    """語彙カテゴリの定義"""

    name: str
    words: List[str]
    priority: PromptPriority
    description: str


# 最重要語彙（語頭音節の正確性が最重要）- 最小限に絞り込み
CRITICAL_VOCABULARY = VocabularyCategory(
    name="最重要語彙",
    words=[
        "ボール",
        "ボールとられた",  # ボール関連のみに絞り込み
        "とられた",
        "けんか",  # 基本的な語彙のみ
    ],
    priority=PromptPriority.CRITICAL,
    description="音節レベルの正確性が最重要な語彙（最小限）",
)

# 高優先度語彙（音節境界の明確化）- 削減
HIGH_PRIORITY_VOCABULARY = VocabularyCategory(
    name="高優先度語彙",
    words=["ボールあそび", "ボールなげた"],  # ボール関連のみ
    priority=PromptPriority.HIGH,
    description="音節境界の明確化が重要な語彙（削減版）",
)

# 中優先度語彙（一般的な使用頻度）- 大幅削減
MEDIUM_PRIORITY_VOCABULARY = VocabularyCategory(
    name="中優先度語彙",
    words=["ボール", "おもちゃ", "あそび"],  # 基本的な語彙のみ
    priority=PromptPriority.MEDIUM,
    description="一般的な使用頻度の高い語彙（削減版）",
)

# 低優先度語彙（補助的な語彙）- 削除
LOW_PRIORITY_VOCABULARY = VocabularyCategory(
    name="低優先度語彙",
    words=[],  # 空にする
    priority=PromptPriority.LOW,
    description="補助的な語彙（削除）",
)

# 語彙の統合（優先度順）
ALL_VOCABULARY_CATEGORIES = [
    CRITICAL_VOCABULARY,
    HIGH_PRIORITY_VOCABULARY,
    MEDIUM_PRIORITY_VOCABULARY,
    LOW_PRIORITY_VOCABULARY,
]


def generate_whisper_prompt(optimization_level: str = "balanced") -> str:
    """
    Whisper用の最適化された初期プロンプトを生成（高速版）

    Args:
        optimization_level: 最適化レベル
            - "precision": 精度重視
            - "speed": 速度重視
            - "balanced": バランス重視（デフォルト）

    Returns:
        最適化されたプロンプト文字列
    """
    # 最適化レベルに応じた語彙選択（大幅削減）
    if optimization_level == "precision":
        vocabulary_limit = 15  # 30 → 15に削減
        prompt_emphasis = "【精度重視】"
    elif optimization_level == "speed":
        vocabulary_limit = 8  # 15 → 8に削減
        prompt_emphasis = "【速度最優先】"
    else:  # balanced
        vocabulary_limit = 10  # 20 → 10に削減
        prompt_emphasis = "【バランス】"

    # 優先度順に語彙を選択
    selected_words = []
    for category in ALL_VOCABULARY_CATEGORIES:
        if len(selected_words) < vocabulary_limit:
            remaining_slots = vocabulary_limit - len(selected_words)
            selected_words.extend(category.words[:remaining_slots])

    vocabulary_text = "、".join(selected_words)

    return (
        f"{prompt_emphasis} 子どもの音声認識最適化プロンプト\n\n"
        "【絶対条件】語頭音節の正確性\n"
        "・「ボール」の「ぼ」を確実に認識\n"
        "・「ポール」との混同を防ぐ\n"
        "・「ボールとられた」の「ぼ」と「と」を絶対に聞き逃さない\n"
        "・濁音「ぼ」「と」の正確な認識\n"
        "\n【重要】音節境界の明確化\n"
        "・「ボールとられた」の各音節を明確に区切る\n"
        "・語頭の音を特に重視\n"
        f"\n【優先語彙】{vocabulary_text}\n\n"
        "【処理指示】\n"
        "・確実な音節のみを優先\n"
        "・「ボールとられた」の認識精度を最優先\n"
        "・処理時間を最小限に抑える\n"
        "【出力形式】\n"
        "・「ボールとられた」は正確にそのまま出力"
    )


def generate_situation_prompt(
    situation: str, optimization_level: str = "balanced"
) -> str:
    """
    特定のシチュエーション用の最適化されたプロンプトを生成（高速版）

    Args:
        situation: シチュエーション文字列
        optimization_level: 最適化レベル

    Returns:
        状況別最適化プロンプト
    """
    # ボール関連のシチュエーション専用プロンプト（簡潔版）
    if "ボール" in situation or "とられた" in situation:
        return (
            "【ボール・とられた専用プロンプト】\n\n"
            "【最重要指示】\n"
            "1. 「ボール」の「ぼ」を絶対に「ぽ」と混同しない\n"
            "2. 「とられた」の「と」を確実に認識\n"
            "3. 「ボールとられた」全体を正確に認識\n"
            "【音節認識】\n"
            "・「ぼーる」の3音節、「と-ら-れ-た」の4音節を正確に認識\n"
            "・語頭音節「ぼ」「と」の優先度を最高レベルに設定\n"
            "【処理優先度】\n"
            "・「ボールとられた」の認識精度を最優先\n"
            "・確実な音節のみを処理\n"
            "【語彙優先】\n"
            f"・{', '.join(CRITICAL_VOCABULARY.words)}を最優先"
        )

    return generate_whisper_prompt(optimization_level)


def generate_fast_prompt() -> str:
    """
    速度重視の短縮プロンプト（最速版）

    Returns:
        最速処理用の短縮プロンプト
    """
    return (
        "【最速】子どもの音声認識：\n"
        "「ボール」の「ぼ」を確実に認識、「ポール」との混同を防ぐ。\n"
        "「ボールとられた」の「ぼ」と「と」を絶対に聞き逃さない。\n"
        "処理速度を最優先。"
    )


def generate_precision_prompt() -> str:
    """
    精度重視の詳細プロンプト（簡潔版）

    Returns:
        高精度処理用の詳細プロンプト
    """
    return (
        "【精度重視】子どもの音声認識：\n"
        "「ボール」の「ぼ」を絶対に「ぽ」と混同しない。\n"
        "「ボールとられた」の各音節を最優先で認識。\n"
        f"重要語彙：{', '.join(CRITICAL_VOCABULARY.words)}"
    )


def get_vocabulary_by_priority(priority: PromptPriority) -> List[str]:
    """
    優先度別に語彙を取得

    Args:
        priority: 優先度レベル

    Returns:
        指定された優先度の語彙リスト
    """
    for category in ALL_VOCABULARY_CATEGORIES:
        if category.priority == priority:
            return category.words.copy()
    return []


def get_critical_words() -> List[str]:
    """最重要語彙を取得（後方互換性のため）"""
    return CRITICAL_VOCABULARY.words.copy()


def get_toys_conflicts_words() -> List[str]:
    """おもちゃ・喧嘩関連の語彙を取得（後方互換性のため）"""
    return CRITICAL_VOCABULARY.words + HIGH_PRIORITY_VOCABULARY.words


def get_ball_related_words() -> List[str]:
    """ボール関連の語彙を取得（新機能追加）"""
    ball_words = []
    for category in ALL_VOCABULARY_CATEGORIES:
        for word in category.words:
            if "ボール" in word:
                ball_words.append(word)
    return ball_words


def validate_transcription(text: str) -> Dict[str, any]:
    """
    音声認識結果の詳細検証（簡潔版）

    Args:
        text: 検証するテキスト

    Returns:
        検証結果の辞書
    """
    validation_result = {"is_valid": True, "issues": [], "suggestions": []}

    # 「ボール」の検証（ボール関連のみ）
    if "ール" in text and "ボール" not in text:
        validation_result["is_valid"] = False
        validation_result["issues"].append("「ボール」の「ぼ」が欠落")
        validation_result["suggestions"].append("語頭音節の確認が必要")

    # 「ボールとられた」の検証
    if "ールとられた" in text and "ボールとられた" not in text:
        validation_result["issues"].append("「ボールとられた」の「ぼ」が欠落")
        validation_result["suggestions"].append("語頭音節の確認が必要")

    # 「ポール」との混同チェック
    if "ポール" in text and "ボール" in text:
        validation_result["issues"].append("「ボール」と「ポール」の混同の可能性")
        validation_result["suggestions"].append("濁音・半濁音の確認が必要")

    return validation_result


def get_optimization_recommendations(
    current_performance: Dict[str, float],
) -> List[str]:
    """
    現在の性能に基づく最適化推奨事項を取得（簡潔版）

    Args:
        current_performance: 現在の性能指標

    Returns:
        最適化推奨事項のリスト
    """
    recommendations = []

    if current_performance.get("accuracy", 0) < 0.8:
        recommendations.append("精度重視モードの使用を推奨")
        recommendations.append("「ボールとられた」の認識精度を強化")

    if current_performance.get("speed", 0) > 5.0:
        recommendations.append("速度重視モードの使用を推奨")
        recommendations.append("語彙数を削減")

    if current_performance.get("confidence", 0) < -0.5:
        recommendations.append("「ボール」の濁音認識を強化")

    return recommendations
