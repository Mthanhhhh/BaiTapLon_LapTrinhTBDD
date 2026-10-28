import React, { useContext } from 'react';
import { NavigationContainer, NavigatorScreenParams, LinkingOptions, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import TabNavigator from './TabNavigator';
import CheckoutScreen from '../screens/CheckoutScreen';
import PaymentScreen from '../screens/PaymentScreen';
import SuccessScreen from '../screens/SuccessScreen';
import FilterScreen from '../screens/FilterScreen';
import ProductDetailScreen from '../screens/ProductDetailScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import { AuthContext } from '../context/AuthContext';
import { ActivityIndicator, View } from 'react-native';
import { COLORS } from '../theme/colors';

export type TabParamList = {
  Home: undefined;
  Search: { keyword?: string; categoryId?: number; categoryName?: string; sort?: string } | undefined;
  Orders: undefined;
  Account: undefined;
  Showcase?: undefined;
};

export type RootStackParamList = {
  Main: NavigatorScreenParams<TabParamList> | undefined;
  ProductDetail: { productId: number | string };
  Checkout: undefined;
  Payment: { orderId: number; total: number; orderNumber?: string } | undefined;
  Success: { orderId: number; amount: number; paymentMethod?: string; cardLastFour?: string; transactionId?: string } | undefined;
  Filter: undefined;
  Login: undefined;
  Register: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const linking: LinkingOptions<RootStackParamList> = {
  prefixes: ['/'],
  config: {
    screens: {
      Main: {
        screens: {
          Home: '',
          Search: 'search',
          Orders: 'orders',
          Account: 'account',
        },
      },
      ProductDetail: 'product/:productId',
      Checkout: 'checkout',
      Payment: 'payment',
      Success: 'success',
      Filter: 'filter',
      Login: 'login',
      Register: 'register',
    },
  },
};

export default function AppNavigator() {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer linking={linking} theme={{ ...DefaultTheme, colors: { ...DefaultTheme.colors, background: 'transparent', card: COLORS.surface, text: COLORS.ink, border: COLORS.border, primary: COLORS.primaryDeep } }}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Main" component={TabNavigator} />
        <Stack.Screen name="ProductDetail" component={ProductDetailScreen} />
        <Stack.Screen name="Checkout" component={CheckoutScreen} />
        <Stack.Screen name="Payment" component={PaymentScreen} />
        <Stack.Screen name="Success" component={SuccessScreen} />
        <Stack.Screen name="Filter" component={FilterScreen} options={{ presentation: 'modal' }} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
