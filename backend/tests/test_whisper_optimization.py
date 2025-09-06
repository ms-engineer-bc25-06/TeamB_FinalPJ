"""
Whisper音声認識の最小限テスト

テスト対象:
- プロンプト生成
- 基本的な音声認識
"""

from app.utils.child_vocabulary import generate_whisper_prompt


class TestWhisperBasic:
    """Whisper音声認識の基本テストクラス"""

    def test_prompt_generation(self):
        """プロンプト生成のテスト"""
        # プロンプトを生成
        prompt = generate_whisper_prompt()

        # 基本的な検証
        assert isinstance(prompt, str)
        assert len(prompt) > 0
        assert "プール" in prompt
        assert "ママ" in prompt

    def test_prompt_contains_basic_terms(self):
        """基本的な語彙がプロンプトに含まれているかテスト"""
        prompt = generate_whisper_prompt()

        # 基本的な語彙の確認
        basic_terms = ["ママ", "パパ", "楽しい"]

        for term in basic_terms:
            assert term in prompt, f"プロンプトに'{term}'が含まれていません"
