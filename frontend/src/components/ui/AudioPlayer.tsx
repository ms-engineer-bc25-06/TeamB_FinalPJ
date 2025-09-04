'use client';
import { useAudio } from '@/hooks/useAudio';
import React, { useEffect } from 'react';

interface AudioPlayerProps {
  src: string;
  autoPlay?: boolean;
  volume?: number;
  onEnded?: () => void;
  onError?: React.ReactEventHandler<HTMLAudioElement>;
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
  className = '',
}: AudioPlayerProps) => {
  const { audioRef, isPlaying, isLoaded, setIsLoaded } = useAudio({
    src,
    autoPlay,
    volume,
    onEnded,
    onError,
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
