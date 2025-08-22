'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { getAudioConstraints, selectRecorderConfig, getErrorMessage } from '@/utils/audio';
import { colors, commonStyles, spacing, borderRadius, animation } from '@/styles/theme';

type GetUploadUrlResponse = {
  success: boolean;
  upload_url: string;    // 署名付きPUT URL
  file_path: string;     // ← DBに保存すべき「S3キー」
  s3_url?: string;
  content_type: string;  // 例: audio/webm
};

type TranscriptionResult = {
  success: boolean;
  transcription_id: number;
  text: string;
  confidence: number;
  language: string;
  duration: number;
  processed_at: string;
};

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || '';

export default function VoiceEntryPage() {
  // 認証チェック
  const { user, isLoading } = useAuth();
  const router = useRouter();
  
  // URLパラメータから感情データを取得
  const searchParams = useSearchParams();
  const emotionId = searchParams.get('emotion');
  const intensityLevel = searchParams.get('intensity');

  // ログ出力を追加
  useEffect(() => {
    console.log('[EMOTION] 音声録音: 感情データ確認');
    console.log('[EMOTION] 音声録音: emotionId:', emotionId);
    console.log('[EMOTION] 音声録音: intensityLevel:', intensityLevel);
  }, [emotionId, intensityLevel]);

  // 以降はログイン済み向けの処理
  const [checkingToday, setCheckingToday] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 録音系
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [status, setStatus] = useState<string>('');
  const [isBusy, setIsBusy] = useState(false);
  const [transcription, setTranscription] = useState<TranscriptionResult | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const recConfig = useMemo(() => selectRecorderConfig(), []);

  // 認証前後の制御
  useEffect(() => {
    if (!isLoading && !user) {
      router.replace('/');
    }
  }, [isLoading, user, router]);

  // 今日の記録有無チェック → あれば edit へ
  useEffect(() => {
    const checkToday = async () => {
      if (!user) return;
      if (!API_BASE) {
        setError('環境変数 NEXT_PUBLIC_API_BASE_URL が設定されていません');
        setCheckingToday(false);
        return;
      }
      try {
        const res = await fetch(`${API_BASE}/api/v1/voice/records/${user.id}`);
        if (!res.ok) throw new Error(`records 取得失敗: ${res.status}`);
        const data = await res.json();

        const todayYmd = new Date();
        const y = todayYmd.getFullYear();
        const m = String(todayYmd.getMonth() + 1).padStart(2, '0');
        const d = String(todayYmd.getDate()).padStart(2, '0');
        const ymd = `${y}${m}${d}`;

        const hasToday = (data?.records ?? []).some((r: any) => {
          // backend は created_at を ["YYYYMMDD","HHMMSS"] で返す想定
          if (Array.isArray(r?.created_at) && r.created_at[0]) {
            return r.created_at[0] === ymd;
          }
          // フォールバック: ファイル名から抽出
          const name = String(r?.audio_path || '');
          const m2 = name.match(/audio_(\d{8})_/);
          return m2?.[1] === ymd;
        });

        if (hasToday) {
          router.replace('/app/entries/today/edit');
          return;
        }
      } catch (e: any) {
        // 失敗しても録音UIにフォールバック
        setError(e?.message || '今日の記録確認に失敗しました');
      } finally {
        setCheckingToday(false);
      }
    };

    if (user) checkToday();
  }, [user, router]);

  // --- 録音開始 ---
  const startRecording = async () => {
    try {
      console.log('[RECORDING] 録音開始: 処理開始');
      setError(null);
      setStatus('マイク起動中…');
      setAudioBlob(null);
      setTranscription(null);

      const stream = await navigator.mediaDevices.getUserMedia(getAudioConstraints());
      streamRef.current = stream;

      const rec = new MediaRecorder(stream, recConfig.mimeType ? { mimeType: recConfig.mimeType } : undefined);
      mediaRecorderRef.current = rec;
      chunksRef.current = [];

      rec.ondataavailable = (e) => e?.data && e.data.size > 0 && chunksRef.current.push(e.data);
      rec.onerror = (ev) => setError(`録音エラー: ${(ev as any).error?.message || 'unknown'}`);
      rec.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recConfig.contentType });
        setAudioBlob(blob);
        stopStream();
        setStatus('録音完了。アップロードできます。');
      };

      console.log('[RECORDING] 録音開始: マイク起動成功');
      rec.start();
      setIsRecording(true);
      setStatus('録音中…');
    } catch (err: any) {
      console.error('[RECORDING] 録音開始: エラー発生', err);
      stopStream();
      setError(getErrorMessage(err));
      setStatus('録音できませんでした');
      setIsRecording(false);
    }
  };

  // --- 録音停止 ---
  const stopRecording = () => {
    if (!isRecording) return;
    try {
      mediaRecorderRef.current?.stop();
    } finally {
      setIsRecording(false);
    }
  };

  const stopStream = () => {
    try {
      streamRef.current?.getTracks()?.forEach((t) => t.stop());
    } catch {}
    streamRef.current = null;
  };

  // --- S3アップロード → Whisper → DB保存 ---
  const uploadAndSave = async () => {
    if (!audioBlob) return;
    if (!user) return;

    console.log('[UPLOAD] アップロード保存: 処理開始');
    console.log('[EMOTION] アップロード保存: 感情データ確認');
    console.log('[EMOTION] アップロード保存: emotionId:', emotionId);
    console.log('[EMOTION] アップロード保存: intensityLevel:', intensityLevel);

    // 感情データの確認
    if (!emotionId || !intensityLevel) {
      console.error('[EMOTION] アップロード保存: 感情データ不足');
      setError('感情データが不足しています。感情選択画面から再度お試しください。');
      return;
    }

    setIsBusy(true);
    setError(null);
    setStatus('API接続確認中…');

    try {
      // 1) ヘルスチェック
      console.log('[HEALTH] アップロード保存: ヘルスチェック開始');
      const health = await fetch(`${API_BASE}/api/v1/voice/health`);
      if (!health.ok) throw new Error(`ヘルスチェック失敗: ${health.status}`);
      console.log('[HEALTH] アップロード保存: ヘルスチェック成功');

      // 2) PUT用URL取得
      console.log('[S3] アップロード保存: S3アップロードURL取得開始');
      setStatus('S3アップロード用URLを取得中…');
      const upRes = await fetch(`${API_BASE}/api/v1/voice/get-upload-url`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          file_type: 'audio',
          file_format: recConfig.ext, // 'webm' を送る
        }),
      });
      if (!upRes.ok) throw new Error(`アップロードURL取得失敗: ${upRes.status} ${await upRes.text()}`);
      const upData: GetUploadUrlResponse = await upRes.json();
      console.log('[S3] アップロード保存: S3アップロードURL取得成功:', upData.file_path);

      // 3) S3 に PUT
      console.log('[S3] アップロード保存: S3アップロード開始');
      setStatus('S3へアップロード中…');
      const put = await fetch(upData.upload_url, {
        method: 'PUT',
        headers: { 'Content-Type': upData.content_type },
        body: audioBlob,
      });
      if (!put.ok) throw new Error(`S3アップロード失敗: ${put.status} ${await put.text()}`);
      console.log('[S3] アップロード保存: S3アップロード成功');

      // 4) Whisper 文字起こし
      console.log('[TRANSCRIPTION] アップロード保存: 音声認識開始');
      setStatus('音声を文字に変換中…');
      const tr = await fetch(`${API_BASE}/api/v1/voice/transcribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // ← backendは「S3キー」も受け付けるので、key をそのまま送る
        body: JSON.stringify({
          user_id: user.id,
          audio_file_path: upData.file_path,
          language: 'ja',
        }),
      });
      if (!tr.ok) throw new Error(`音声認識失敗: ${tr.status} ${await tr.text()}`);
      const trData: TranscriptionResult = await tr.json();
      setTranscription(trData);
      console.log('[TRANSCRIPTION] アップロード保存: 音声認識成功:', trData.text);

      // 5) DB に key を保存（感情データ付き）
      console.log('[DATABASE] アップロード保存: データベース保存開始');
      setStatus('記録を保存中…');
      const save = await fetch(`${API_BASE}/api/v1/voice/save-record`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          audio_file_path: upData.file_path,
          text_file_path: null, // 将来: テキストもS3に保存したらここに key を入れる
          // 感情データを追加
          emotion_card_id: emotionId,
          intensity_id: intensityLevel,
          child_id: '41489976-63ee-4332-85f4-6d9200a79bfc', // 作成した子供のID
        }),
      });
      if (!save.ok) throw new Error(`記録保存失敗: ${save.status} ${await save.text()}`);
      console.log('[DATABASE] アップロード保存: データベース保存成功');

      setStatus('保存完了！「きょうの記録」に移動します…');
      setTimeout(() => router.replace('/app/entries/today'), 600);
    } catch (e: any) {
      console.error('[ERROR] アップロード保存: エラー発生', e);
      setError(e?.message || '処理中にエラーが発生しました');
      setStatus('エラーが発生しました');
    } finally {
      setIsBusy(false);
    }
  };

  // 認証判定中 or 未ログインでリダイレクト待ち
  if (isLoading || !user) {
    return (
      <main style={{
        display: 'grid',
        placeItems: 'center',
        minHeight: '60vh',
        color: colors.text.secondary,
      }}>
        <p>読み込み中...</p>
      </main>
    );
  }

  // 今日の記録チェック中（ある場合はこの後 edit へリダイレクト）
  if (checkingToday) {
    return (
      <main style={{
        display: 'grid',
        placeItems: 'center',
        minHeight: '60vh',
        color: colors.text.secondary,
      }}>
        <p>きょうの記録を確認中…</p>
      </main>
    );
  }

  // 感情データが不足している場合
  if (!emotionId || !intensityLevel) {
    return (
      <main style={{
        maxWidth: 720,
        margin: '0 auto',
        padding: spacing.xl,
        background: 'url("/images/background.webp") no-repeat center center',
        backgroundSize: 'cover',
        minHeight: '100vh',
      }}>
        <h1 style={{
          fontSize: '22px',
          fontWeight: 700,
          marginBottom: spacing.sm,
          color: colors.text.primary,
        }}>
          感情データが不足しています
        </h1>
        <p style={{
          marginBottom: spacing.md,
          color: colors.text.secondary,
        }}>
          感情選択画面から再度お試しください。
        </p>
        <button
          onClick={() => router.push('/app/emotion-selection')}
          style={{
            ...commonStyles.button.base,
            padding: `${spacing.md} ${spacing.lg}`,
            borderRadius: borderRadius.medium,
            backgroundColor: colors.primary,
            color: colors.text.white,
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          感情選択に戻る
        </button>
      </main>
    );
  }

  // 録音UI
  return (
    // 背景全体をカバーするラッパー
    <div style={{
      background: 'url("/images/background.webp") no-repeat center center',
      backgroundSize: 'cover',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <main style={{
        position: 'fixed',
        top: '0',
        left: '50%',
        transform: 'translateX(-50%)',
        bottom: 0,
        padding: '10px 0 0 0',
        zIndex: 50,
        boxSizing: 'border-box',
        width: '100%',
        maxWidth: '600px',
        overflowX: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        backdropFilter: 'blur(10px)',
        background: 'transparent',
        gap: '8px',
      }}>

        {/* こころんキャラクター */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '16px',
          marginBottom: '20px',
          marginTop: '20px',
        }}>
          <img
            src="/images/kokoron/kokoron_mic.webp"
            alt="マイクを持つこころん"
            style={{
              width: '250px',
              height: '250px',
              objectFit: 'contain',
            }}
          />
        </div>

        {/* 白枠の囲い（こころんおしゃべりコメント） */}
        <div style={{
          background: '#ffffff',
          borderRadius: '16px',
          padding: '16px 20px',
          boxShadow: '0 6px 16px rgba(0, 0, 0, 0.15)',
          width: '80%',
          maxWidth: '320px',
          boxSizing: 'border-box',
          textAlign: 'center',
          marginBottom: '20px',
        }}>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            alignItems: 'center',
          }}>
            <span style={{
              fontWeight: 'bold',
              fontSize: '24px',
              lineHeight: 1.2,
              margin: 0,
              color: '#333',
            }}>
              どうしてそのきもちになったのかな？
            </span>
          </div>
        </div>

        {/* 感情データの表示 */}
        <div style={{
          marginBottom: spacing.md,
          padding: spacing.md,
          borderRadius: borderRadius.medium,
          border: `1px solid ${colors.border.light}`,
          background: colors.background.white,
          boxShadow: colors.shadow.light,
          width: '100%',
          maxWidth: '320px',
          textAlign: 'center',
        }}>
          <div style={{
            fontWeight: 700,
            marginBottom: spacing.xs,
            color: colors.text.primary,
          }}>
            選択された感情
          </div>
          <div style={{
            fontSize: '14px',
            color: colors.text.secondary,
          }}>
            感情ID: {emotionId} / 強度: {intensityLevel}
          </div>
        </div>

        {/* ステータス */}
        {(status || error) && (
          <div
            style={{
              margin: `${spacing.md} 0`,
              padding: spacing.md,
              borderRadius: borderRadius.medium,
              border: `1px solid ${error ? '#f5c2c7' : colors.border.light}`,
              background: error ? '#fdecee' : '#fafafa',
              color: error ? '#842029' : colors.text.primary,
              width: '100%',
              maxWidth: '320px',
              textAlign: 'center',
            }}
          >
            <div style={{ fontWeight: 600 }}>{status}</div>
            {error && <div style={{ marginTop: spacing.xs }}>{error}</div>}
          </div>
        )}

        {/* ボタンコンテナ */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '19px',
          width: '100%',
          maxWidth: '320px',
          justifyContent: 'center',
          alignItems: 'center',
          marginBottom: '20px',
        }}>
          {/* 録音ボタン */}
          <button
            onClick={isRecording ? stopRecording : startRecording}
            disabled={isBusy}
            style={{
              background: '#ffffff',
              border: `8px solid ${isRecording ? '#ffb3b3' : colors.primary}`,
              borderRadius: '12px',
              padding: '16px 12px',
              cursor: isBusy ? 'not-allowed' : 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.3s ease',
              fontSize: '18px',
              fontWeight: 'bold',
              color: '#000000',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
              minHeight: '100px',
              justifyContent: 'center',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
              width: '100%',
              maxWidth: '100%',
              boxSizing: 'border-box',
              overflow: 'hidden',
              position: 'relative',
              ...(isBusy && {
                backgroundColor: '#ccc',
                cursor: 'not-allowed',
                transform: 'none',
                boxShadow: 'none',
              }),
            }}
          >
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%',
              height: '100%',
              gap: '12px',
            }}>
              <span style={{
                fontSize: '24px',
                fontWeight: 'bold',
              }}>
                {isRecording ? '[STOP] 停止' : '[RECORD] 録音開始'}
              </span>
            </div>
          </button>

          {/* アップロード・保存ボタン */}
          <button
            onClick={uploadAndSave}
            disabled={!audioBlob || isBusy}
            style={{
              background: '#ffffff',
              border: `8px solid ${!audioBlob || isBusy ? '#ccc' : '#10b981'}`,
              borderRadius: '12px',
              padding: '8px 16px',
              cursor: !audioBlob || isBusy ? 'not-allowed' : 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.3s ease',
              fontSize: '16px',
              fontWeight: 'bold',
              color: '#000000',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
              minHeight: '60px',
              justifyContent: 'center',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
              width: '100%',
              maxWidth: '100%',
              boxSizing: 'border-box',
              overflow: 'hidden',
              position: 'relative',
              ...((!audioBlob || isBusy) && {
                backgroundColor: '#ccc',
                cursor: 'not-allowed',
                transform: 'none',
                boxShadow: 'none',
              }),
            }}
          >
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%',
              height: '100%',
              gap: '12px',
            }}>
              <span style={{
                fontSize: '18px',
                fontWeight: 'bold',
              }}>
                ⬆︎ アップロード → 保存
              </span>
            </div>
          </button>

          {/* 取り直すボタン（子供でも分かりやすい） */}
          <button
            onClick={() => {
              setAudioBlob(null);
              setTranscription(null);
              setStatus('');
              setError(null);
            }}
            disabled={isBusy}
            style={{
              background: '#ffffff',
              border: `8px solid ${isBusy ? '#ccc' : colors.border.light}`,
              borderRadius: '12px',
              padding: '8px 16px',
              cursor: isBusy ? 'not-allowed' : 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.3s ease',
              fontSize: '16px',
              fontWeight: 'bold',
              color: '#000000',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
              minHeight: '60px',
              justifyContent: 'center',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
              width: '100%',
              maxWidth: '100%',
              boxSizing: 'border-box',
              overflow: 'hidden',
              position: 'relative',
              ...(isBusy && {
                cursor: 'not-allowed',
                opacity: 0.6,
              }),
            }}
          >
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%',
              height: '100%',
              gap: '12px',
            }}>
              <span style={{
                fontSize: '18px',
                fontWeight: 'bold',
              }}>
                もどる
              </span>
            </div>
          </button>
        </div>

        {/* プレビュー */}
        {audioBlob && (
          <div style={{ 
            marginTop: spacing.md,
            width: '100%',
            maxWidth: '320px',
            textAlign: 'center',
          }}>
            <audio controls src={URL.createObjectURL(audioBlob)} style={{ width: '100%' }} />
            <div style={{
              fontSize: '12px',
              color: colors.text.secondary,
              marginTop: spacing.xs,
            }}>
              形式: {recConfig.ext} / {(audioBlob.size / 1024).toFixed(1)} KB
            </div>
          </div>
        )}

        {/* 文字起こし結果 */}
        {transcription && (
          <div
            style={{
              marginTop: spacing.md,
              padding: spacing.md,
              borderRadius: borderRadius.medium,
              border: `1px solid ${colors.border.light}`,
              background: colors.background.white,
              boxShadow: colors.shadow.light,
              width: '100%',
              maxWidth: '320px',
              textAlign: 'center',
            }}
          >
            <div style={{
              fontWeight: 700,
              marginBottom: spacing.xs,
              color: colors.text.primary,
            }}>
              文字起こし
            </div>
            <div style={{
              whiteSpace: 'pre-wrap',
              lineHeight: 1.6,
              color: colors.text.primary,
            }}>
              {transcription.text || '—'}
            </div>
            {typeof transcription.confidence === 'number' && (
              <div style={{
                fontSize: '12px',
                color: colors.text.secondary,
                marginTop: spacing.sm,
              }}>
                信頼度: {(transcription.confidence * 100).toFixed(1)}%
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}