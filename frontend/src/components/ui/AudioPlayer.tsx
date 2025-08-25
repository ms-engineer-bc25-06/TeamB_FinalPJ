'use client';
import { useEffect } from 'react';
import { useAudio } from '@/hooks/useAudio';

interface AudioPlayerProps {
  src: string;
  autoPlay?: boolean;
  volume?: number;
  onEnded?: () => void;
  onError?: (error: Event) => void;
  onLoad?: () => void;
  className?: string;
}

export const AudioPlayer = ({ 
  src, 
  autoPlay = false, 
  volume = 1.0,
  onEnded,
  onError,
  onLoad,
  className = ''
}: AudioPlayerProps) => {
  const { 
    audioRef, 
    isPlaying, 
    isLoaded, 
    setIsLoaded 
  } = useAudio({ 
    src, 
    autoPlay, 
    volume, 
    onEnded, 
    onError 
  });

  useEffect(() => {
    if (isLoaded && onLoad) {
      onLoad();
    }
  }, [isLoaded, onLoad]);

  return (
    <audio 
      ref={audioRef}
      src={src}
      preload="auto"
      onLoadedData={() => setIsLoaded(true)}
      onEnded={onEnded}
      onError={onError}
      className={className}
    />
  );
};
