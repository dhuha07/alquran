import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Pause, Play, SkipBack, SkipForward, X } from 'lucide-react-native';
import { useAudioPlayer } from '@/lib/audioPlayer';
import { useSettings } from '@/lib/settingsContext';

export function MiniPlayer() {
  const { currentAyah, isPlaying, isLoading, togglePlay, next, previous, stop } = useAudioPlayer();
  const { theme } = useSettings();
  if (!currentAyah) return null;

  return (
    <View style={[styles.wrapper, { backgroundColor: theme.bgElevated, borderTopColor: theme.border }]}>
      <View style={[styles.bar, { backgroundColor: theme.primary }]} />
      <View style={styles.row}>
        <View style={styles.info}>
          <Text style={[styles.surah, { color: theme.text }]} numberOfLines={1}>
            Ayah {currentAyah.numberInSurah}
          </Text>
          <Text style={[styles.translation, { color: theme.textSecondary }]} numberOfLines={1}>
            {currentAyah.translation ?? currentAyah.text}
          </Text>
        </View>
        <View style={styles.controls}>
          <Pressable
            onPress={previous}
            style={({ pressed }) => [styles.btn, pressed && { opacity: 0.6 }]}
            hitSlop={10}
            accessibilityLabel="Previous ayah"
          >
            <SkipBack size={20} color={theme.text} strokeWidth={2} />
          </Pressable>
          <Pressable
            onPress={togglePlay}
            style={({ pressed }) => [
              styles.playBtn,
              { backgroundColor: theme.primary },
              pressed && { opacity: 0.85 },
            ]}
            accessibilityLabel={isPlaying ? 'Pause' : 'Play'}
          >
            {isLoading ? (
              <Text style={[styles.playIcon, { color: theme.textOnPrimary }]}>…</Text>
            ) : isPlaying ? (
              <Pause size={20} color={theme.textOnPrimary} strokeWidth={2.2} />
            ) : (
              <Play size={20} color={theme.textOnPrimary} strokeWidth={2.2} />
            )}
          </Pressable>
          <Pressable
            onPress={next}
            style={({ pressed }) => [styles.btn, pressed && { opacity: 0.6 }]}
            hitSlop={10}
            accessibilityLabel="Next ayah"
          >
            <SkipForward size={20} color={theme.text} strokeWidth={2} />
          </Pressable>
          <Pressable
            onPress={stop}
            style={({ pressed }) => [styles.btn, pressed && { opacity: 0.6 }]}
            hitSlop={10}
            accessibilityLabel="Stop and close player"
          >
            <X size={18} color={theme.textSecondary} strokeWidth={2} />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    bottom: 60,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  bar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    opacity: 0.8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  info: {
    flex: 1,
  },
  surah: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
  },
  translation: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    marginTop: 2,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  btn: {
    padding: 8,
    minHeight: 44,
    minWidth: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playIcon: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
  },
});
