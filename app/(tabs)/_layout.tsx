import { Tabs } from 'expo-router';
import { BookOpen, Brain, Compass, Settings as SettingsIcon } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';
import { useSettings } from '@/lib/settingsContext';
import { useAudioPlayer } from '@/lib/audioPlayer';
import { MiniPlayer } from '@/components/MiniPlayer';

export default function TabLayout() {
  const { theme } = useSettings();
  const { currentAyah } = useAudioPlayer();

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: theme.primary,
          tabBarInactiveTintColor: theme.textSecondary,
          tabBarStyle: {
            backgroundColor: theme.bgElevated,
            borderTopColor: theme.border,
            borderTopWidth: 1,
            paddingBottom: 6,
            paddingTop: 6,
            height: 60,
          },
          tabBarLabelStyle: {
            fontFamily: 'Inter-Medium',
            fontSize: 11,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Quran',
            tabBarIcon: ({ size, color }) => (
              <BookOpen size={size} color={color} strokeWidth={2} />
            ),
          }}
        />
        <Tabs.Screen
          name="murojaah"
          options={{
            title: 'Murojaah',
            tabBarIcon: ({ size, color }) => (
              <Brain size={size} color={color} strokeWidth={2} />
            ),
          }}
        />
        <Tabs.Screen
          name="qibla"
          options={{
            title: 'Qibla',
            tabBarIcon: ({ size, color }) => (
              <Compass size={size} color={color} strokeWidth={2} />
            ),
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: 'Settings',
            tabBarIcon: ({ size, color }) => (
              <SettingsIcon size={size} color={color} strokeWidth={2} />
            ),
          }}
        />
      </Tabs>
      {currentAyah && <MiniPlayer />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
