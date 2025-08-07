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
      padding: `${spacing.lg} ${spacing.xl}`,
      boxShadow: colors.shadow.light,
      width: '500px',
      minHeight: '120px',
      textAlign: 'center',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      maxWidth: '95vw',
    }}>
      <span style={{
        color: colors.text.primary,
        fontWeight: 'bold',
        fontSize: '30px',
        lineHeight: 1.5,
        margin: 0,
        whiteSpace: 'pre-line',
        wordBreak: 'keep-all',
        overflowWrap: 'break-word',
      }}>
        {text}
      </span>
      <div style={{
        position: 'absolute',
        bottom: '-10px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: 0,
        height: 0,
        borderLeft: '10px solid transparent',
        borderRight: '10px solid transparent',
        borderTop: `10px solid ${colors.background.white}`,
      }} />
    </div>
  );
} 