import { ActivityIndicator, Text, View, StyleSheet, Pressable } from 'react-native';
import { RefreshCw } from 'lucide-react-native';
import { useSettings } from '@/lib/settingsContext';

interface StateViewProps {
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  emptyMessage?: string;
  children?: React.ReactNode;
}

export function StateView({
  isLoading,
  error,
  onRetry,
  emptyMessage,
  children,
}: StateViewProps) {
  const { theme } = useSettings();
  if (isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: theme.bg }]}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={[styles.message, { color: theme.textSecondary }]}>Loading…</Text>
      </View>
    );
  }
  if (error) {
    return (
      <View style={[styles.center, { backgroundColor: theme.bg }]}>
        <Text style={[styles.errorTitle, { color: theme.error }]}>Something went wrong</Text>
        <Text style={[styles.message, { color: theme.textSecondary }]}>{error}</Text>
        {onRetry && (
          <Pressable
            onPress={onRetry}
            style={({ pressed }) => [
              styles.retryBtn,
              { backgroundColor: theme.primary, borderColor: theme.primary },
              pressed && { opacity: 0.85 },
            ]}
          >
            <RefreshCw size={16} color={theme.textOnPrimary} strokeWidth={2} />
            <Text style={[styles.retryText, { color: theme.textOnPrimary }]}>Try again</Text>
          </Pressable>
        )}
      </View>
    );
  }
  if (emptyMessage && !children) {
    return (
      <View style={[styles.center, { backgroundColor: theme.bg }]}>
        <Text style={[styles.message, { color: theme.textSecondary }]}>{emptyMessage}</Text>
      </View>
    );
  }
  return <>{children}</>;
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  message: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    marginTop: 12,
    textAlign: 'center',
  },
  errorTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 16,
  },
  retryText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
  },
});
