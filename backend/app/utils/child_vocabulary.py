"""
子ども向け音声認識の精度向上と速度最適化のための語彙定義

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
    CRITICAL = "critical"      # 最重要（語頭音節）
    HIGH = "high"              # 高（音節境界）
    MEDIUM = "medium"          # 中（語彙優先）
    LOW = "low"                # 低（処理速度）

@dataclass
class VocabularyCategory:
    """語彙カテゴリの定義"""
    name: str
    words: List[str]
    priority: PromptPriority
    description: str

# 最重要語彙（語頭音節の正確性が最重要）
CRITICAL_VOCABULARY = VocabularyCategory(
    name="最重要語彙",
    words=[
        "おもちゃ", "とられた", "けんか", "けんかした",  # 目標語彙
        "かして", "かえして", "いじわる", "だめ", "やめて"  # 関連語彙
    ],
    priority=PromptPriority.CRITICAL,
    description="音節レベルの正確性が最重要な語彙"
)

# 高優先度語彙（音節境界の明確化）
HIGH_PRIORITY_VOCABULARY = VocabularyCategory(
    name="高優先度語彙",
    words=[
        "おもちゃとられた", "けんかした", "いじわるされた",
        "かして", "かえして", "だめ"
    ],
    priority=PromptPriority.HIGH,
    description="音節境界の明確化が重要な語彙"
)

# 中優先度語彙（一般的な使用頻度）
MEDIUM_PRIORITY_VOCABULARY = VocabularyCategory(
    name="中優先度語彙",
    words=[
        "うれしい", "かなしい", "いらいら", "こわい", "びっくり",
        "たのしい", "つかれた", "ねむい", "おなかすいた", "のどかわいた"
    ],
    priority=PromptPriority.MEDIUM,
    description="一般的な使用頻度の高い語彙"
)

# 低優先度語彙（補助的な語彙）
LOW_PRIORITY_VOCABULARY = VocabularyCategory(
    name="低優先度語彙",
    words=[
        "ブロック", "ぬいぐるみ", "ボール", "おえかき",
        "あそぶ", "もらった", "かって", "かってあげる", "いっしょにあそぼう"
    ],
    priority=PromptPriority.LOW,
    description="補助的な語彙"
)

# 語彙の統合（優先度順）
ALL_VOCABULARY_CATEGORIES = [
    CRITICAL_VOCABULARY,
    HIGH_PRIORITY_VOCABULARY,
    MEDIUM_PRIORITY_VOCABULARY,
    LOW_PRIORITY_VOCABULARY
]

def generate_whisper_prompt(optimization_level: str = "balanced") -> str:
    """
    Whisper用の最適化された初期プロンプトを生成
    
    Args:
        optimization_level: 最適化レベル
            - "precision": 精度重視
            - "speed": 速度重視
            - "balanced": バランス重視（デフォルト）
    
    Returns:
        最適化されたプロンプト文字列
    """
    # 最適化レベルに応じた語彙選択
    if optimization_level == "precision":
        vocabulary_limit = 40
        prompt_emphasis = "【精度最優先】"
    elif optimization_level == "speed":
        vocabulary_limit = 20
        prompt_emphasis = "【速度最優先】"
    else:  # balanced
        vocabulary_limit = 30
        prompt_emphasis = "【精度と速度のバランス】"
    
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
        "・「おもちゃ」の「お」を絶対に聞き逃さない\n"
        "・「とられた」の「と」を確実に認識\n"
        "・「けんか」の「け」を明確に聞き取る\n\n"
        
        "【重要】音節境界の明確化\n"
        "・子音の省略を防ぐ（「おもちゃ」→「もちゃ」にならない）\n"
        "・音節の境界を明確に区切る\n"
        "・語頭の音を特に重視\n\n"
        
        f"【優先語彙】{vocabulary_text}\n\n"
        
        "【処理指示】\n"
        "・確実な音節のみを優先\n"
        "・曖昧な部分は推測せず、明確な部分を重視\n"
        "・処理時間を最小限に抑える\n\n"
        
        "【出力形式】\n"
        "・句読点は『、。』を使用\n"
        "・半角英数\n"
        "・日付・数値はそのまま数字で\n"
        "・子ども向けの自然な表現を使用"
    )

def generate_situation_prompt(situation: str, optimization_level: str = "balanced") -> str:
    """
    特定のシチュエーション用の最適化されたプロンプトを生成
    
    Args:
        situation: シチュエーション文字列
        optimization_level: 最適化レベル
    
    Returns:
        状況別最適化プロンプト
    """
    if "おもちゃ" in situation or "とられた" in situation:
        return (
            "【おもちゃ・喧嘩シチュエーション専用プロンプト】\n\n"
            "【最重要指示】\n"
            "1. 「おもちゃ」の「お」を絶対に聞き逃さない\n"
            "2. 「とられた」の「と」を確実に認識\n"
            "3. 「けんか」の「け」を明確に聞き取る\n\n"
            
            "【音節の優先順位】\n"
            "・語頭の音節を最優先（「お」「と」「け」）\n"
            "・子音の省略を防ぐ\n"
            "・音節境界を明確化\n\n"
            
            "【速度最適化】\n"
            "・確実な音節のみを処理\n"
            "・曖昧な部分は推測しない\n"
            "・処理時間を最小限に\n\n"
            
            "【語彙優先】\n"
            f"・{', '.join(CRITICAL_VOCABULARY.words)}を最優先"
        )
    
    return generate_whisper_prompt(optimization_level)

def generate_fast_prompt() -> str:
    """
    速度重視の短縮プロンプト
    
    Returns:
        最速処理用の短縮プロンプト
    """
    return (
        "【速度最優先】子どもの音声認識：\n"
        "「おもちゃ」「とられた」「けんか」の語頭音を絶対に聞き逃さない。\n"
        "音節境界を明確化。処理速度を最優先。"
    )

def generate_precision_prompt() -> str:
    """
    精度重視の詳細プロンプト
    
    Returns:
        高精度処理用の詳細プロンプト
    """
    return (
        "【精度最優先】子どもの音声認識：\n"
        "語頭音節の絶対的な正確性を最優先。\n"
        "音節境界の明確化を強化。\n"
        "処理速度は二の次。\n"
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

def validate_transcription(text: str) -> Dict[str, any]:
    """
    音声認識結果の詳細検証
    
    Args:
        text: 検証するテキスト
    
    Returns:
        検証結果の辞書
    """
    validation_result = {
        "is_valid": True,
        "issues": [],
        "suggestions": []
    }
    
    # 「おもちゃ」の検証
    if "もちゃ" in text and "おもちゃ" not in text:
        validation_result["is_valid"] = False
        validation_result["issues"].append("「おもちゃ」の「お」が欠落")
        validation_result["suggestions"].append("語頭音節の確認が必要")
    
    # 「とられた」の検証
    if "られた" in text and "とられた" not in text:
        validation_result["issues"].append("「とられた」の「と」が欠落")
        validation_result["suggestions"].append("語頭音節の確認が必要")
    
    # 「けんか」の検証
    if "んか" in text and "けんか" not in text:
        validation_result["issues"].append("「けんか」の「け」が欠落")
        validation_result["suggestions"].append("語頭音節の確認が必要")
    
    return validation_result

def get_optimization_recommendations(current_performance: Dict[str, float]) -> List[str]:
    """
    現在の性能に基づく最適化推奨事項を取得
    
    Args:
        current_performance: 現在の性能指標
    
    Returns:
        最適化推奨事項のリスト
    """
    recommendations = []
    
    if current_performance.get("accuracy", 0) < 0.8:
        recommendations.append("精度重視モードの使用を推奨")
        recommendations.append("語彙の優先度を上げる")
    
    if current_performance.get("speed", 0) > 5.0:
        recommendations.append("速度重視モードの使用を推奨")
        recommendations.append("語彙数を削減")
    
    if current_performance.get("confidence", 0) < -0.5:
        recommendations.append("音節レベルの確認を強化")
        recommendations.append("プロンプトの詳細化を推奨")
    
    return recommendations