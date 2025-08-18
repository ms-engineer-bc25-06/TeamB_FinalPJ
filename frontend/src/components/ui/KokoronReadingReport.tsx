import Image from 'next/image';

interface KokoronReadingReportProps {
  size?: number;
}

export default function KokoronReadingReport({
  size = 120,
}: KokoronReadingReportProps) {
  return (
    <div
      style={{
        width: size + 20,
        height: size + 20,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <Image
        src="/images/kokoron/kokoron_readingreport.webp"
        alt="レポートをよむこころん"
        width={size}
        height={size}
        style={{ objectFit: 'contain' }}
      />
    </div>
  );
}
