import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { View } from 'react-native';
import { AuthProvider, useAuth } from '@/auth/AuthContext';
import { LocaleProvider } from '@/i18n/LocaleContext';
import { colors } from '@/theme';
import { WorkspaceProvider } from '@/workspace/WorkspaceContext';

SplashScreen.preventAutoHideAsync().catch(() => undefined);
SplashScreen.setOptions({ duration: 700, fade: true });

function RootNavigator() {
  const { status } = useAuth();
  const signedIn = status === 'signedIn';

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'fade',
        contentStyle: { backgroundColor: colors.bg },
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Protected guard={!signedIn} redirectTo="/home">
        <Stack.Screen name="login" />
        <Stack.Screen name="register" />
      </Stack.Protected>
      <Stack.Screen name="site/[page]" />
      <Stack.Protected guard={signedIn} redirectTo="/login">
        <Stack.Screen name="home" />
        <Stack.Screen name="discover" />
        <Stack.Screen name="news" />
        <Stack.Screen name="marketplace" />
        <Stack.Screen name="profile" />
        <Stack.Screen name="notifications" />
        <Stack.Screen name="screens/[...slug]" />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync().catch(() => undefined);
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <LocaleProvider>
        <AuthProvider>
          <WorkspaceProvider>
            <StatusBar style="light" />
            <RootNavigator />
          </WorkspaceProvider>
        </AuthProvider>
      </LocaleProvider>
    </View>
  );
}
