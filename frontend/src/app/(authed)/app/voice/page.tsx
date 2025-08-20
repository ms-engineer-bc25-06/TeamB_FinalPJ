'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
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
  // ← 認可制御に必要なのはこの2行だけ
  const { user, isLoading } = useAuth();
  const router = useRouter();

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

      rec.start();
      setIsRecording(true);
      setStatus('録音中…');
    } catch (err: any) {
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

    setIsBusy(true);
    setError(null);
    setStatus('API接続確認中…');

    try {
      // 1) ヘルスチェック
      const health = await fetch(`${API_BASE}/api/v1/voice/health`);
      if (!health.ok) throw new Error(`ヘルスチェック失敗: ${health.status}`);

      // 2) PUT用URL取得
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

      // 3) S3 に PUT
      setStatus('S3へアップロード中…');
      const put = await fetch(upData.upload_url, {
        method: 'PUT',
        headers: { 'Content-Type': upData.content_type },
        body: audioBlob,
      });
      if (!put.ok) throw new Error(`S3アップロード失敗: ${put.status} ${await put.text()}`);

      // 4) Whisper 文字起こし
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

      // 5) DB に key を保存（URLではなく key）
      setStatus('記録を保存中…');
      const save = await fetch(`${API_BASE}/api/v1/voice/save-record`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          audio_file_path: upData.file_path,
          text_file_path: null, // 将来: テキストもS3に保存したらここに key を入れる
        }),
      });
      if (!save.ok) throw new Error(`記録保存失敗: ${save.status} ${await save.text()}`);

      setStatus('保存完了！「きょうの記録」に移動します…');
      setTimeout(() => router.replace('/app/entries/today'), 600);
    } catch (e: any) {
      setError(e?.message || '処理中にエラーが発生しました');
      setStatus('エラーが発生しました');
    } finally {
      setIsBusy(false);
    }
  };

  // まだ認証判定中 or 未ログインでリダイレクト待ち
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

  // 録音UI
  return (
    <main style={{
      maxWidth: 720,
      margin: '0 auto',
      padding: spacing.xl,
      background: 'url("/images/background.webp") no-repeat center center',
      backgroundSize: 'cover',
      minHeight: '100vh', // 画面全体をカバー
    }}>
      <h1 style={{
        fontSize: '22px',
        fontWeight: 700,
        marginBottom: spacing.sm,
        color: colors.text.primary,
      }}>
        音声のきろく（新規）
      </h1>
      <p style={{
        marginBottom: spacing.md,
        color: colors.text.secondary,
      }}>
        ここで録音してS3に保存 → Whisperで文字起こし → DBに「S3キー」を記録します。
      </p>

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
          }}
        >
          <div style={{ fontWeight: 600 }}>{status}</div>
          {error && <div style={{ marginTop: spacing.xs }}>{error}</div>}
        </div>
      )}

      {/* 録音ボタン */}
      <div style={{
        display: 'flex',
        gap: spacing.md,
        marginTop: spacing.sm,
      }}>
        <button
          onClick={isRecording ? stopRecording : startRecording}
          disabled={isBusy}
          style={{
            ...commonStyles.button.base,
            padding: `${spacing.md} ${spacing.lg}`,
            borderRadius: borderRadius.medium,
            backgroundColor: isRecording ? '#ffb3b3' : colors.primary,
            color: colors.text.white,
            fontWeight: 700,
            cursor: isBusy ? 'not-allowed' : 'pointer',
            minWidth: 140,
            ...(isBusy && {
              backgroundColor: '#ccc',
              cursor: 'not-allowed',
              transform: 'none',
              boxShadow: 'none',
            }),
          }}
        >
          {isRecording ? '⏹ 停止' : '🎤 録音開始'}
        </button>

        <button
          onClick={uploadAndSave}
          disabled={!audioBlob || isBusy}
          style={{
            ...commonStyles.button.base,
            padding: `${spacing.md} ${spacing.lg}`,
            borderRadius: borderRadius.medium,
            backgroundColor: '#10b981',
            color: colors.text.white,
            fontWeight: 700,
            cursor: !audioBlob || isBusy ? 'not-allowed' : 'pointer',
            minWidth: 220,
            ...((!audioBlob || isBusy) && {
              backgroundColor: '#ccc',
              cursor: 'not-allowed',
              transform: 'none',
              boxShadow: 'none',
            }),
          }}
        >
          ⬆︎ アップロード → 保存
        </button>

        <button
          onClick={() => {
            setAudioBlob(null);
            setTranscription(null);
            setStatus('');
            setError(null);
          }}
          disabled={isBusy}
          style={{
            ...commonStyles.button.base,
            ...commonStyles.button.secondary,
            padding: `${spacing.md} ${spacing.md}`,
            borderRadius: borderRadius.medium,
            backgroundColor: colors.background.white,
            color: colors.text.primary,
            cursor: isBusy ? 'not-allowed' : 'pointer',
            ...(isBusy && {
              cursor: 'not-allowed',
              opacity: 0.6,
            }),
          }}
        >
          取り直す
        </button>
      </div>

      {/* プレビュー */}
      {audioBlob && (
        <div style={{ marginTop: spacing.md }}>
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
  );
}