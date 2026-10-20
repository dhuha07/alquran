import { useCallback, useEffect, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
  ScrollView,
  Switch,
} from 'react-native';
import {
  Sun,
  Moon,
  Monitor,
  Type,
  Eye,
  EyeOff,
  Languages,
  Mic2,
  Target,
  Check,
} from 'lucide-react-native';
import { Header } from '@/components/Header';
import { useSettings } from '@/lib/settingsContext';
import { fetchQariList } from '@/lib/quranApi';
import type { Qari } from '@/lib/types';

export default function SettingsTab() {
  const { settings, theme, update, isLoaded } = useSettings();
  const [qaris, setQaris] = useState<Qari[]>([]);
  const [qariLoading, setQariLoading] = useState(true);
  const [qariOpen, setQariOpen] = useState(false);

  const loadQaris = useCallback(async () => {
    setQariLoading(true);
    try {
      const list = await fetchQariList();
      setQaris(list);
    } catch {
      // ignore — selection still works with default
    } finally {
      setQariLoading(false);
    }
  }, []);

  useEffect(() => {
    loadQaris();
  }, [loadQaris]);

  if (!isLoaded) {
    return (
      <View style={[styles.container, { backgroundColor: theme.bg }]}>
        <Header title="Settings" />
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      </View>
    );
  }

  const themeOptions: Array<{ key: 'light' | 'dark' | 'system'; label: string; icon: React.ReactNode }> = [
    { key: 'light', label: 'Light', icon: <Sun size={16} color={theme.text} strokeWidth={2} /> },
    { key: 'dark', label: 'Dark', icon: <Moon size={16} color={theme.text} strokeWidth={2} /> },
    { key: 'system', label: 'System', icon: <Monitor size={16} color={theme.text} strokeWidth={2} /> },
  ];

  const selectedQari = qaris.find((q) => q.identifier === settings.qariId);

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.bg }]}>
      <Header title="Settings" subtitle="Personalize your reading experience" />

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>Appearance</Text>
        <View style={[styles.card, { backgroundColor: theme.bgElevated }]}>
          <View style={styles.themeRow}>
            {themeOptions.map((opt) => {
              const active = settings.theme === opt.key;
              return (
                <Pressable
                  key={opt.key}
                  onPress={() => update({ theme: opt.key })}
                  style={[
                    styles.themeOption,
                    {
                      backgroundColor: active ? theme.primary : theme.bgCard,
                      borderColor: active ? theme.primary : theme.border,
                    },
                  ]}
                >
                  {opt.icon}
                  <Text
                    style={[
                      styles.themeLabel,
                      { color: active ? theme.textOnPrimary : theme.text },
                    ]}
                  >
                    {opt.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>Typography</Text>
        <View style={[styles.card, { backgroundColor: theme.bgElevated }]}>
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <Type size={18} color={theme.primary} strokeWidth={2} />
              <View>
                <Text style={[styles.rowTitle, { color: theme.text }]}>Arabic font size</Text>
                <Text style={[styles.rowSub, { color: theme.textSecondary }]}>
                  {settings.arabicFontSize}px
                </Text>
              </View>
            </View>
            <FontSizer
              value={settings.arabicFontSize}
              min={20}
              max={48}
              onChange={(v) => update({ arabicFontSize: v })}
              theme={theme}
            />
          </View>
          <View style={[styles.divider, { backgroundColor: theme.divider }]} />
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <Languages size={18} color={theme.primary} strokeWidth={2} />
              <View>
                <Text style={[styles.rowTitle, { color: theme.text }]}>Translation font size</Text>
                <Text style={[styles.rowSub, { color: theme.textSecondary }]}>
                  {settings.translationFontSize}px
                </Text>
              </View>
            </View>
            <FontSizer
              value={settings.translationFontSize}
              min={12}
              max={26}
              onChange={(v) => update({ translationFontSize: v })}
              theme={theme}
            />
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>Reading view</Text>
        <View style={[styles.card, { backgroundColor: theme.bgElevated }]}>
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              {settings.showTranslation ? (
                <Eye size={18} color={theme.primary} strokeWidth={2} />
              ) : (
                <EyeOff size={18} color={theme.textSecondary} strokeWidth={2} />
              )}
              <Text style={[styles.rowTitle, { color: theme.text }]}>Show translation</Text>
            </View>
            <Switch
              value={settings.showTranslation}
              onValueChange={(v) => update({ showTranslation: v })}
              trackColor={{ false: theme.border, true: theme.primary }}
            />
          </View>
          <View style={[styles.divider, { backgroundColor: theme.divider }]} />
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              {settings.showTransliteration ? (
                <Eye size={18} color={theme.primary} strokeWidth={2} />
              ) : (
                <EyeOff size={18} color={theme.textSecondary} strokeWidth={2} />
              )}
              <Text style={[styles.rowTitle, { color: theme.text }]}>Show transliteration</Text>
            </View>
            <Switch
              value={settings.showTransliteration}
              onValueChange={(v) => update({ showTransliteration: v })}
              trackColor={{ false: theme.border, true: theme.primary }}
            />
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>Reciter</Text>
        <View style={[styles.card, { backgroundColor: theme.bgElevated }]}>
          <Pressable
            onPress={() => setQariOpen((v) => !v)}
            style={({ pressed }) => [pressed && { opacity: 0.7 }]}
          >
            <View style={styles.row}>
              <View style={styles.rowLeft}>
                <Mic2 size={18} color={theme.primary} strokeWidth={2} />
                <View>
                  <Text style={[styles.rowTitle, { color: theme.text }]}>Qari</Text>
                  <Text style={[styles.rowSub, { color: theme.textSecondary }]} numberOfLines={1}>
                    {qariLoading ? 'Loading…' : selectedQari?.name ?? settings.qariId}
                  </Text>
                </View>
              </View>
              <Text style={[styles.chevron, { color: theme.textSecondary }]}>
                {qariOpen ? 'Hide' : 'Change'}
              </Text>
            </View>
          </Pressable>
          {qariOpen && !qariLoading && (
            <View style={styles.qariList}>
              {qaris.map((q) => {
                const active = q.identifier === settings.qariId;
                return (
                  <Pressable
                    key={q.identifier}
                    onPress={() => {
                      update({ qariId: q.identifier });
                      setQariOpen(false);
                    }}
                    style={({ pressed }) => [
                      styles.qariRow,
                      { backgroundColor: active ? theme.bgCard : 'transparent' },
                      pressed && { opacity: 0.7 },
                    ]}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.qariName, { color: theme.text }]}>{q.name}</Text>
                      <Text style={[styles.qariArabic, { color: theme.textSecondary }]}>
                        {q.arabicName}
                      </Text>
                    </View>
                    {active && <Check size={16} color={theme.primary} strokeWidth={2.4} />}
                  </Pressable>
                );
              })}
            </View>
          )}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>Murojaah target</Text>
        <View style={[styles.card, { backgroundColor: theme.bgElevated }]}>
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <Target size={18} color={theme.primary} strokeWidth={2} />
              <View>
                <Text style={[styles.rowTitle, { color: theme.text }]}>Daily target</Text>
                <Text style={[styles.rowSub, { color: theme.textSecondary }]}>
                  {settings.dailyTarget} ayahs per day
                </Text>
              </View>
            </View>
            <FontSizer
              value={settings.dailyTarget}
              min={1}
              max={20}
              onChange={(v) => update({ dailyTarget: v })}
              theme={theme}
            />
          </View>
        </View>
      </View>

      <View style={{ height: 120 }} />
    </ScrollView>
  );
}

function FontSizer({
  value,
  min,
  max,
  onChange,
  theme,
}: {
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
  theme: ReturnType<typeof useSettings>['theme'];
}) {
  return (
    <View style={styles.sizerRow}>
      <Pressable
        onPress={() => onChange(Math.max(min, value - 1))}
        style={({ pressed }) => [
          styles.sizerBtn,
          { backgroundColor: theme.bgCard, borderColor: theme.border },
          pressed && { opacity: 0.6 },
        ]}
        accessibilityLabel="Decrease"
      >
        <Text style={[styles.sizerText, { color: theme.text }]}>−</Text>
      </Pressable>
      <Text style={[styles.sizerValue, { color: theme.text }]}>{value}</Text>
      <Pressable
        onPress={() => onChange(Math.min(max, value + 1))}
        style={({ pressed }) => [
          styles.sizerBtn,
          { backgroundColor: theme.bgCard, borderColor: theme.border },
          pressed && { opacity: 0.6 },
        ]}
        accessibilityLabel="Increase"
      >
        <Text style={[styles.sizerText, { color: theme.text }]}>+</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  section: { paddingHorizontal: 16, marginTop: 18 },
  sectionTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 8,
    marginLeft: 4,
  },
  card: { borderRadius: 14, padding: 16 },
  themeRow: { flexDirection: 'row', gap: 10 },
  themeOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  themeLabel: { fontFamily: 'Inter-SemiBold', fontSize: 13 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  rowTitle: { fontFamily: 'Inter-SemiBold', fontSize: 15 },
  rowSub: { fontFamily: 'Inter-Regular', fontSize: 12, marginTop: 2 },
  divider: { height: 1, marginVertical: 12 },
  sizerRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  sizerBtn: {
    width: 34,
    height: 34,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sizerText: { fontFamily: 'Inter-Bold', fontSize: 18 },
  sizerValue: { fontFamily: 'Inter-SemiBold', fontSize: 14, minWidth: 24, textAlign: 'center' },
  chevron: { fontFamily: 'Inter-SemiBold', fontSize: 12 },
  qariList: { marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#E5E7EB22' },
  qariRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 8,
    gap: 10,
  },
  qariName: { fontFamily: 'Inter-SemiBold', fontSize: 13 },
  qariArabic: { fontFamily: 'Amiri-Regular', fontSize: 14, marginTop: 2 },
});
