import React from 'react';
import { Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import HomeScreen from '../screens/HomeScreen';
import DesignShowcaseScreen from '../screens/DesignShowcaseScreen';
import { COLORS, radius, shadows, typography } from '../theme';

import OrdersScreen from '../screens/OrdersScreen';
import AccountScreen from '../screens/AccountScreen';

import SearchScreen from '../screens/SearchScreen';

const Tab = createBottomTabNavigator();

export default function TabNavigator() {
  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'home';

          if (route.name === 'Showcase') iconName = focused ? 'color-palette' : 'color-palette-outline';
          else if (route.name === 'Home') iconName = focused ? 'home' : 'home-outline';
          else if (route.name === 'Search') iconName = focused ? 'search' : 'search-outline';
          else if (route.name === 'Orders') iconName = focused ? 'receipt' : 'receipt-outline';
          else if (route.name === 'Account') iconName = focused ? 'person' : 'person-outline';

          return <Ionicons name={iconName} size={size - 2} color={color} />;
        },
        sceneStyle: { backgroundColor: 'transparent' },
        tabBarActiveTintColor: COLORS.primaryDeep,
        tabBarInactiveTintColor: COLORS.muted,
        headerShown: false,
        tabBarIconStyle: { width: 24, height: 24, flexGrow: 0, flexShrink: 0 },
        tabBarLabelStyle: {
          fontFamily: typography.fontFamily.semiBold,
          fontSize: 11,
          lineHeight: 16,
          minHeight: 16,
          flexShrink: 0,
          marginTop: 2,
          paddingBottom: 0,
        },
        tabBarItemStyle: {
          borderRadius: 12,
          marginHorizontal: 2,
          marginVertical: 0,
          paddingVertical: 0,
          justifyContent: 'center',
          alignItems: 'center',
          ...(Platform.OS === 'web' && { outlineStyle: 'none' } as any),
        },
        tabBarActiveBackgroundColor: COLORS.primarySoft,
        tabBarStyle: [
          {
            height: 72,
            borderRadius: 0,
            backgroundColor: COLORS.surface,
            borderTopWidth: 1,
            borderTopColor: COLORS.border,
            paddingBottom: 8,
            paddingTop: 8,
            elevation: 0,
            shadowOpacity: 0,
          }
        ],
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ tabBarLabel: 'Trang chủ' }} />
      <Tab.Screen name="Search" component={SearchScreen} options={{ tabBarLabel: 'Tìm kiếm' }} />
      <Tab.Screen name="Orders" component={OrdersScreen} options={{ tabBarLabel: 'Đơn hàng' }} />
      <Tab.Screen name="Account" component={AccountScreen} options={{ tabBarLabel: 'Tài khoản' }} />
      {__DEV__ && <Tab.Screen name="Showcase" component={DesignShowcaseScreen} options={{ tabBarLabel: 'Khám phá' }} />}
    </Tab.Navigator>
  );
}
