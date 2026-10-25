import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { COLORS } from '../theme/colors';
import apiClient from '../api/apiClient';

const METHODS = [
  { id: 'CREDIT_CARD', name: 'Credit Card', icon: 'card-outline' },
  { id: 'PAYPAL', name: 'PayPal', icon: 'logo-paypal' },
  { id: 'COD', name: 'Cash on Delivery', icon: 'cash-outline' },
];

export default function PaymentScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const totalAmount = route.params?.totalAmount || 0;
  
  const [selected, setSelected] = useState('CREDIT_CARD');
  const [loading, setLoading] = useState(false);

  const handlePay = async () => {
    try {
      setLoading(true);
      // Ensure the user has an address first, or use a dummy one
      // The API expects addressId and paymentMethod
      const orderPayload = {
        addressId: 1, // hardcoded for demo purposes
        paymentMethod: selected,
        note: ''
      };
      const res = await apiClient.post('/orders', orderPayload);
      if (res.data && res.data.success) {
        // Now empty cart might be done automatically by the backend upon order creation
        // Just navigate to success
        navigation.navigate('Success');
      } else {
        Alert.alert('Error', 'Failed to create order');
      }
    } catch (error) {
      console.error('Error creating order:', error);
      Alert.alert('Error', 'Could not process payment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payment</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.totalSection}>
          <Text style={styles.totalLabel}>TOTAL</Text>
          <Text style={styles.totalValue}>${totalAmount}</Text>
        </View>

        {METHODS.map((method) => {
          const isActive = selected === method.id;
          return (
            <TouchableOpacity 
              key={method.id} 
              style={[styles.methodCard, isActive && styles.methodCardActive]}
              onPress={() => setSelected(method.id)}
            >
              <View style={styles.methodIconWrapper}>
                <Ionicons name={method.icon as any} size={24} color={COLORS.text} />
              </View>
              <Text style={styles.methodName}>{method.name}</Text>
              <Ionicons name={isActive ? 'radio-button-on' : 'radio-button-off'} size={24} color={isActive ? COLORS.primary : COLORS.darkGray} />
            </TouchableOpacity>
          );
        })}

        <TouchableOpacity 
          style={[styles.payBtn, loading && { backgroundColor: COLORS.gray }]} 
          onPress={handlePay}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <>
              <Ionicons name="card-outline" size={20} color={COLORS.white} style={{ marginRight: 8 }} />
              <Text style={styles.payBtnText}>Pay now</Text>
            </>
          )}
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  content: { padding: 20 },
  totalSection: { alignItems: 'center', marginVertical: 32 },
  totalLabel: { fontWeight: 'bold', fontSize: 12, color: COLORS.text, marginBottom: 8 },
  totalValue: { fontSize: 36, color: COLORS.text },
  methodCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderWidth: 1, borderColor: COLORS.border, borderRadius: 8, marginBottom: 16 },
  methodCardActive: { borderColor: COLORS.primary },
  methodIconWrapper: { width: 40, height: 40, backgroundColor: COLORS.gray, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  methodName: { flex: 1, color: COLORS.text },
  payBtn: { backgroundColor: COLORS.primary, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', height: 48, borderRadius: 8, marginTop: 16 },
  payBtnText: { color: COLORS.white, fontWeight: 'bold', fontSize: 16 },
});
