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
      width: '280px',
      minHeight: '60px',
      textAlign: 'center',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      maxWidth: '90vw',
    }}>
      <span style={{
        color: colors.text.primary,
        fontWeight: 'bold',
        fontSize: fontSize.large,
        lineHeight: 1.4,
        margin: 0,
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