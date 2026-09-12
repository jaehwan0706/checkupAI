import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { MainStackParamList } from './types';

import TabNavigator from './TabNavigator';
import MypageScreen from '../screens/MypageScreen';
import NotificationListScreen from '../screens/NotificationListScreen';
import PremiumScreen from '../screens/PremiumScreen';
import ProfileEditScreen from '../screens/ProfileEditScreen';
import HealthGoalScreen from '../screens/HealthGoalScreen';
import NotificationSettingsScreen from '../screens/NotificationSettingsScreen';
import ConsentManagementScreen from '../screens/ConsentManagementScreen';

const Stack = createNativeStackNavigator<MainStackParamList>();

export default function MainNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Tabs" component={TabNavigator} />
      <Stack.Screen
        name="Mypage"
        component={MypageScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="NotificationList"
        component={NotificationListScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="Premium"
        component={PremiumScreen}
        options={{ animation: 'slide_from_bottom' }}
      />
      <Stack.Screen
        name="ProfileEdit"
        component={ProfileEditScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="HealthGoal"
        component={HealthGoalScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="NotificationSettings"
        component={NotificationSettingsScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="ConsentManagement"
        component={ConsentManagementScreen}
        options={{ animation: 'slide_from_right' }}
      />
    </Stack.Navigator>
  );
}
