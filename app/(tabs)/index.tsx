import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { Search, X } from 'lucide-react-native';
import { router } from 'expo-router';
import { Header } from '@/components/Header';
import { useSettings } from '@/lib/settingsContext';
import { fetchSurahList } from '@/lib/quranApi';
import type { Surah } from '@/lib/types';

export default function QuranTab() {
  const { theme } = useSettings();
  const [surahs, setSurahs] = useState<Surah[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await fetchSurahList();
      setSurahs(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load surahs');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    if (!query.trim()) return surahs;
    const q = query.trim().toLowerCase();
    return surahs.filter(
      (s) =>
        s.englishName.toLowerCase().includes(q) ||
        s.name.includes(q) ||
        s.englishNameTranslation.toLowerCase().includes(q) ||
        String(s.number) === q,
    );
  }, [surahs, query]);

  const renderItem = ({ item }: { item: Surah }) => (
    <Pressable
      onPress={() => router.push({ pathname: '/surah/[number]', params: { number: item.number } })}
      style={({ pressed }) => [
        styles.row,
        { backgroundColor: theme.bgElevated, borderBottomColor: theme.divider },
        pressed && { backgroundColor: theme.bgCard },
      ]}
    >
      <View style={[styles.numberBadge, { backgroundColor: theme.primary }]}>
        <Text style={[styles.number, { color: theme.textOnPrimary }]}>{item.number}</Text>
      </View>
      <View style={styles.rowText}>
        <View style={styles.nameRow}>
          <Text style={[styles.englishName, { color: theme.text }]}>{item.englishName}</Text>
          <Text style={[styles.revelation, { color: theme.textSecondary }]}>
            {item.revelationType}
          </Text>
        </View>
        <Text style={[styles.translation, { color: theme.textSecondary }]} numberOfLines={1}>
          {item.englishNameTranslation} · {item.numberOfAyahs} ayahs
        </Text>
      </View>
      <Text style={[styles.arabicName, { color: theme.primary }]}>{item.name}</Text>
    </Pressable>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <Header title="Quran" subtitle="Read and listen to the Holy Quran" />
      <View
        style={[
          styles.searchWrap,
          { backgroundColor: theme.bgElevated, borderColor: theme.border },
        ]}
      >
        <Search size={18} color={theme.textSecondary} strokeWidth={2} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search surah name or number"
          placeholderTextColor={theme.textSecondary}
          style={[styles.searchText, { color: theme.text }]}
          autoCapitalize="none"
          autoCorrect={false}
          accessibilityLabel="Search surahs"
        />
        {query.length > 0 && (
          <Pressable onPress={() => setQuery('')} hitSlop={10} accessibilityLabel="Clear search">
            <X size={16} color={theme.textSecondary} strokeWidth={2} />
          </Pressable>
        )}
      </View>
      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => String(item.number)}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginTop: 8,
    marginHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  searchText: {
    flex: 1,
    fontFamily: 'Inter-Regular',
    fontSize: 15,
    paddingVertical: 4,
  },
  listContent: { paddingHorizontal: 16, paddingBottom: 120, paddingTop: 8 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    gap: 12,
  },
  numberBadge: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  number: { fontFamily: 'Inter-Bold', fontSize: 14 },
  rowText: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  englishName: { fontFamily: 'Inter-SemiBold', fontSize: 16 },
  revelation: { fontFamily: 'Inter-Regular', fontSize: 11 },
  translation: { fontFamily: 'Inter-Regular', fontSize: 13, marginTop: 3 },
  arabicName: { fontFamily: 'Amiri-Regular', fontSize: 22 },
  loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
