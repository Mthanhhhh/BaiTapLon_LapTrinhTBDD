import {isAdmin} from '../utils/roles';
import ShopSetupScreen from '../screens/ShopSetupScreen';
import ChatScreen from '../screens/ChatScreen';
import AddressBookScreen from '../screens/AddressBookScreen';
import CommerceOperationsScreen from '../screens/CommerceOperationsScreen';
import PromotionsScreen from '../screens/PromotionsScreen';
import CategoriesScreen from '../screens/CategoriesScreen';
import ReviewsScreen from '../screens/ReviewsScreen';
import PromotionManageScreen from '../screens/PromotionManageScreen';
import OAuthCallbackScreen from '../screens/OAuthCallbackScreen';
import OrdersScreen from '../screens/OrdersScreen';
import CartScreen from '../screens/CartScreen';
import React, { useContext } from 'react';
import { NavigationContainer, NavigatorScreenParams, LinkingOptions, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import TabNavigator from './TabNavigator';
import ShopScreen from '../screens/ShopScreen';
import SellerCenterScreen from '../screens/SellerCenterScreen';
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
  Orders: { status?: string } | undefined;
  Account: undefined;
  Notifications: undefined;
};

export type RootStackParamList = {
  Main: NavigatorScreenParams<TabParamList> | undefined;
  ProductDetail: { productId: number | string; shopMode?: boolean; variantId?: number };
  Shop: { shopId: number | string };
  ShopOrders: { status?: string } | undefined;
  Promotions: {mode?:string}|undefined;
  Categories: {categoryId?:number}|undefined;
  Reviews: {productId:number};
  PromotionManage: undefined;
  AddressBook: {select?:boolean}|undefined;
  Inbox: {shopId?:number;orderId?:number;conversationId?:number}|undefined;
  AdminCenter: undefined;
  SellerAnalytics: undefined;
  Cart: undefined;
  SellerCenter: { editProductId?: number } | undefined;
  ShopSetup: {edit?:boolean}|undefined;
  Checkout: {cartItemIds?:number[];skuId?:number;quantity?:number}|undefined;
  Payment: { orderId: number; total: number; orderNumber?: string; method?: 'VISA' | 'DOMESTIC' | 'MAESTRO' | 'PAYPAL' } | undefined;
  Success: { orderId: number; amount: number; paymentMethod?: string; cardLastFour?: string; transactionId?: string } | undefined;
  Filter: undefined;
  OAuthCallback: undefined;
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
          Notifications: 'notifications',
          Account: 'account',
        },
      },
      ProductDetail: 'product/:productId',
      Shop: 'shop/:shopId',
      ShopOrders: 'seller/orders',
      Promotions: 'promotions',
      Categories: 'categories',
      Reviews: 'product/:productId/reviews',
      PromotionManage: 'seller/promotions',
      Inbox: 'messages',
      AddressBook: 'addresses',
      AdminCenter: 'admin',
      SellerAnalytics: 'seller/analytics',
      Cart: 'cart',
      SellerCenter: 'seller',
      ShopSetup: 'seller/setup',
      Checkout: 'checkout',
      Payment: 'payment/:orderId',
      Success: 'success',
      Filter: 'filter',
      OAuthCallback: 'oauth/callback',
      Login: 'login',
      Register: 'register',
    },
  },
};

export default function AppNavigator() {
  const { user, loading } = useContext(AuthContext);

  const admin=isAdmin(user);
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer key={admin?'admin':'market'} linking={admin?{prefixes:['/','eshop://'],config:{screens:{AdminCenter:'admin',PromotionManage:'admin/promotions'}}}:linking} theme={{ ...DefaultTheme, colors: { ...DefaultTheme.colors, background: 'transparent', card: COLORS.surface, text: COLORS.ink, border: COLORS.border, primary: COLORS.primaryDeep } }}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {admin?<><Stack.Screen name="AdminCenter" component={CommerceOperationsScreen}/><Stack.Screen name="PromotionManage" component={PromotionManageScreen}/></>:<>
        <Stack.Screen name="Main" component={TabNavigator} />
        <Stack.Screen name="ProductDetail" component={ProductDetailScreen} />
        <Stack.Screen name="Shop" component={ShopScreen} />
        <Stack.Screen name="ShopOrders" component={OrdersScreen} />
        <Stack.Screen name="Promotions" component={PromotionsScreen} />
        <Stack.Screen name="Categories" component={CategoriesScreen} />
        <Stack.Screen name="Reviews" component={ReviewsScreen} />
        <Stack.Screen name="PromotionManage" component={PromotionManageScreen} />
        <Stack.Screen name="Inbox" component={ChatScreen} />
        <Stack.Screen name="AddressBook" component={AddressBookScreen} />
        <Stack.Screen name="AdminCenter" component={CommerceOperationsScreen} />
        <Stack.Screen name="SellerAnalytics" component={CommerceOperationsScreen} />
        <Stack.Screen name="Cart" component={CartScreen} />
      <Stack.Screen name="SellerCenter" component={SellerCenterScreen} />
        <Stack.Screen name="Checkout" component={CheckoutScreen} />
        <Stack.Screen name="Payment" component={PaymentScreen} />
        <Stack.Screen name="Success" component={SuccessScreen} />
        <Stack.Screen name="Filter" component={FilterScreen} options={{ presentation: 'modal' }} />
        <Stack.Screen name="OAuthCallback" component={OAuthCallbackScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="ShopSetup" component={ShopSetupScreen}/>
        </>}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
