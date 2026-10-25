import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, TextInput, ActivityIndicator, Alert, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { COLORS } from '../theme/colors';
import apiClient from '../api/apiClient';

interface CartItem {
  id: number;
  productId: number;
  productName: string;
  productImage: string;
  variantId: number | null;
  variantName: string | null;
  price: number;
  quantity: number;
  subtotal: number;
}

interface CartResponse {
  id: number;
  items: CartItem[];
  totalItems: number;
  totalAmount: number;
}

export default function CheckoutScreen() {
  const navigation = useNavigation<any>();
  const isFocused = useIsFocused();
  const [cart, setCart] = useState<CartResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchCart = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/cart');
      if (res.data && res.data.data) {
        setCart(res.data.data);
      }
    } catch (error) {
      console.error('Error fetching cart:', error);
      Alert.alert('Error', 'Could not load cart items');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isFocused) {
      fetchCart();
    }
  }, [isFocused]);

  if (loading && !cart) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Cart / Checkout</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {cart?.items && cart.items.length > 0 ? (
          cart.items.map((item, index) => (
            <View key={item.id} style={[styles.cartItem, index !== cart.items.length - 1 && styles.borderBottom]}>
              {item.productImage ? (
                <Image source={{ uri: item.productImage }} style={styles.itemImage} />
              ) : (
                <View style={styles.itemImagePlaceholder} />
              )}
              <View style={styles.itemInfo}>
                <Text style={styles.itemName} numberOfLines={1}>{item.productName}</Text>
                {item.variantName ? <Text style={styles.itemDesc}>{item.variantName}</Text> : null}
                <Text style={styles.itemPrice}>${item.price}</Text>
              </View>
              <View style={styles.itemRight}>
                <Text style={styles.itemQty}>x{item.quantity}</Text>
              </View>
            </View>
          ))
        ) : (
          <Text style={{ textAlign: 'center', marginTop: 20, color: COLORS.lightText }}>Your cart is empty</Text>
        )}

        <Text style={styles.voucherLabel}>Voucher</Text>
        <View style={styles.voucherRow}>
          <TextInput placeholder="Enter voucher code" style={styles.voucherInput} />
          <TouchableOpacity style={styles.applyBtn}>
            <Text style={styles.applyBtnText}>Apply</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>TOTAL</Text>
          <Text style={styles.totalValue}>${cart?.totalAmount || 0}</Text>
        </View>

        <TouchableOpacity 
          style={[styles.nextBtn, (!cart?.items || cart.items.length === 0) && { backgroundColor: COLORS.gray }]} 
          onPress={() => cart?.items && cart.items.length > 0 && navigation.navigate('Payment', { totalAmount: cart.totalAmount })}
          disabled={!cart?.items || cart.items.length === 0}
        >
          <Text style={styles.nextBtnText}>Next</Text>
          <Ionicons name="arrow-forward" size={20} color={COLORS.white} />
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  content: { padding: 20 },
  cartItem: { flexDirection: 'row', paddingVertical: 16 },
  borderBottom: { borderBottomWidth: 1, borderBottomColor: COLORS.border },
  itemImage: { width: 60, height: 60, borderRadius: 8, marginRight: 16 },
  itemImagePlaceholder: { width: 60, height: 60, backgroundColor: COLORS.gray, borderRadius: 8, marginRight: 16 },
  itemInfo: { flex: 1 },
  itemName: { fontWeight: 'bold', fontSize: 16, marginBottom: 4 },
  itemDesc: { color: COLORS.lightText, fontSize: 12, marginBottom: 8 },
  itemPrice: { color: COLORS.text, fontSize: 16 },
  itemRight: { alignItems: 'flex-end', justifyContent: 'center' },
  itemQty: { color: COLORS.text, fontWeight: 'bold' },
  voucherLabel: { color: COLORS.lightText, marginTop: 20, marginBottom: 8 },
  voucherRow: { flexDirection: 'row' },
  voucherInput: { flex: 1, borderWidth: 1, borderColor: COLORS.border, borderRadius: 8, paddingHorizontal: 12, height: 48, marginRight: 12 },
  applyBtn: { backgroundColor: '#F8F8FF', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20, borderRadius: 8 },
  applyBtnText: { color: '#B0B0E6', fontWeight: 'bold' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 32, marginBottom: 24 },
  totalLabel: { fontWeight: 'bold', fontSize: 14, color: COLORS.text },
  totalValue: { fontWeight: 'bold', fontSize: 24, color: COLORS.text },
  nextBtn: { backgroundColor: COLORS.primary, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', height: 48, borderRadius: 8 },
  nextBtnText: { color: COLORS.white, fontWeight: 'bold', fontSize: 16, marginRight: 8 },
});
