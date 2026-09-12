import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, typography } from '../theme';
import type { TabParamList } from './types';

import HomeScreen from '../screens/HomeScreen';
import InputScreen from '../screens/InputScreen';
import ReportScreen from '../screens/ReportScreen';
import HealthScreen from '../screens/HealthScreen';
import RecordsScreen from '../screens/RecordsScreen';

const Tab = createBottomTabNavigator<TabParamList>();

type TabConfig = {
  name: keyof TabParamList;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconFocused: keyof typeof Ionicons.glyphMap;
};

const tabs: TabConfig[] = [
  { name: 'Home', label: '홈', icon: 'home-outline', iconFocused: 'home' },
  { name: 'Input', label: '입력', icon: 'add-circle-outline', iconFocused: 'add-circle' },
  { name: 'Report', label: '리포트', icon: 'bar-chart-outline', iconFocused: 'bar-chart' },
  { name: 'Health', label: '건강', icon: 'heart-outline', iconFocused: 'heart' },
  { name: 'Records', label: '기록', icon: 'list-outline', iconFocused: 'list' },
];

export default function TabNavigator() {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          ...styles.tabBar,
          height: 56 + insets.bottom,
          paddingBottom: insets.bottom,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.inkSoft,
      }}
    >
      {tabs.map(({ name, label, icon, iconFocused }) => (
        <Tab.Screen
          key={name}
          name={name}
          component={
            name === 'Home' ? HomeScreen :
            name === 'Input' ? InputScreen :
            name === 'Report' ? ReportScreen :
            name === 'Health' ? HealthScreen :
            RecordsScreen
          }
          options={{
            tabBarLabel: ({ focused, color }) => (
              <Text style={[styles.tabLabel, { color }]}>{label}</Text>
            ),
            tabBarIcon: ({ focused, color, size }) => (
              <Ionicons
                name={focused ? iconFocused : icon}
                size={22}
                color={color}
              />
            ),
          }}
        />
      ))}
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.line,
    paddingTop: 6,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      android: { elevation: 8 },
    }),
  },
  tabLabel: {
    ...typography.caption,
    marginTop: 2,
  },
});
