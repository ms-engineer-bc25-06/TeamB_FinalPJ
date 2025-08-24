'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { getAudioConstraints, selectRecorderConfig, getErrorMessage } from '@/utils/audio';
import { colors, commonStyles, spacing, borderRadius } from '@/styles/theme';

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

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || '';

// 待ち時間の応援メッセージ（ランダム切替）
const WAIT_MESSAGES = [
  'すごい！ いま ことばを ひろってるよ ✨',
  'もうちょっと… おんぷを あつめてるよ 🎵',
  'こころん かんがえ中… 3, 2, 1… 🤔',
  'ピカーン！ ひらめき まちだよ ✨',
  'じょうずに はなせたね！ よみこみ中… ⏳',
];

export default function VoiceEntryPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  const searchParams = useSearchParams();
  const emotionId = searchParams.get('emotion');
  const intensityLevel = searchParams.get('intensity');
  const childId = searchParams.get('child');

  useEffect(() => {
    console.log('[EMOTION]', { emotionId, intensityLevel });
  }, [emotionId, intensityLevel]);

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

  // 再生
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // 応援メッセージのインデックス
  const [msgIndex, setMsgIndex] = useState(0);

  const handleBack = () => router.push('/app/emotion-confirmation');

  // ====== レイアウト ======
  const LAYOUT = { maxWidth: 430, cardMaxWidth: 360 };
  const styles = {
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
      padding: 'max(10px, env(safe-area-inset-top)) 0 max(16px, env(safe-area-inset-bottom)) 0',
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
    bubbleTextSmall: { fontWeight: 700, fontSize: 14, lineHeight: 1.3, color: '#333' },

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

    // 録音セクション（白枠カード）
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
      position: 'relative' as const, // ⏸重ね表示のため
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
    // 録音中の⏸表示（同じボタン内で重ねる）
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

    // 「きいてみる」
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
    confirmTitle: { fontWeight: 700, marginBottom: 10, color: '#111827', fontSize: 18 },
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

    // === 待ち時間の演出（オーバーレイ） ===
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
  } as const;
  // ====== ここまで ======

  // 応援メッセージ切替（isBusyの間だけ）
  useEffect(() => {
    if (!isBusy) return;
    const id = setInterval(() => {
      setMsgIndex((i) => (i + 1) % WAIT_MESSAGES.length);
    }, 1500);
    return () => clearInterval(id);
  }, [isBusy]);

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
          if (Array.isArray(r?.created_at) && r.created_at[0]) return r.created_at[0] === ymd;
          const name = String(r?.audio_path || '');
          const m2 = name.match(/audio_(\d{8})_/);
          return m2?.[1] === ymd;
        });

        if (hasToday) {
          router.replace('/app/entries/today/edit');
          return;
        }
      } catch (e: any) {
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
      setError(null);
      setStatus('');
      setAudioBlob(null);
      setTranscription(null);
      setIsPlaying(false);

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

  // 再生（▶/⏸切替）
  const togglePlay = async () => {
    if (!audioRef.current) return;
    try {
      if (audioRef.current.paused) {
        await audioRef.current.play();
        setIsPlaying(true);
      } else {
        audioRef.current.pause();
        setIsPlaying(false);
      }
    } catch (e) {
      console.error('playback error', e);
    }
  };

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    const onEnded = () => setIsPlaying(false);
    a.addEventListener('ended', onEnded);
    return () => a.removeEventListener('ended', onEnded);
  }, [audioBlob]);

  // --- アップロード＆保存 ---
  const uploadAndSave = async () => {
    if (!audioBlob || !user) return;
    if (!emotionId || !intensityLevel || !childId) {
      setError('感情データが不足しています。感情選択画面から再度お試しください。');
      return;
    }

    setIsBusy(true);
    setError(null);
    setStatus('すこしまってね…');

    try {
      const health = await fetch(`${API_BASE}/api/v1/voice/health`);
      if (!health.ok) throw new Error(`ヘルスチェック失敗: ${health.status}`);

      const upRes = await fetch(`${API_BASE}/api/v1/voice/get-upload-url`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          file_type: 'audio',
          file_format: recConfig.ext,
        }),
      });
      if (!upRes.ok) throw new Error(`アップロードURL取得失敗: ${upRes.status} ${await upRes.text()}`);
      const upData: GetUploadUrlResponse = await upRes.json();

      const put = await fetch(upData.upload_url, {
        method: 'PUT',
        headers: { 'Content-Type': upData.content_type },
        body: audioBlob,
      });
      if (!put.ok) throw new Error(`S3アップロード失敗: ${put.status} ${await put.text()}`);
      
      const tr = await fetch(`${API_BASE}/api/v1/voice/transcribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          audio_file_path: upData.file_path,
          language: 'ja',
        }),
      });
      if (!tr.ok) throw new Error(`音声認識失敗: ${tr.status} ${await tr.text()}`);
      const trData: TranscriptionResult = await tr.json();
      setTranscription(trData);
      // 追加：音声→テキストのパス生成＆テキスト本文
      const audioPath = upData.file_path;
      const textPath = audioPath.replace('.webm', '.txt');

      const save = await fetch(`${API_BASE}/api/v1/voice/save-record`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          audio_file_path: audioPath,
          text_file_path: textPath,     // null から upData.file_path に変更
          // voice_note: transcription?.text || '', TODO: 音声認識テキストはDBに保存しない
          emotion_card_id: emotionId,
          intensity_id: intensityLevel,
          child_id: childId,
        }),
      });

      if (!save.ok) throw new Error(`記録保存失敗: ${save.status} ${await save.text()}`);

      setStatus('できた！');

      // 画面遷移処理
      const redirectTo = searchParams.get('redirect') || '/app/voice/complete';
      setTimeout(() => router.replace(redirectTo), 100);

    } catch (e: any) {
      console.error('[ERROR] upload/save', e);
      setError(e?.message || 'エラーが発生しました');
      setStatus('エラーが発生しました');
    } finally {
      setIsBusy(false);
    }
  };

  // ローディング系
  if (isLoading || !user) {
    return (
      <main style={{ display: 'grid', placeItems: 'center', minHeight: '60vh', color: colors.text.secondary }}>
        <p>読み込み中...</p>
      </main>
    );
  }
  if (checkingToday) {
    return (
      <main style={{ display: 'grid', placeItems: 'center', minHeight: '60vh', color: colors.text.secondary }}>
        <p>きょうの記録を確認中…</p>
      </main>
    );
  }

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
        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: spacing.sm, color: colors.text.primary }}>
          感情データが不足しています
        </h1>
        <p style={{ marginBottom: spacing.md, color: colors.text.secondary }}>
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

  // UI本体
  return (
    <div style={styles.page}>
      {/* keyframes（CSS）をこの画面だけに注入 */}
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

      <main style={styles.panel} aria-busy={isBusy}>
        <button onClick={handleBack} style={styles.backBtn} disabled={isBusy}>← もどる</button>

        {/* バブル */}
        <div style={styles.bubbleSmall}>
          <span style={styles.bubbleTextSmall}>どうしてこのきもちになったのかな？</span>
        </div>

        {/* キャラクター */}
        <div style={styles.characterWrap}>
          <img src="/images/kokoron/kokoron_mic.webp" alt="マイクを持つこころん" style={styles.characterImg} />
        </div>

        {/* 録音（白枠カード＋1ボタン切替） */}
        {!audioBlob && (
          <section style={styles.recordCard}>
            <div style={styles.recordButtonWrap}>
              <button
                onClick={isRecording ? stopRecording : startRecording}
                aria-label={isRecording ? '録音をとめる' : '録音をはじめる'}
                disabled={isBusy}
                style={styles.recordOuter}
              >
                <div style={isRecording ? styles.recordInnerActive : styles.recordInnerIdle} />
                {isRecording && (
                  <div style={styles.pauseIconWrap} aria-hidden="true">
                    <div style={styles.pauseBars}>
                      <div style={styles.pauseBar} />
                      <div style={styles.pauseBar} />
                    </div>
                  </div>
                )}
              </button>
            </div>
            <div style={styles.recordHelper}>{isRecording ? 'とめる' : 'はなしてね'}</div>
          </section>
        )}

        {/* 確認パネル（録音後） */}
        {audioBlob && !isRecording && (
          <section style={styles.confirmCard} aria-live="polite">
            <div style={styles.confirmTitle}>きいてみる</div>

            <button
              onClick={togglePlay}
              style={{
                ...styles.playButtonBase,
                ...(isPlaying ? styles.playButtonActive : styles.playButtonIdle),
              }}
              disabled={isBusy}
              aria-label={isPlaying ? 'とめる' : 'きく'}
            >
              <span>{isPlaying ? '⏸' : '▶'}</span>
            </button>

            {/* 隠しaudio */}
            <audio
              ref={audioRef}
              src={audioBlob ? URL.createObjectURL(audioBlob) : undefined}
              style={{ display: 'none' }}
            />

            <div style={styles.confirmButtons}>
              <button style={styles.btnPrimary} onClick={uploadAndSave} disabled={isBusy}>
                ✅ いい
              </button>
              <button
                style={styles.btnDanger}
                onClick={startRecording}
                disabled={isBusy}
              >
                🔴 もういっかい
              </button>
            </div>
          </section>
        )}

        {(status || error) && (
          <div style={styles.statusCard(!!error)}>
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
            <div style={{ fontWeight: 700, marginBottom: 6, color: '#111827' }}>文字起こし</div>
            <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6, color: '#111827' }}>
              {transcription.text || '—'}
            </div>
            {typeof transcription.confidence === 'number' && (
              <div style={{ fontSize: 12, color: '#6b7280', marginTop: 8 }}>
                信頼度: {(transcription.confidence * 100).toFixed(1)}%
              </div>
            )}
          </div>
        )}
      </main>

      {/* === 待ち時間の楽しいオーバーレイ（isBusy中だけ表示） === */}
      {isBusy && (
        <div style={styles.overlay} role="dialog" aria-live="polite" aria-label="よみこみ中">
          <div style={styles.waitCard}>
            <img
              src="/images/kokoron/kokoron_mic.webp"
              alt="こころん"
              style={styles.waitKokoron}
            />
            <div style={styles.waitBubble}>{WAIT_MESSAGES[msgIndex]}</div>
            <div style={styles.progressWrap}>
              <div style={styles.progressBar} />
            </div>
            <div style={styles.waitHint}>よみこみ中だよ… そのまま まっててね</div>
          </div>
        </div>
      )}
    </div>
  );
}