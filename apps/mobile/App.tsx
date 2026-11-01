import {ChatLive} from './src/hooks/useChat';
import {PromotionLiveProvider} from './src/hooks/usePromotions';
import { NotificationToast } from './src/components/NotificationToast';
import { WebFontFaces } from './src/components/ui/WebFontFaces';
import React,{useContext} from 'react';
import {isAdmin} from './src/utils/roles';
import { StyleSheet, View, Platform } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, AuthContext } from './src/context/AuthContext';
import { useFonts, PlusJakartaSans_400Regular, PlusJakartaSans_500Medium, PlusJakartaSans_600SemiBold, PlusJakartaSans_700Bold } from '@expo-google-fonts/plus-jakarta-sans';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { COLORS } from './src/theme/colors';
import { WaveBackdrop } from './src/components/ui/WaveBackdrop';

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

  if (!fontsLoaded && Platform.OS !== 'web') {
    return null;
  }

  return (
    <SafeAreaProvider style={styles.webContainer}>
      <StatusBar style="dark" />
      <QueryClientProvider client={queryClient}>
        <AuthProvider><PromotionLiveProvider><ChatLive>
          <AppSurface />
        </ChatLive></PromotionLiveProvider></AuthProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}

function AppSurface(){const {user}=useContext(AuthContext);const admin=isAdmin(user);return <SafeAreaView edges={['top','left','right']} style={[styles.appFrame,admin&&{maxWidth:1120,backgroundColor:COLORS.surfaceAlt}]}><WebFontFaces/>{!admin&&<WaveBackdrop/>}<View style={styles.appContent}><AppNavigator/>{!admin&&<NotificationToast/>}</View></SafeAreaView>;}

const styles = StyleSheet.create({
  appContent: { flex: 1, zIndex: 1 },
  webContainer: {
    flex: 1,
    backgroundColor: COLORS.surfaceAlt,
  },
  appFrame: {
    flex: 1,
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
    overflow: 'hidden',
    backgroundColor: COLORS.bg,
    position: 'relative',
    paddingTop: Platform.OS === 'web' ? 0 : 4,
    ...(Platform.OS === 'web' && {
      minHeight: '100vh',
      borderLeftWidth: 1,
      borderRightWidth: 1,
      borderColor: COLORS.border,
    } as any),
  },
});
