import { colors, spacing, borderRadius, fontSize } from '@/styles/theme';
import ReactMarkdown from 'react-markdown';

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
      width: '100%',
      maxWidth: '500px',
      height: 'auto',
      textAlign: 'left',
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'left',
      boxSizing: 'border-box',
    }}>
      <div style={{
        color: colors.text.primary,
        fontWeight: 'bold',
        fontSize: '16px',
        lineHeight: '1.6',
        margin: 0,
        width: '100%',
      }}>
        <ReactMarkdown
          components={{
            h3: ({ children }) => (
              <h3 style={{
                fontSize: '18px',
                fontWeight: 'bold',
                margin: '16px 0 8px 0',
                color: colors.primary,
              }}>
                {children}
              </h3>
            ),
            p: ({ children }) => (
              <p style={{
                margin: '8px 0',
                lineHeight: '1.6',
              }}>
                {children}
              </p>
            ),
            ul: ({ children }) => (
              <ul style={{
                margin: '8px 0',
                paddingLeft: '20px',
              }}>
                {children}
              </ul>
            ),
            ol: ({ children }) => (
              <ol style={{
                margin: '8px 0',
                paddingLeft: '20px',
              }}>
                {children}
              </ol>
            ),
            li: ({ children }) => (
              <li style={{
                margin: '8px 0',
                lineHeight: '1.6',
                display: 'list-item',
              }}>
                {children}
              </li>
            ),
            strong: ({ children }) => (
              <strong style={{
                fontWeight: 'bold',
                color: colors.text.primary,
              }}>
                {children}
              </strong>
            ),
          }}
        >
          {text}
        </ReactMarkdown>
      </div>
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