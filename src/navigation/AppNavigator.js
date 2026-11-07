import React from 'react';
import { View, StyleSheet, ActivityIndicator, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useUser } from '../context/UserContext';
import { useGait } from '../context/GaitContext';
import { COLORS } from '../utils/constants';

// Screen Imports
import DashboardScreen from '../screens/DashboardScreen';
import LiveViewScreen from '../screens/LiveViewScreen';
import HistoryScreen from '../screens/HistoryScreen';
import AlertsScreen from '../screens/AlertsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import ReportScreen from '../screens/ReportScreen';
import RecordingScreen from '../screens/RecordingScreen';
import OnboardingNavigator from './OnboardingNavigator';
import BLEScanScreen from '../screens/BLEScanScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

/**
 * Profile & Reports Stack Navigator
 */
function ProfileStackNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="ProfileMain"
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: '#F9F9FF' },
      }}
    >
      <Stack.Screen name="ProfileMain" component={ProfileScreen} />
      <Stack.Screen name="Report" component={ReportScreen} />
      <Stack.Screen name="Recording" component={RecordingScreen} />
    </Stack.Navigator>
  );
}

/**
 * Main Tab Navigator
 * 5 primary tabs: Dashboard, Live View, History, Alerts, and Profile.
 */
function MainTabNavigator() {
  const gaitContext = useGait ? useGait() : {};
  const unreadAlertCount = gaitContext?.unreadAlertCount || 0;

  return (
    <Tab.Navigator
      initialRouteName="Dashboard"
      screenOptions={{
        headerShown: false,
        tabBarPosition: 'bottom',
        tabBarActiveTintColor: '#0058BD',
        tabBarInactiveTintColor: '#717786',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#ECEEF9',
          height: Platform.OS === 'ios' ? 84 : 64,
          paddingBottom: Platform.OS === 'ios' ? 24 : 8,
          paddingTop: 6,
        },
        tabBarItemStyle: {
          paddingVertical: 2,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 2,
        },
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          tabBarLabel: 'Dashboard',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.tabIconWrap, focused && styles.tabIconActiveWrap]}>
              <MaterialCommunityIcons
                name={focused ? "view-dashboard" : "view-dashboard-outline"}
                color={focused ? "#0058BD" : color}
                size={22}
              />
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="LiveView"
        component={LiveViewScreen}
        options={{
          tabBarLabel: 'Live View',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.tabIconWrap, focused && styles.tabIconActiveWrap]}>
              <MaterialCommunityIcons
                name={focused ? "motion-sensor" : "motion-sensor"}
                color={focused ? "#0058BD" : color}
                size={22}
              />
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="History"
        component={HistoryScreen}
        options={{
          tabBarLabel: 'History',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.tabIconWrap, focused && styles.tabIconActiveWrap]}>
              <MaterialCommunityIcons
                name={focused ? "history" : "history"}
                color={focused ? "#0058BD" : color}
                size={22}
              />
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="Alerts"
        component={AlertsScreen}
        options={{
          tabBarLabel: 'Alerts',
          tabBarBadge: unreadAlertCount > 0 ? unreadAlertCount : undefined,
          tabBarBadgeStyle: {
            backgroundColor: '#BA1A1A',
            color: '#FFFFFF',
            fontSize: 10,
            lineHeight: 14,
          },
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.tabIconWrap, focused && styles.tabIconActiveWrap]}>
              <MaterialCommunityIcons
                name={focused ? "bell" : "bell-outline"}
                color={focused ? "#0058BD" : color}
                size={22}
              />
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileStackNavigator}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.tabIconWrap, focused && styles.tabIconActiveWrap]}>
              <MaterialCommunityIcons
                name={focused ? "account" : "account-outline"}
                color={focused ? "#0058BD" : color}
                size={22}
              />
            </View>
          ),
        }}
      />
    </Tab.Navigator>
  );
}

/**
 * Root App Navigator
 * Inspects user onboarding status to switch between Onboarding and Main application flows.
 */
export default function AppNavigator() {
  const userContext = useUser ? useUser() : {};
  const { hasCompletedOnboarding = false, isLoading = false } = userContext;

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.Primary || '#0058BD'} />
      </View>
    );
  }

  if (!hasCompletedOnboarding) return <OnboardingNavigator />;
  return <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="MainTabs" component={MainTabNavigator} />
    <Stack.Screen name="BLEScan" component={BLEScanScreen} />
  </Stack.Navigator>;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9F9FF',
  },
  tabIconWrap: {
    paddingHorizontal: 12,
    paddingVertical: 3,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIconActiveWrap: {
    backgroundColor: '#E8F0FE',
  },
});
