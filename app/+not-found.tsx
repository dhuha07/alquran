import { Link, Stack } from 'expo-router';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import { useSettings } from '@/lib/settingsContext';

export default function NotFoundScreen() {
  const { theme } = useSettings();
  return (
    <>
      <Stack.Screen options={{ title: 'Not found' }} />
      <View style={[styles.container, { backgroundColor: theme.bg }]}>
        <Text style={[styles.title, { color: theme.text }]}>Page not found</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          The page you were looking for doesn't exist.
        </Text>
        <Link href="/" asChild>
          <Pressable style={({ pressed }) => [styles.btn, { backgroundColor: theme.primary }, pressed && { opacity: 0.85 }]}>
            <Text style={[styles.btnText, { color: theme.textOnPrimary }]}>Back to Quran</Text>
          </Pressable>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 30 },
  title: { fontFamily: 'Inter-Bold', fontSize: 22 },
  subtitle: { fontFamily: 'Inter-Regular', fontSize: 14, marginTop: 8, textAlign: 'center' },
  btn: { paddingHorizontal: 22, paddingVertical: 12, borderRadius: 10, marginTop: 18 },
  btnText: { fontFamily: 'Inter-SemiBold', fontSize: 14 },
});
