import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import WelcomeScreen from '../screens/WelcomeScreen';
import BLEScanScreen from '../screens/BLEScanScreen';
import { COLORS } from '../utils/constants';

const Stack = createStackNavigator();

/**
 * Onboarding Navigator
 * Stack navigation flow for first-time onboarding:
 * 1. Welcome -> WelcomeScreen
 * 2. BLEScan -> BLEScanScreen
 */
export default function OnboardingNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Welcome"
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: COLORS.Surface || '#FFFFFF' },
        animationEnabled: true,
      }}
    >
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="BLEScan" component={BLEScanScreen} />
    </Stack.Navigator>
  );
}
