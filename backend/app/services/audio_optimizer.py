import subprocess
import tempfile
import os
import logging
from typing import Optional

logger = logging.getLogger(__name__)

class AudioOptimizer:
    """最小限の音声最適化クラス"""
    
    def __init__(self):
        self.ffmpeg_path = "ffmpeg"
        self.temp_dir = tempfile.gettempdir()
    
    def optimize_for_whisper(self, input_path: str) -> Optional[str]:
        """Whisper用に音声を最適化"""
        try:
            # 一時ファイルの作成
            temp_file = tempfile.NamedTemporaryFile(
                delete=False,
                suffix='.wav',
                dir=self.temp_dir
            )
            output_path = temp_file.name
            temp_file.close()
            
            # FFmpegコマンド実行
            cmd = [
                self.ffmpeg_path,
                '-i', input_path,
                '-ar', '16000',      # 16kHz
                '-ac', '1',          # モノラル
                '-c:a', 'pcm_s16le', # 16bit PCM
                '-af', 'loudnorm',   # 音量正規化
                '-y',
                output_path
            ]
            
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=60)
            
            if result.returncode == 0:
                return output_path
            else:
                logger.warning(f"FFmpeg最適化失敗: {result.stderr}")
                return None
                
        except Exception as e:
            logger.warning(f"音声最適化エラー: {str(e)}")
            return None
    
    def cleanup_temp_file(self, file_path: str):
        """一時ファイルの削除"""
        try:
            if os.path.exists(file_path):
                os.remove(file_path)
        except Exception:
            pass