import Image from 'next/image';

interface KokoronDefaultProps {
  size?: number;
}

export default function KokoronDefault({ size = 120 }: KokoronDefaultProps) {
  return (
    <div style={{
      width: size + 20,
      height: size + 20,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
    }}>
      <Image
        src="/こころん（仮）.png"
        alt="こころん"
        width={size}
        height={size}
        style={{ objectFit: 'contain' }}
      />
    </div>
  );
} 