import React, { useEffect, useRef, useState } from 'react';

interface UseAudioOptions {
  src: string;
  autoPlay?: boolean;
  volume?: number;
  onEnded?: () => void;
  onError?: React.ReactEventHandler<HTMLAudioElement>;
}

export const useAudio = ({
  src,
  autoPlay = false,
  volume = 1.0,
  onEnded,
  onError,
}: UseAudioOptions) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;

      if (autoPlay && isLoaded) {
        playAudio();
      }
    }
  }, [autoPlay, isLoaded, volume]);

  const playAudio = async () => {
    if (audioRef.current) {
      try {
        await audioRef.current.play();
        setIsPlaying(true);
      } catch (error) {
        console.log('音声の再生に失敗しました:', error);
      }
    }
  };

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
    }
  };

  const pauseAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const setVolume = (newVolume: number) => {
    if (audioRef.current) {
      audioRef.current.volume = Math.max(0, Math.min(1, newVolume));
    }
  };

  return {
    audioRef,
    isPlaying,
    isLoaded,
    playAudio,
    stopAudio,
    pauseAudio,
    setVolume,
    setIsLoaded,
  };
};
