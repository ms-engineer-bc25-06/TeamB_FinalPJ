import Image from 'next/image';

interface KokoronWelcomeProps {
  size?: number;
}

export default function KokoronWelcome({ size = 120 }: KokoronWelcomeProps) {
  return (
    <div style={{
      width: size + 100,
      height: size + 100,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
    }}>
      <Image
        src="/images/kokoron/kokoron_welcome.webp"
        alt="ウェルカムなこころん"
        width={350}
        height={350}
        style={{ objectFit: 'contain' }}
      />
    </div>
  );
} 