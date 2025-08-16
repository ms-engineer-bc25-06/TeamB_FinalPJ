from typing import List, Dict

def score_from_segments(segments: List[Dict]) -> float:
    """avg_logprob（概ね -1.5〜0）を 0.0〜1.0 に正規化。UIゲージ用。"""
    if not segments:
        return 0.0
    avg_lp = sum(s.get("avg_logprob", -1.5) for s in segments) / len(segments)
    min_v, max_v = -1.5, 0.0
    v = max(min_v, min(max_v, avg_lp))
    return round((v - min_v) / (max_v - min_v), 3)
