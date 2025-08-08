import { colors, spacing, borderRadius, fontSize } from '@/styles/theme';

interface SpeechBubbleProps {
  text: string;
}

export default function SpeechBubble({ text }: SpeechBubbleProps) {
  return (
    <div style={{
      position: 'relative',
      backgroundColor: colors.background.white,
      borderRadius: borderRadius.large,
      padding: `${spacing.md} ${spacing.lg}`,
      boxShadow: colors.shadow.light,
      width: '300px',
      minHeight: '80px',
      textAlign: 'center',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      maxWidth: '85vw',
    }}>
      <span style={{
        color: colors.text.primary,
        fontWeight: 'bold',
        fontSize: '16px',
        lineHeight: 1.4,
        margin: 0,
        whiteSpace: 'pre-line',
        wordBreak: 'keep-all',
        overflowWrap: 'break-word',
      }}>
        {text}
      </span>
      <div style={{
        position: 'absolute',
        bottom: '-8px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: 0,
        height: 0,
        borderLeft: '8px solid transparent',
        borderRight: '8px solid transparent',
        borderTop: `8px solid ${colors.background.white}`,
      }} />
    </div>
  );
} 