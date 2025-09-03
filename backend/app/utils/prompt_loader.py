from pathlib import Path

_BASE = Path(__file__).resolve().parents[1] / "config" / "prompt_base.txt"


def load_base_prompt() -> str:
    try:
        return _BASE.read_text(encoding="utf-8").strip()
    except FileNotFoundError:
        return (
            "日本語の子どもの発話を句読点つきで丁寧に書き起こしてください。"
            "強さの言い方例：ちょっと/ふつう/すごく。固有名詞は原文どおり。推測はしない。"
        )
