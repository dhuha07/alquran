import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { Ayah } from '@/lib/types';

interface AudioPlayerState {
  currentAyah: Ayah | null;
  currentSurahNumber: number | null;
  ayahList: Ayah[];
  isPlaying: boolean;
  isLoading: boolean;
  error: string | null;
  qariId: string;
  play: (ayahs: Ayah[], startIndex: number, surahNumber: number, qariId: string) => void;
  togglePlay: () => void;
  next: () => void;
  previous: () => void;
  stop: () => void;
  seekTo: (index: number) => void;
}

const AudioPlayerContext = createContext<AudioPlayerState | null>(null);

export function AudioPlayerProvider({ children }: { children: React.ReactNode }) {
  const [ayahList, setAyahList] = useState<Ayah[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(-1);
  const [currentSurahNumber, setCurrentSurahNumber] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [qariId, setQariId] = useState<string>('ar.alafasy');

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Lazily create the audio element on web.
  const getAudio = useCallback((): HTMLAudioElement | null => {
    if (audioRef.current) return audioRef.current;
    if (typeof window !== 'undefined' && typeof window.Audio !== 'undefined') {
      const el = new window.Audio();
      audioRef.current = el;
      return el;
    }
    return null;
  }, []);

  const currentAyah = useMemo(
    () => (currentIndex >= 0 ? ayahList[currentIndex] ?? null : null),
    [ayahList, currentIndex],
  );

  const loadAndPlay = useCallback(
    (index: number, list: Ayah[], surah: number, qari: string) => {
      const audio = getAudio();
      if (!audio) {
        setError('Audio playback is not available on this platform.');
        return;
      }
      const ayah = list[index];
      if (!ayah) return;
      const url = ayah.audio ?? `https://cdn.islamic.network/quran/audio/128/${qari}/${ayah.number}.mp3`;
      setIsLoading(true);
      setError(null);
      audio.src = url;
      audio.play()
        .then(() => setIsPlaying(true))
        .catch((e: Error) => {
          setError(`Unable to play audio: ${e.message}`);
          setIsPlaying(false);
        })
        .finally(() => setIsLoading(false));
    },
    [getAudio],
  );

  const play = useCallback(
    (ayahs: Ayah[], startIndex: number, surahNumber: number, qari: string) => {
      setQariId(qari);
      setAyahList(ayahs);
      setCurrentSurahNumber(surahNumber);
      setCurrentIndex(startIndex);
      loadAndPlay(startIndex, ayahs, surahNumber, qari);
    },
    [loadAndPlay],
  );

  const togglePlay = useCallback(() => {
    const audio = getAudio();
    if (!audio) return;
    if (audio.paused) {
      audio.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
    } else {
      audio.pause();
      setIsPlaying(false);
    }
  }, [getAudio]);

  const next = useCallback(() => {
    setCurrentIndex((i) => {
      const ni = i + 1;
      if (ni >= ayahList.length) {
        setIsPlaying(false);
        return i;
      }
      loadAndPlay(ni, ayahList, currentSurahNumber ?? 0, qariId);
      return ni;
    });
  }, [ayahList, currentSurahNumber, qariId, loadAndPlay]);

  const previous = useCallback(() => {
    setCurrentIndex((i) => {
      const pi = i - 1;
      if (pi < 0) return i;
      loadAndPlay(pi, ayahList, currentSurahNumber ?? 0, qariId);
      return pi;
    });
  }, [ayahList, currentSurahNumber, qariId, loadAndPlay]);

  const stop = useCallback(() => {
    const audio = getAudio();
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
    setIsPlaying(false);
    setCurrentIndex(-1);
    setAyahList([]);
    setCurrentSurahNumber(null);
  }, [getAudio]);

  const seekTo = useCallback(
    (index: number) => {
      if (index < 0 || index >= ayahList.length) return;
      setCurrentIndex(index);
      loadAndPlay(index, ayahList, currentSurahNumber ?? 0, qariId);
    },
    [ayahList, currentSurahNumber, qariId, loadAndPlay],
  );

  // Wire up audio element events for auto-advance to the next ayah.
  useEffect(() => {
    const audio = getAudio();
    if (!audio) return;
    const handleEnded = () => {
      setCurrentIndex((i) => {
        const ni = i + 1;
        if (ni >= ayahList.length) {
          setIsPlaying(false);
          return i;
        }
        loadAndPlay(ni, ayahList, currentSurahNumber ?? 0, qariId);
        return ni;
      });
    };
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    return () => {
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
    };
  }, [getAudio, ayahList, currentSurahNumber, qariId, loadAndPlay]);

  const value: AudioPlayerState = {
    currentAyah,
    currentSurahNumber,
    ayahList,
    isPlaying,
    isLoading,
    error,
    qariId,
    play,
    togglePlay,
    next,
    previous,
    stop,
    seekTo,
  };

  return <AudioPlayerContext.Provider value={value}>{children}</AudioPlayerContext.Provider>;
}

export function useAudioPlayer(): AudioPlayerState {
  const ctx = useContext(AudioPlayerContext);
  if (!ctx) {
    throw new Error('useAudioPlayer must be used within AudioPlayerProvider');
  }
  return ctx;
}
