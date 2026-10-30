import React from 'react';
import {View,TouchableOpacity,StyleSheet} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {Ionicons} from '@expo/vector-icons';
import {RootStackParamList} from '../navigation/AppNavigator';
import {useCart} from '../hooks/useCart';
import {Typography} from './ui';
import {COLORS} from '../theme';
export function MarketplaceHeader({title}:{title:string}){const n=useNavigation<NativeStackNavigationProp<RootStackParamList>>();const {data:cart}=useCart();return <View style={styles.header}><View style={{width:44}}/><Typography variant="lg" weight="bold" role="heading" aria-level={1}>{title}</Typography><TouchableOpacity accessibilityRole="button" accessibilityLabel="Mở giỏ hàng" onPress={()=>n.navigate('Cart')} style={styles.cart}><Ionicons name="cart-outline" size={23} color={COLORS.primaryDeep}/>{!!cart?.totalItems&&<View style={styles.badge}><Typography variant="xs" color="surface">{cart.totalItems>99?'99+':cart.totalItems}</Typography></View>}</TouchableOpacity></View>}
const styles=StyleSheet.create({header:{minHeight:64,paddingHorizontal:16,flexDirection:'row',alignItems:'center',justifyContent:'space-between',backgroundColor:COLORS.surface,borderBottomWidth:1,borderColor:COLORS.border},cart:{width:42,height:42,borderRadius:21,borderWidth:1,borderColor:COLORS.primary,alignItems:'center',justifyContent:'center',backgroundColor:COLORS.primarySoft},badge:{position:'absolute',right:-4,top:-4,paddingHorizontal:4,borderRadius:9,backgroundColor:COLORS.deal}});
