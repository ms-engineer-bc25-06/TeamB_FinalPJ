import subprocess

def _run(cmd: list[str]) -> str:
    return subprocess.check_output(cmd).decode("utf-8", errors="ignore")

def normalize_to_wav16k_mono(src: str, dst: str) -> None:
    _run([
        "ffmpeg","-y","-i",src,
        "-ac","1","-ar","16000","-c:a","pcm_s16le",
        "-af","silenceremove=start_periods=1:start_threshold=-35dB:start_silence=0.2:detection=peak,"
              "loudnorm=I=-20:TP=-1.0:LRA=11",
        dst
    ])

def ffprobe_duration_seconds(path: str) -> float:
    try:
        out = _run([
            "ffprobe","-v","error",
            "-show_entries","format=duration",
            "-of","default=noprint_wrappers=1:nokey=1",
            path
        ]).strip()
        return float(out) if out else 0.0
    except Exception:
        return 0.0
