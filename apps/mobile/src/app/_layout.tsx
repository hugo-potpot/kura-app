import { useEffect, useRef } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { kuraLightTheme, kuraDarkTheme } from '@/theme/kura-theme';
import { useAuth } from '@/features/auth/hooks/useAuth';

const INACTIVITY_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 1000 * 60 * 5,
    },
  },
});

function AppStateWatcher(): null {
  const { clearSession } = useAuth();
  const router = useRouter();
  const backgroundTime = useRef<number | null>(null);

  useEffect(() => {
    const subscription = AppState.addEventListener(
      'change',
      (nextState: AppStateStatus): void => {
        if (nextState === 'background' || nextState === 'inactive') {
          backgroundTime.current = Date.now();
        } else if (nextState === 'active' && backgroundTime.current !== null) {
          const elapsed = Date.now() - backgroundTime.current;
          if (elapsed >= INACTIVITY_TIMEOUT_MS) {
            void clearSession().then(() => {
              router.replace('/(auth)/login');
            });
          }
          backgroundTime.current = null;
        }
      },
    );

    return () => subscription.remove();
  }, [clearSession, router]);

  return null;
}

export default function RootLayout(): React.JSX.Element {
  const colorScheme = useColorScheme();
  const paperTheme = colorScheme === 'dark' ? kuraDarkTheme : kuraLightTheme;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <SafeAreaProvider>
          <PaperProvider theme={paperTheme}>
            <AppStateWatcher />
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="(auth)" />
              <Stack.Screen name="(app)" />
            </Stack>
            <StatusBar style="auto" />
          </PaperProvider>
        </SafeAreaProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
