'use client';

import { AudioPlayer } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { borderRadius, colors, spacing } from '@/styles/theme';
import {
  getAudioConstraints,
  getErrorMessage,
  selectRecorderConfig,
} from '@/utils/audio';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useMemo, useRef, useState } from 'react';

type GetUploadUrlResponse = {
  success: boolean;
  upload_url: string;
  file_path: string;
  s3_url?: string;
  content_type: string;
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

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;
if (!API_BASE) {
  throw new Error('NEXT_PUBLIC_API_BASE_URL が設定されていません');
}

// メインコンポーネント（Suspenseでラップ）
export default function VoiceEntryPage() {
  return (
    <Suspense fallback={<div>読み込み中...</div>}>
      <VoicePageContent />
    </Suspense>
  );
}

// 既存のコンポーネントをVoicePageContentにリネーム
function VoicePageContent() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  const searchParams = useSearchParams();
  const emotionId = searchParams.get('emotion');
  const intensityLevel = searchParams.get('intensity');
  const childId = searchParams.get('child');

  useEffect(() => {
    console.log('[EMOTION]', { emotionId, intensityLevel });
  }, [emotionId, intensityLevel]);

  const [checkingToday, setCheckingToday] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  // 録音系
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [status, setStatus] = useState<string>('');
  const [transcription, setTranscription] =
    useState<TranscriptionResult | null>(null);
  const [recordingStartTime, setRecordingStartTime] = useState<number | null>(
    null,
  );

  // 完了ステップ管理
  const [completionStep, setCompletionStep] = useState<
    'recording' | 'completed' | 'finished'
  >('recording');

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const recConfig = useMemo(() => selectRecorderConfig(), []);

  // 再生
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const handleBack = () => router.push('/app/emotion-confirmation');

  // レイアウト
  const LAYOUT = { maxWidth: 430, cardMaxWidth: 360 };

  // 1. レイアウト関連スタイル
  const layoutStyles = {
    page: {
      background: 'url("/images/background.webp") no-repeat center center',
      backgroundSize: 'cover',
      minHeight: '100dvh',
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'center',
      justifyContent: 'center',
    },
    panel: {
      position: 'fixed' as const,
      top: 0,
      left: '50%',
      transform: 'translateX(-50%)',
      bottom: 0,
      padding:
        'max(10px, env(safe-area-inset-top)) 0 max(16px, env(safe-area-inset-bottom)) 0',
      zIndex: 50,
      boxSizing: 'border-box' as const,
      width: 'min(100vw, 430px)',
      maxWidth: `${LAYOUT.maxWidth}px`,
      overflowX: 'hidden' as const,
      display: 'flex',
      flexDirection: 'column' as const,
      justifyContent: 'flex-start',
      alignItems: 'center',
      gap: 12,
      background: 'transparent',
    },
    backBtn: {
      position: 'fixed' as const,
      top: 20,
      left: 20,
      background: 'none',
      border: 'none',
      fontSize: 16,
      cursor: 'pointer',
      padding: 6,
      borderRadius: 6,
      color: '#000',
      zIndex: 200,
      fontWeight: 'bold' as const,
    },
  };

  // 2. 録音関連スタイル
  const recordingStyles = {
    recordCard: {
      marginTop: 8,
      padding: 12,
      borderRadius: 12,
      border: '1px solid #e5e7eb',
      background: '#fff',
      boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
      width: '92%',
      maxWidth: `${Math.min(LAYOUT.cardMaxWidth, LAYOUT.maxWidth)}px`,
      textAlign: 'center' as const,
    },
    recordButtonWrap: {
      marginTop: 4,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '100%',
    },
    recordOuter: {
      width: 220,
      height: 220,
      borderRadius: '50%',
      border: '8px solid #d1d5db',
      background: '#ffffff',
      display: 'grid',
      placeItems: 'center',
      boxShadow: '0 10px 24px rgba(0,0,0,0.18)',
      userSelect: 'none' as const,
      touchAction: 'manipulation' as const,
      WebkitTapHighlightColor: 'transparent',
      cursor: 'pointer',
      transition: 'transform 0.12s ease',
      position: 'relative' as const,
    },
    recordInnerIdle: {
      width: 160,
      height: 160,
      borderRadius: '50%',
      background: '#ef4444',
    },
    recordInnerActive: {
      width: 170,
      height: 170,
      borderRadius: '50%',
      background: '#ef4444',
      boxShadow: '0 0 0 6px rgba(239,68,68,0.25)',
    },
    pauseIconWrap: {
      position: 'absolute' as const,
      inset: 0,
      display: 'grid',
      placeItems: 'center',
      pointerEvents: 'none' as const,
    },
    pauseBars: {
      display: 'grid',
      gridAutoFlow: 'column',
      gap: 12,
    },
    pauseBar: {
      width: 18,
      height: 70,
      borderRadius: 6,
      background: '#ffffff',
      boxShadow: '0 0 0 1px rgba(0,0,0,0.05) inset',
    },
    recordHelper: {
      marginTop: 8,
      fontWeight: 700,
      color: '#111827',
    },
  };

  // 3. 確認関連スタイル
  const confirmationStyles = {
    confirmCard: {
      marginTop: 16,
      padding: 12,
      borderRadius: 12,
      border: '1px solid #e5e7eb',
      background: '#fff',
      boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
      width: '92%',
      maxWidth: `${Math.min(LAYOUT.cardMaxWidth, LAYOUT.maxWidth)}px`,
      textAlign: 'center' as const,
    },
    confirmTitle: {
      fontWeight: 700,
      marginBottom: 10,
      color: '#111827',
      fontSize: 18,
    },
    playButtonBase: {
      width: 200,
      height: 200,
      borderRadius: '50%',
      display: 'grid',
      placeItems: 'center',
      fontSize: 72,
      fontWeight: 900,
      cursor: 'pointer',
      margin: '12px auto',
      boxShadow: '0 10px 24px rgba(0,0,0,0.2)',
      userSelect: 'none' as const,
      touchAction: 'manipulation' as const,
      WebkitTapHighlightColor: 'transparent',
      color: '#111827',
      border: '8px solid transparent',
    },
    playButtonIdle: {
      background: '#facc15',
      borderColor: '#eab308',
    },
    playButtonActive: {
      background: '#ef4444',
      borderColor: '#b91c1c',
      color: '#ffffff',
    },
    confirmButtons: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 10,
      marginTop: 14,
    },
    btnPrimary: {
      padding: '14px 16px',
      borderRadius: 12,
      background: '#10b981',
      color: '#fff',
      fontWeight: 800,
      fontSize: 18,
      border: 'none',
      cursor: 'pointer',
    },
    btnDanger: {
      padding: '14px 16px',
      borderRadius: 12,
      background: '#fca5a5',
      color: '#7f1d1d',
      fontWeight: 800,
      fontSize: 18,
      border: '2px solid #ef4444',
      cursor: 'pointer',
    },
  };

  // 4. 完了画面関連スタイル
  const completionStyles = {
    overlay: {
      position: 'fixed' as const,
      inset: 0,
      background: 'rgba(0,0,0,0.2)',
      backdropFilter: 'blur(1px)',
      zIndex: 300,
      display: 'grid',
      placeItems: 'center',
    },
    waitCard: {
      width: 'min(88vw, 360px)',
      borderRadius: 16,
      background: '#ffffff',
      border: '1px solid #e5e7eb',
      boxShadow: '0 12px 30px rgba(0,0,0,0.25)',
      padding: 16,
      textAlign: 'center' as const,
    },
    waitKokoron: {
      width: 180,
      height: 180,
      objectFit: 'contain' as const,
      animation: 'bob 1.6s ease-in-out infinite',
      margin: '0 auto 8px',
    },
    waitBubble: {
      background: '#fff',
      borderRadius: 12,
      border: '1px solid #e5e7eb',
      padding: '8px 10px',
      margin: '0 auto 8px',
      fontWeight: 800,
      color: '#111827',
      width: '92%',
    },
    progressWrap: {
      width: '92%',
      height: 10,
      borderRadius: 999,
      background: '#f3f4f6',
      overflow: 'hidden' as const,
      margin: '6px auto 2px',
      border: '1px solid #e5e7eb',
    },
    progressBar: {
      width: '40%',
      height: '100%',
      borderRadius: 999,
      background: 'linear-gradient(90deg, #fde68a, #facc15, #f59e0b)',
      animation: 'indet 1.2s infinite',
    },
    waitHint: { fontSize: 12, color: '#6b7280', marginTop: 6 },
  };

  // 5. 共通スタイル
  const commonStyles = {
    bubbleSmall: {
      marginTop: 60,
      background: '#fff',
      borderRadius: 12,
      padding: '8px 10px',
      boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
      width: '88%',
      maxWidth: `${Math.min(320, LAYOUT.maxWidth)}px`,
      textAlign: 'center' as const,
    },
    bubbleTextSmall: {
      fontWeight: 700,
      fontSize: 14,
      lineHeight: 1.3,
      color: '#333',
    },
    characterWrap: {
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'center',
      gap: 8,
      marginTop: 10,
      marginBottom: 10,
    },
    characterImg: {
      width: 'min(70vw, 300px)',
      height: 'min(70vw, 300px)',
      objectFit: 'contain' as const,
    },
    statusCard: (hasError: boolean) => ({
      marginTop: 8,
      padding: 10,
      borderRadius: 10,
      border: `1px solid ${hasError ? '#f5c2c7' : '#e5e7eb'}`,
      background: hasError ? '#fdecee' : '#fafafa',
      color: hasError ? '#842029' : '#111827',
      width: '92%',
      maxWidth: `${Math.min(LAYOUT.cardMaxWidth, LAYOUT.maxWidth)}px`,
      textAlign: 'center' as const,
      fontSize: 14,
    }),
  };

  // 認証チェック
  useEffect(() => {
    if (!isLoading && !user) router.replace('/');
  }, [isLoading, user, router]);

  // 今日の記録チェック
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
          if (Array.isArray(r?.created_at) && r.created_at[0])
            return r.created_at[0] === ymd;
          const name = String(r?.audio_path || '');
          const m2 = name.match(/audio_(\d{8})_/);
          return m2?.[1] === ymd;
        });

        if (hasToday) {
          console.log(
            '[INFO] 今日の記録が既に存在します。上書きモードで録音可能です。',
          );
        }
      } catch (e: any) {
        setError(e?.message || '今日の記録確認に失敗しました');
      } finally {
        setCheckingToday(false);
      }
    };
    if (user) {
      checkToday();
    }
  }, [user, router]);

  // 録音開始
  const startRecording = async () => {
    try {
      setError(null);
      setStatus('');
      setAudioBlob(null);
      setTranscription(null);
      setIsPlaying(false);
      setCompletionStep('recording');

      const stream = await navigator.mediaDevices.getUserMedia(
        getAudioConstraints(),
      );
      streamRef.current = stream;

      const rec = new MediaRecorder(
        stream,
        recConfig.mimeType ? { mimeType: recConfig.mimeType } : undefined,
      );
      mediaRecorderRef.current = rec;
      chunksRef.current = [];

      rec.ondataavailable = (e) =>
        e?.data && e.data.size > 0 && chunksRef.current.push(e.data);
      rec.onerror = (ev) =>
        setError(`録音エラー: ${(ev as any).error?.message || 'unknown'}`);
      rec.onstop = () => {
        const blob = new Blob(chunksRef.current, {
          type: recConfig.contentType,
        });
        setAudioBlob(blob);
        stopStream();
        setStatus('');
      };

      rec.start();
      setIsRecording(true);
    } catch (err: any) {
      console.error('[RECORDING] error', err);
      stopStream();
      setError(getErrorMessage(err));
      setStatus('エラーが発生しました');
      setIsRecording(false);
    }
  };

  // 録音停止
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

  // 再生
  const togglePlay = async () => {
    if (!audioRef.current) {
      console.log('[AUDIO] audioRef.current is null, waiting...');
      return;
    }

    try {
      console.log('[AUDIO] Audio element paused:', audioRef.current.paused);
      console.log('[AUDIO] Audio duration:', audioRef.current.duration);
      console.log('[AUDIO] Audio currentTime:', audioRef.current.currentTime);

      // 音声要素の実際の状態で判断（isPlayingではなく）
      if (audioRef.current.paused) {
        // 音声が終了している場合は最初から再生
        if (audioRef.current.currentTime >= audioRef.current.duration) {
          audioRef.current.currentTime = 0;
          console.log('[AUDIO] Reset to beginning');
        }

        // 子ども向け：確実に再生されるまでリトライ
        let playAttempts = 0;
        const maxAttempts = 3;

        const attemptPlay = async () => {
          try {
            playAttempts++;
            console.log(`[AUDIO] Play attempt ${playAttempts}/${maxAttempts}`);

            await audioRef.current!.play();
            setIsPlaying(true);
            console.log('[AUDIO] Started playing successfully');
          } catch (error: any) {
            console.error(
              `[AUDIO] Play attempt ${playAttempts} failed:`,
              error,
            );

            if (playAttempts < maxAttempts) {
              // リトライ前に少し待つ
              await new Promise((resolve) => setTimeout(resolve, 100));
              return attemptPlay();
            } else {
              // 最終的に失敗した場合は、ボタンの見た目だけ変更してユーザーに再クリックを促す
              console.log(
                '[AUDIO] All play attempts failed, waiting for user interaction',
              );
              setIsPlaying(false);
            }
          }
        };

        await attemptPlay();
      } else {
        audioRef.current.pause();
        setIsPlaying(false);
        console.log('[AUDIO] Paused');
      }
    } catch (e) {
      console.error('[AUDIO] playback error', e);
      setIsPlaying(false);
    }
  };

  useEffect(() => {
    const a = audioRef.current;
    if (!a || !audioBlob) return;

    console.log(
      '[AUDIO] Setting up audio element with blob size:',
      audioBlob.size,
    );

    // isPlayingをリセット
    setIsPlaying(false);

    // 音声URLを明示的に設定
    const audioUrl = URL.createObjectURL(audioBlob);
    a.src = audioUrl;
    console.log('[AUDIO] Audio src set to:', audioUrl);

    const onEnded = () => {
      console.log('[AUDIO] Audio ended');
      setIsPlaying(false);
    };

    const onLoadedData = () => {
      console.log('[AUDIO] Audio data loaded, duration:', a.duration);
    };

    a.addEventListener('ended', onEnded);
    a.addEventListener('loadeddata', onLoadedData);

    // 音声を事前に読み込む
    a.load();

    return () => {
      a.removeEventListener('ended', onEnded);
      a.removeEventListener('loadeddata', onLoadedData);
      // URLオブジェクトを解放
      URL.revokeObjectURL(audioUrl);
    };
  }, [audioBlob]);

  // 高速化されたアップロード処理（並列実行 + プログレッシブ処理）
  const uploadAndSave = async () => {
    if (!audioBlob || !user) return;
    if (!emotionId || !intensityLevel || !childId) {
      setError(
        '感情データが不足しています。感情選択画面から再度お試しください。',
      );
      return;
    }

    setIsBusy(true);
    setCompletionStep('completed');
    setStatus('できた！');

    // 即座に完了画面を表示（ユーザー体験の向上）
    setTimeout(() => {
      setCompletionStep('finished');
      const redirectTo = searchParams.get('redirect') || '/app/voice/complete';
      router.replace(redirectTo);
    }, 2000);

    // バックグラウンドで並列処理を実行
    try {
      console.log('[UPLOAD] 高速化処理開始 - パラメータ:', {
        emotionId,
        intensityLevel,
        childId,
      });

      // ヘルスチェックとアップロードURL取得を並列実行
      const [healthRes, uploadUrlRes] = await Promise.all([
        fetch(`${API_BASE}/api/v1/voice/health`),
        fetch(`${API_BASE}/api/v1/voice/get-upload-url`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: user.id,
            file_type: 'audio',
            file_format: recConfig.ext,
          }),
        }),
      ]);

      if (!healthRes.ok)
        throw new Error(`ヘルスチェック失敗: ${healthRes.status}`);
      if (!uploadUrlRes.ok)
        throw new Error(`アップロードURL取得失敗: ${uploadUrlRes.status}`);

      const upData: GetUploadUrlResponse = await uploadUrlRes.json();
      console.log('[UPLOAD] 並列処理成功:', upData.file_path);

      console.log('[DEBUG] S3アップロード開始:', {
        upload_url: upData.upload_url,
        content_type: upData.content_type,
        audioBlob_size: audioBlob.size,
      });

      // S3アップロードを先に実行、完了後に文字起こしを実行
      console.log('[DEBUG] S3アップロードを先に実行します');

      // まずS3アップロードを実行
      const uploadResult = await fetch(upData.upload_url, {
        method: 'PUT',
        headers: { 'Content-Type': upData.content_type },
        body: audioBlob,
      })
        .then(async (res) => {
          console.log('[DEBUG] S3レスポンス:', res.status, res.statusText);
          if (!res.ok) {
            const errorText = await res.text().catch(() => '');
            console.error(
              '[UPLOAD] S3アップロードエラー詳細:',
              res.status,
              errorText,
            );
            throw new Error(`S3アップロード失敗: ${res.status} ${errorText}`);
          }
          console.log('[UPLOAD] S3アップロード成功');
          return res;
        })
        .catch((error) => {
          console.error('[UPLOAD] S3アップロード例外:', error);
          throw error;
        });

      // S3アップロード完了後、少し待ってから文字起こしを実行
      console.log('[DEBUG] S3アップロード完了、2秒待機後に文字起こし開始');
      await new Promise((resolve) => setTimeout(resolve, 2000));

      console.log('[DEBUG] 文字起こし開始');
      const transcribeResult = await fetch(
        `${API_BASE}/api/v1/voice/transcribe`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: user.id,
            audio_file_path: upData.file_path,
            language: 'ja',
          }),
        },
      ).then(async (res) => {
        if (!res.ok) {
          const errorText = await res.text();
          console.error('[TRANSCRIBE] エラー:', res.status, errorText);
          throw new Error(`音声認識失敗: ${res.status} ${errorText}`);
        }
        const data = await res.json();
        console.log('[TRANSCRIBE] 成功 - 結果:', data);
        return data;
      });

      const trData: TranscriptionResult = transcribeResult;
      console.log('[TRANSCRIBE] テキスト:', trData.text);
      console.log('[TRANSCRIBE] 信頼度:', trData.confidence);

      setTranscription(trData);

      // データ保存をバックグラウンドで実行（ユーザーは既に完了画面を見ている）
      const audioPath = upData.file_path;
      const textPath = audioPath.replace('.webm', '.txt');

      console.log('[SAVE] バックグラウンド保存開始 - パス:', {
        audioPath,
        textPath,
      });

      // 保存処理を非同期で実行（エラーが発生してもユーザー体験に影響しない）
      const saveData = {
        user_id: user.id,
        audio_file_path: audioPath,
        text_file_path: textPath,
        voice_note: trData.text || '',
        emotion_card_id: emotionId,
        intensity_id: intensityLevel,
        child_id: childId,
      };

      console.log('[SAVE] 保存データ:', saveData);

      fetch(`${API_BASE}/api/v1/voice/save-record`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(saveData),
      })
        .then(async (save) => {
          if (!save.ok) {
            const saveError = await save.text();
            console.error('[SAVE] 保存失敗:', save.status, saveError);
            // エラーはログに記録するが、ユーザーには表示しない
          } else {
            console.log('[SAVE] バックグラウンド保存成功');
          }
        })
        .catch((error) => {
          console.error('[SAVE] 保存エラー:', error);
        });
    } catch (e: any) {
      console.error('[ERROR] upload/save', e);
      setError(e?.message || 'エラーが発生しました');
    } finally {
      setIsBusy(false);
    }
  };

  // ローディング系
  if (isLoading || !user) {
    return (
      <main
        style={{
          display: 'grid',
          placeItems: 'center',
          minHeight: '60vh',
          color: colors.text.secondary,
        }}
      >
        <p>読み込み中...</p>
      </main>
    );
  }
  if (checkingToday) {
    return (
      <main
        style={{
          display: 'grid',
          placeItems: 'center',
          minHeight: '60vh',
          color: colors.text.secondary,
        }}
      >
        <p>きょうの記録を確認中…</p>
      </main>
    );
  }

  if (!emotionId || !intensityLevel) {
    return (
      <main
        style={{
          maxWidth: 720,
          margin: '0 auto',
          padding: spacing.xl,
          background: 'url("/images/background.webp") no-repeat center center',
          backgroundSize: 'cover',
          minHeight: '100vh',
        }}
      >
        <h1
          style={{
            fontSize: 22,
            fontWeight: 700,
            marginBottom: spacing.sm,
            color: colors.text.primary,
          }}
        >
          感情データが不足しています
        </h1>
        <p style={{ marginBottom: spacing.md, color: colors.text.secondary }}>
          感情選択画面から再度お試しください。
        </p>
        <button
          onClick={() => router.push('/app/emotion-selection')}
          style={{
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

  // 完了画面の表示
  if (completionStep === 'completed' || completionStep === 'finished') {
    return (
      <div style={layoutStyles.page}>
        <AudioPlayer
          src="/sounds/characterAskReason04.mp3"
          autoPlay={true}
          volume={0.8}
          onEnded={() => console.log('[AUDIO] 感情確認音声再生完了')}
          onError={(error) => console.log('[AUDIO] 音声エラー:', error)}
        />

        <style>{`
          @keyframes bob {
            0%,100% { transform: translateY(0); }
            50% { transform: translateY(-8px); }
          }
          @keyframes indet {
            0% { transform: translateX(-60%); }
            100% { transform: translateX(160%); }
          }
        `}</style>

        <main style={layoutStyles.panel}>
          <div
            style={completionStyles.overlay}
            role="dialog"
            aria-live="polite"
            aria-label="完了"
          >
            <div style={completionStyles.waitCard}>
              <img
                src="/images/kokoron/kokoron_mic.webp"
                alt="うれしいこころん"
                style={completionStyles.waitKokoron}
              />
              <div style={completionStyles.waitBubble}>
                {completionStep === 'completed'
                  ? 'きもちを きかせてくれて ありがとう✨'
                  : 'こころんが よろこんでるよ！つぎの がめんにすすむよ... 🎉'}
              </div>
              {completionStep === 'finished' && (
                <div style={completionStyles.progressWrap}>
                  <div
                    style={{
                      ...completionStyles.progressBar,
                      width: '100%',
                      background:
                        'linear-gradient(90deg,rgb(248, 165, 239),rgb(105, 235, 244),rgb(244, 84, 10))',
                    }}
                  />
                </div>
              )}
              <div style={completionStyles.waitHint}>
                {completionStep === 'completed'
                  ? ''
                  : 'まもなく つぎのがめんに すすむよ！'}
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // UI本体
  return (
    <div style={layoutStyles.page}>
      <AudioPlayer
        src="/sounds/characterAskReason04.mp3"
        autoPlay={true}
        volume={0.8}
        onEnded={() => console.log('[AUDIO] 感情確認音声再生完了')}
        onError={(error) => console.log('[AUDIO] 音声エラー:', error)}
      />

      <style>{`
        @keyframes bob {
          0%,100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        @keyframes indet {
          0% { transform: translateX(-60%); }
          100% { transform: translateX(160%); }
        }
      `}</style>

      <main style={layoutStyles.panel}>
        <button onClick={handleBack} style={layoutStyles.backBtn}>
          ← もどる
        </button>

        <div style={commonStyles.bubbleSmall}>
          <span style={commonStyles.bubbleTextSmall}>
            どうしてこのきもちになったのかな？
          </span>
        </div>

        <div style={commonStyles.characterWrap}>
          <img
            src="/images/kokoron/kokoron_mic.webp"
            alt="マイクを持つこころん"
            style={commonStyles.characterImg}
          />
        </div>

        {!audioBlob && (
          <section style={recordingStyles.recordCard}>
            <div style={recordingStyles.recordButtonWrap}>
              <button
                onClick={isRecording ? stopRecording : startRecording}
                aria-label={isRecording ? '録音をとめる' : '録音をはじめる'}
                style={recordingStyles.recordOuter}
              >
                <div
                  style={
                    isRecording
                      ? recordingStyles.recordInnerActive
                      : recordingStyles.recordInnerIdle
                  }
                />
                {isRecording && (
                  <div style={recordingStyles.pauseIconWrap} aria-hidden="true">
                    <div style={recordingStyles.pauseBars}>
                      <div style={recordingStyles.pauseBar} />
                      <div style={recordingStyles.pauseBar} />
                    </div>
                  </div>
                )}
              </button>
            </div>
            <div style={recordingStyles.recordHelper}>
              {isRecording
                ? 'とめる（3びょう いじょう はなしてね）'
                : 'はなしてね'}
            </div>
          </section>
        )}

        {audioBlob && !isRecording && (
          <section style={confirmationStyles.confirmCard} aria-live="polite">
            <div style={confirmationStyles.confirmTitle}>きいてみる</div>

            <button
              onClick={togglePlay}
              style={{
                ...confirmationStyles.playButtonBase,
                ...(isPlaying
                  ? confirmationStyles.playButtonActive
                  : confirmationStyles.playButtonIdle),
              }}
              disabled={isBusy}
              aria-label={isPlaying ? 'とめる' : 'きく'}
            >
              <span>{isPlaying ? '⏸' : '▶'}</span>
            </button>

            <audio ref={audioRef} style={{ display: 'none' }} />

            <div style={confirmationStyles.confirmButtons}>
              <button
                style={confirmationStyles.btnPrimary}
                onClick={uploadAndSave}
                disabled={isBusy}
              >
                ✅ いい
              </button>
              <button
                style={confirmationStyles.btnDanger}
                onClick={startRecording}
              >
                🔴 もういっかい
              </button>
            </div>
          </section>
        )}

        {(status || error) && (
          <div style={commonStyles.statusCard(!!error)}>
            <div style={{ fontWeight: 700 }}>{status}</div>
            {error && <div style={{ marginTop: 6 }}>{error}</div>}
          </div>
        )}

        {transcription && (
          <div
            style={{
              marginTop: 12,
              padding: 12,
              borderRadius: 12,
              border: '1px solid #e5e7eb',
              background: '#fff',
              boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
              width: '92%',
              maxWidth: `${Math.min(LAYOUT.cardMaxWidth, LAYOUT.maxWidth)}px`,
              textAlign: 'center' as const,
            }}
          >
            <div style={{ fontWeight: 700, marginBottom: 6, color: '#111827' }}>
              文字起こし
            </div>
            <div
              style={{
                whiteSpace: 'pre-wrap',
                lineHeight: 1.6,
                color: '#111827',
              }}
            >
              {transcription.text || '—'}
            </div>
            {typeof transcription.confidence === 'number' && (
              <div style={{ fontSize: 12, color: '#6b7280', marginTop: 8 }}>
                信頼度:{' '}
                {transcription.confidence >= 0
                  ? `${(transcription.confidence * 100).toFixed(1)}%`
                  : `logprob: ${transcription.confidence.toFixed(3)}`}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
