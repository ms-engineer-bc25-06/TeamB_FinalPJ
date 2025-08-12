import Image from 'next/image';

interface KokoronBowingProps {
  size?: number;
}

export default function KokoronBowing({ size = 120 }: KokoronBowingProps) {
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
        src="/images/kokoron/kokoron_bowing.webp"
        alt="お辞儀するこころん"
        width={size}
        height={size}
        style={{ objectFit: 'contain' }}
      />
    </div>
  );
}
