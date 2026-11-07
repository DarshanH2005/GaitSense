import React, { useEffect } from 'react';
import { Platform, View, ActivityIndicator, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import { UserProvider } from './src/context/UserContext';
import { BLEProvider } from './src/context/BLEContext';
import { GaitProvider } from './src/context/GaitContext';
import AppNavigator from './src/navigation/AppNavigator';

// Inject font and web styles into document
if (Platform.OS === 'web' && typeof document !== 'undefined') {
  const fontId = 'gaitsense-icon-fonts';
  if (!document.getElementById(fontId)) {
    const style = document.createElement('style');
    style.id = fontId;
    style.textContent = `
      @font-face {
        font-family: 'MaterialCommunityIcons';
        src: url('https://cdn.jsdelivr.net/npm/@expo/vector-icons@14.0.0/build/vendor/react-native-vector-icons/Fonts/MaterialCommunityIcons.ttf') format('truetype');
      }
      * {
        font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }
    `;
    document.head.appendChild(style);
  }
}

/**
 * GaitSense Root Application Component
 * Sets up Context Providers, Navigation, and Font Loading.
 */
export default function App() {
  const [fontsLoaded] = useFonts({
    ...MaterialCommunityIcons.font,
  });

  useEffect(() => {
    // Only configure notifications on physical native devices
    if (Platform.OS !== 'web') {
      try {
        const Notifications = require('expo-notifications');
        if (Notifications?.setNotificationHandler) {
          Notifications.setNotificationHandler({
            handleNotification: async () => ({
              shouldShowAlert: true,
              shouldPlaySound: true,
              shouldSetBadge: true,
            }),
          });
        }
      } catch (e) {
        // Safe fallback
      }
    }
  }, []);

  if (!fontsLoaded && Platform.OS !== 'web') {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#0058BD" />
      </View>
    );
  }

  return (
    <SafeAreaProvider style={styles.container}>
      <View style={styles.container}>
        <UserProvider>
          <BLEProvider>
            <GaitProvider>
              <NavigationContainer>
                <StatusBar style="dark" translucent backgroundColor="transparent" />
                <AppNavigator />
              </NavigationContainer>
            </GaitProvider>
          </BLEProvider>
        </UserProvider>
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: '#F9F9FF',
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9F9FF',
  },
});
