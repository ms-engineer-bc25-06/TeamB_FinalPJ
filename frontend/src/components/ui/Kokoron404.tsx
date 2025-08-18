import Image from 'next/image';

interface Kokoron404Props {
  size?: number;
}

export default function Kokoron404({ size = 120 }: Kokoron404Props) {
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
        src="/images/kokoron/kokoron_404.webp"
        alt="迷子のこころん"
        width={size}
        height={size}
        style={{ objectFit: 'contain' }}
      />
    </div>
  );
}
