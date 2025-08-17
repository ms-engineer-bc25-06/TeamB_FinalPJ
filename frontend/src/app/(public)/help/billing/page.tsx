'use client';

import { useRouter } from 'next/navigation';
import {
  colors,
  commonStyles,
  spacing,
  fontSize,
  borderRadius,
} from '@/styles/theme';

export default function BillingHelpPage() {
  const router = useRouter();

  const handleBack = () => {
    router.back();
  };

  return (
    <div style={commonStyles.page.container}>
      <div style={commonStyles.page.mainContent}>
        {/* 戻るボタン */}
        <button
          onClick={handleBack}
          style={{
            position: 'absolute',
            top: spacing.lg,
            left: spacing.lg,
            background: 'none',
            border: 'none',
            fontSize: '20px',
            cursor: 'pointer',
            color: colors.text.secondary,
          }}
        >
          ← 戻る
        </button>

        <div
          style={{
            backgroundColor: colors.background.white,
            borderRadius: '16px',
            padding: spacing.xl,
            boxShadow: colors.shadow.heavy,
            maxWidth: '600px',
            width: '100%',
            margin: `${spacing.lg} 0`,
          }}
        >
          <h1
            style={{
              color: colors.text.primary,
              fontSize: fontSize.xl,
              fontWeight: 'bold',
              marginBottom: spacing.lg,
              textAlign: 'center',
            }}
          >
            料金・解約について
          </h1>

          <div
            style={{
              fontSize: fontSize.base,
              color: colors.text.primary,
              lineHeight: 1.6,
            }}
          >
            <section style={{ marginBottom: spacing.lg }}>
              <h2
                style={{
                  color: colors.primary,
                  fontSize: fontSize.large,
                  fontWeight: 'bold',
                  marginBottom: spacing.md,
                }}
              >
                💰 料金について
              </h2>
              <div style={{ marginBottom: spacing.md }}>
                <strong>プレミアムプラン: 月額300円（税込）</strong>
              </div>
              <ul style={{ paddingLeft: spacing.lg, marginBottom: spacing.md }}>
                <li>7日間の無料体験期間があります</li>
                <li>無料期間中はいつでもキャンセル可能</li>
                <li>キャンセルした場合、料金は一切発生しません</li>
                <li>無料期間終了後、自動的に月額課金が開始されます</li>
              </ul>
            </section>

            <section style={{ marginBottom: spacing.lg }}>
              <h2
                style={{
                  color: colors.primary,
                  fontSize: fontSize.large,
                  fontWeight: 'bold',
                  marginBottom: spacing.md,
                }}
              >
                🔄 解約について
              </h2>
              <ul style={{ paddingLeft: spacing.lg, marginBottom: spacing.md }}>
                <li>いつでも解約可能です</li>
                <li>解約後も現在の請求期間終了まで利用できます</li>
                <li>解約手続きは「請求・解約」ページから行えます</li>
                <li>解約後の返金はありません</li>
              </ul>
            </section>

            <section style={{ marginBottom: spacing.lg }}>
              <h2
                style={{
                  color: colors.primary,
                  fontSize: fontSize.large,
                  fontWeight: 'bold',
                  marginBottom: spacing.md,
                }}
              >
                📅 請求サイクル
              </h2>
              <ul style={{ paddingLeft: spacing.lg, marginBottom: spacing.md }}>
                <li>毎月同じ日に自動課金されます</li>
                <li>初回課金日は無料体験終了日の翌日です</li>
                <li>請求書はメールで送信されます</li>
              </ul>
            </section>

            <section style={{ marginBottom: spacing.lg }}>
              <h2
                style={{
                  color: colors.primary,
                  fontSize: fontSize.large,
                  fontWeight: 'bold',
                  marginBottom: spacing.md,
                }}
              >
                ❓ よくある質問
              </h2>
              <div style={{ marginBottom: spacing.md }}>
                <strong>Q: 無料体験期間中に解約したらどうなりますか？</strong>
                <p
                  style={{
                    marginTop: spacing.xs,
                    color: colors.text.secondary,
                  }}
                >
                  A: 料金は一切発生せず、解約日まで全機能をご利用いただけます。
                </p>
              </div>
              <div style={{ marginBottom: spacing.md }}>
                <strong>Q: 支払い方法は何が使えますか？</strong>
                <p
                  style={{
                    marginTop: spacing.xs,
                    color: colors.text.secondary,
                  }}
                >
                  A: クレジットカード（Visa、Mastercard、JCB、American
                  Express）がご利用いただけます。
                </p>
              </div>
              <div style={{ marginBottom: spacing.md }}>
                <strong>Q: 解約後にデータは削除されますか？</strong>
                <p
                  style={{
                    marginTop: spacing.xs,
                    color: colors.text.secondary,
                  }}
                >
                  A: 解約後30日間はデータを保持します。再登録時に復元可能です。
                </p>
              </div>
            </section>
          </div>

          <div
            style={{
              textAlign: 'center',
              marginTop: spacing.xl,
              padding: spacing.lg,
              backgroundColor: colors.background.white,
              borderRadius: borderRadius.medium,
            }}
          >
            <p
              style={{
                color: colors.text.secondary,
                fontSize: fontSize.small,
                margin: 0,
              }}
            >
              その他ご不明な点がございましたら、
              <br />
              サポートまでお気軽にお問い合わせください。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
