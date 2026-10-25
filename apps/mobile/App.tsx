import React from 'react';
import { StyleSheet, View, Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from './src/context/AuthContext';
import { useFonts, PlusJakartaSans_400Regular, PlusJakartaSans_500Medium, PlusJakartaSans_600SemiBold, PlusJakartaSans_700Bold } from '@expo-google-fonts/plus-jakarta-sans';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { COLORS } from './src/theme/colors';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30 * 1000, // 30 seconds
    },
  },
});

export default function App() {
  const [fontsLoaded] = useFonts({
    'PlusJakartaSans-Regular': PlusJakartaSans_400Regular,
    'PlusJakartaSans-Medium': PlusJakartaSans_500Medium,
    'PlusJakartaSans-SemiBold': PlusJakartaSans_600SemiBold,
    'PlusJakartaSans-Bold': PlusJakartaSans_700Bold,
  });

  if (!fontsLoaded) {
    return null;
  }

  return (
    <SafeAreaProvider style={styles.webContainer}>
      <StatusBar style="dark" />
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <View style={styles.appFrame}>
            <AppNavigator />
          </View>
        </AuthProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  webContainer: {
    flex: 1,
    backgroundColor: '#EBE8F3',
  },
  appFrame: {
    flex: 1,
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
    overflow: 'hidden',
    backgroundColor: COLORS.bg,
    position: 'relative',
    ...(Platform.OS === 'web' && {
      minHeight: '100vh',
      boxShadow: '0 4px 30px rgba(0, 0, 0, 0.08)',
    } as any),
  },
});
