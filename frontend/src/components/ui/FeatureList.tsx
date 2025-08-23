import React from 'react';
import { colors, spacing, fontSize, borderRadius } from '@/styles/theme';

interface FeatureListProps {
  title?: string;
  variant?: 'default' | 'compact' | 'detailed';
  className?: string;
}

export const FeatureList: React.FC<FeatureListProps> = ({
  title = "✨ このアプリの機能　✨",
  variant = 'default',
  className,
}) => {
  const features = [
    { id: '1', text: 'お子様の音声付き感情記録' },
    { id: '2', text: '成長記録の長期保存' },
    { id: '3', text: 'ロールプレイ' },
    { id: '4', text: 'AIによる個別アドバイス' },
  ];

  const getVariantStyles = () => {
    switch (variant) {
      case 'compact':
        return {
          padding: spacing.md,
          fontSize: fontSize.small,
        };
      case 'detailed':
        return {
          padding: spacing.xl,
          fontSize: fontSize.base,
        };
      default:
        return {
          padding: spacing.lg,
          fontSize: fontSize.small,
        };
    }
  };

  const variantStyles = getVariantStyles();

  return (
    <div
      style={{
        backgroundColor: '#f8f9fa',
        borderRadius: borderRadius.medium,
        padding: variantStyles.padding,
        marginBottom: spacing.xl,
        textAlign: 'left',
        ...(className as React.CSSProperties),
      }}
    >
      {title && (
        <h3
          style={{
            color: colors.text.primary,
            fontSize: variantStyles.fontSize,
            fontWeight: 'bold',
            marginBottom: spacing.md,
            textAlign: 'center',
          }}
        >
          {title}
        </h3>
      )}

      <div
        style={{
          display: 'grid',
          gap: spacing.sm,
          fontSize: variantStyles.fontSize,
          color: colors.text.primary,
        }}
      >
        {features.map((feature) => (
          <div
            key={feature.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: spacing.sm,
            }}
          >
            <span>✅</span>
            <span>{feature.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
};