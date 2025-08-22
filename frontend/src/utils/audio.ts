//マイク取得（PC/localhost 前提）
export function getAudioConstraints() {
  return {
    audio: {
      channelCount: 1,
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
    },
  } as MediaStreamConstraints;
}

// レコーダー設定 webm に一本化（S3 の Content-Type も webm に揃える）
export type RecorderConfig = {
  ext: 'webm';
  mimeType?: string;      // MediaRecorder に渡す値
  contentType: 'audio/webm'; // S3 presign/PUT と一致させる
};

export function selectRecorderConfig(): RecorderConfig {
  // ブラウザのサポート状況を軽く確認（Chrome/Edge は基本 OK）
  if (typeof window !== 'undefined' && 'MediaRecorder' in window) {
    const is = (t: string) =>
      (window as any).MediaRecorder?.isTypeSupported?.(t) ?? false;

    // 最優先：opus 付き webm（音質・互換バランス◎）
    if (is('audio/webm;codecs=opus')) {
      return {
        ext: 'webm',
        mimeType: 'audio/webm;codecs=opus',
        contentType: 'audio/webm',
      };
    }
    // 次点：コンテナだけ指定
    if (is('audio/webm')) {
      return {
        ext: 'webm',
        mimeType: 'audio/webm',
        contentType: 'audio/webm',
      };
    }
  }

  //フォールバック（古い環境など）: mimeType を指定せずブラウザに任せる
  return {
    ext: 'webm',
    contentType: 'audio/webm',
  };
}

//エラーメッセージ
export function getErrorMessage(err: any): string {
  const name = err?.name || '';
  if (name === 'NotAllowedError' || name === 'SecurityError') {
    return 'マイク権限が必要です。ブラウザの設定で許可してください。';
  }
  if (name === 'NotFoundError' || name === 'OverconstrainedError') {
    return 'マイクが見つかりません。デバイスを確認してください。';
  }
  if (name === 'NotReadableError') {
    return '別のアプリがマイクを使用中かもしれません。アプリを閉じて再試行してください。';
  }
  if (name === 'NotSupportedError') {
    return 'このブラウザは録音に対応していません。最新のChrome/Edgeをご利用ください。';
  }
  return `録音エラー: ${err?.message || String(err)}`;
}