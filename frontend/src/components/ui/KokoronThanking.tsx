import Image from 'next/image';

interface KokoronThankingProps {
  size?: number;
}

export default function KokoronThanking({
  size = 120,
}: KokoronThankingProps) {
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
        src="/感謝のこころん.png"
        alt="感謝のこころん"
        width={size}
        height={size}
        style={{ objectFit: 'contain' }}
      />
    </div>
  );
}
