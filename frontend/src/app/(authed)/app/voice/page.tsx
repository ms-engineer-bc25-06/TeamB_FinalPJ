// 新規作成の入口（既存があれば編集にリダイレクト, 音声登録処理中は「聞いてるよ」UI表示）
// TODO: 仮実装なのであとで変更すること
'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { KokoronDefault, SpeechBubble, PrimaryButton } from '@/components/ui';
import { colors, commonStyles, spacing, fontSize } from '@/styles/theme';

const emotions = [
  { id: 'happy', name: 'うれしい', emoji: '😊', color: '#FFD700' },
  { id: 'sad', name: 'かなしい', emoji: '😢', color: '#87CEEB' },
  { id: 'angry', name: 'おこった', emoji: '😠', color: '#FF6B6B' },
  { id: 'excited', name: 'わくわく', emoji: '🤩', color: '#FF69B4' },
  { id: 'worried', name: 'しんぱい', emoji: '😰', color: '#DDA0DD' },
  { id: 'tired', name: 'つかれた', emoji: '😴', color: '#B0C4DE' },
  { id: 'surprised', name: 'びっくり', emoji: '😲', color: '#FFA500' },
  { id: 'calm', name: 'おちついた', emoji: '😌', color: '#98FB98' },
];

type RecordingState = 'idle' | 'recording' | 'processing' | 'completed';

export default function VoicePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [emotionId, setEmotionId] = useState<string | null>(null);
  const [intensity, setIntensity] = useState<number | null>(null);
  const [recordingState, setRecordingState] = useState<RecordingState>('idle');
  const [recordingTime, setRecordingTime] = useState(0);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(
    null,
  );
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const emotion = searchParams.get('emotion');
    const intensityParam = searchParams.get('intensity');

    if (emotion && intensityParam) {
      setEmotionId(emotion);
      setIntensity(Number.parseInt(intensityParam));
    } else {
      router.push('/app/emotion-selection');
    }
  }, [searchParams, router]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          setAudioBlob(event.data);
        }
      };

      recorder.start();
      setMediaRecorder(recorder);
      setRecordingState('recording');
      setRecordingTime(0);

      // 録音時間をカウント
      intervalRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (error) {
      console.error('録音開始エラー:', error);
      alert('マイクへのアクセスが許可されていません。');
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && recordingState === 'recording') {
      mediaRecorder.stop();
      mediaRecorder.stream.getTracks().forEach((track) => track.stop());
      setRecordingState('processing');

      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }
  };

  const saveRecording = async () => {
    if (!audioBlob || !emotionId || !intensity) return;

    try {
      setRecordingState('processing');

      // 実際の実装では音声をサーバーにアップロードし、
      // 音声認識とAI分析を行う
      const entryData = {
        emotion: emotionId,
        intensity: intensity,
        date: new Date().toISOString().split('T')[0],
        hasAudio: true,
        audioBlob: audioBlob,
        recordingDuration: recordingTime,
      };

      console.log('音声付き記録保存:', entryData);

      // ダミーの処理時間
      await new Promise((resolve) => setTimeout(resolve, 2000));

      setRecordingState('completed');

      // 完了後、今日の記録ページに遷移
      setTimeout(() => {
        router.push('/app/entries/today');
      }, 1500);
    } catch (error) {
      console.error('記録保存エラー:', error);
      alert('記録の保存に失敗しました。');
      setRecordingState('idle');
    }
  };

  const retryRecording = () => {
    setRecordingState('idle');
    setRecordingTime(0);
    setAudioBlob(null);
  };

  const handleBack = () => {
    if (recordingState === 'recording') {
      stopRecording();
    }
    router.push(
      `/app/emotion-confirmation?emotion=${emotionId}&intensity=${intensity}`,
    );
  };

  const selectedEmotion = emotions.find((e) => e.id === emotionId);

  if (!selectedEmotion || !intensity) {
    return null;
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getSpeechBubbleText = () => {
    switch (recordingState) {
      case 'idle':
        return 'きもちについて\nじゆうに おはなしくださいね！';
      case 'recording':
        return 'きいていますよ！\nおはなしつづけてくださいね';
      case 'processing':
        return 'おはなしを ぶんせきしています\nすこし まってくださいね';
      case 'completed':
        return 'ありがとうございました！\nきろくが かんりょうしました';
      default:
        return '';
    }
  };

  return (
    <div style={commonStyles.page.container}>
      <div style={commonStyles.page.mainContent}>
        {/* 戻るボタン */}
        {recordingState === 'idle' && (
          <button
            onClick={handleBack}
            style={{
              position: 'absolute',
              top: spacing.lg,
              left: spacing.lg,
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: colors.text.secondary,
            }}
          >
            ← 戻る
          </button>
        )}

        <SpeechBubble text={getSpeechBubbleText()} />

        <div style={commonStyles.page.kokoronContainer}>
          <KokoronDefault size={200} />
        </div>

        {/* 録音状態表示 */}
        <div
          style={{
            backgroundColor: colors.background.white,
            borderRadius: '16px',
            padding: spacing.xl,
            boxShadow: colors.shadow.heavy,
            maxWidth: '400px',
            width: '100%',
            margin: `${spacing.lg} 0`,
            textAlign: 'center',
            border: `3px solid ${selectedEmotion.color}`,
          }}
        >
          {recordingState === 'idle' && (
            <>
              <div style={{ fontSize: '4rem', marginBottom: spacing.md }}>
                🎤
              </div>
              <h2
                style={{
                  color: colors.text.primary,
                  fontSize: fontSize.large,
                  fontWeight: 'bold',
                  marginBottom: spacing.md,
                }}
              >
                音声録音
              </h2>
              <p
                style={{
                  color: colors.text.secondary,
                  fontSize: fontSize.base,
                  lineHeight: 1.6,
                  marginBottom: spacing.lg,
                }}
              >
                {selectedEmotion.emoji} {selectedEmotion.name}{' '}
                な気持ちについて、
                <br />
                自由にお話しください
              </p>
              <PrimaryButton onClick={startRecording}>録音開始</PrimaryButton>
            </>
          )}

          {recordingState === 'recording' && (
            <>
              <div
                style={{
                  fontSize: '4rem',
                  marginBottom: spacing.md,
                  animation: 'pulse 1.5s infinite',
                  color: '#FF4444',
                }}
              >
                🔴
              </div>
              <h2
                style={{
                  color: '#FF4444',
                  fontSize: fontSize.large,
                  fontWeight: 'bold',
                  marginBottom: spacing.md,
                }}
              >
                録音中...
              </h2>
              <div
                style={{
                  fontSize: fontSize.xl,
                  fontWeight: 'bold',
                  color: colors.text.primary,
                  marginBottom: spacing.lg,
                }}
              >
                {formatTime(recordingTime)}
              </div>
              <PrimaryButton onClick={stopRecording}>録音停止</PrimaryButton>
            </>
          )}

          {recordingState === 'processing' && audioBlob && (
            <>
              <div style={{ fontSize: '4rem', marginBottom: spacing.md }}>
                ⏳
              </div>
              <h2
                style={{
                  color: colors.text.primary,
                  fontSize: fontSize.large,
                  fontWeight: 'bold',
                  marginBottom: spacing.md,
                }}
              >
                録音完了
              </h2>
              <p
                style={{
                  color: colors.text.secondary,
                  fontSize: fontSize.base,
                  marginBottom: spacing.lg,
                }}
              >
                録音時間: {formatTime(recordingTime)}
              </p>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: spacing.md,
                  alignItems: 'center',
                }}
              >
                <PrimaryButton onClick={saveRecording}>
                  記録を保存
                </PrimaryButton>
                <button
                  onClick={retryRecording}
                  style={{
                    background: 'none',
                    border: `2px solid ${colors.text.secondary}`,
                    color: colors.text.secondary,
                    borderRadius: '25px',
                    padding: `${spacing.sm} ${spacing.lg}`,
                    fontSize: fontSize.base,
                    cursor: 'pointer',
                  }}
                >
                  録り直す
                </button>
              </div>
            </>
          )}

          {recordingState === 'completed' && (
            <>
              <div style={{ fontSize: '4rem', marginBottom: spacing.md }}>
                ✅
              </div>
              <h2
                style={{
                  color: '#4CAF50',
                  fontSize: fontSize.large,
                  fontWeight: 'bold',
                  marginBottom: spacing.md,
                }}
              >
                記録完了！
              </h2>
              <p
                style={{
                  color: colors.text.secondary,
                  fontSize: fontSize.base,
                }}
              >
                今日の記録ページに移動します...
              </p>
            </>
          )}
        </div>

        <style jsx>{`
          @keyframes pulse {
            0% {
              transform: scale(1);
            }
            50% {
              transform: scale(1.1);
            }
            100% {
              transform: scale(1);
            }
          }
        `}</style>
      </div>
    </div>
  );
}
