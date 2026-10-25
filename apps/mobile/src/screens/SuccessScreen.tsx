import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { COLORS } from '../theme/colors';

export default function SuccessScreen() {
  const navigation = useNavigation<any>();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.iconCircle}>
          <Ionicons name="checkmark" size={48} color={COLORS.white} />
        </View>

        <Text style={styles.title}>Order placed successfully!</Text>
        <Text style={styles.subtitle}>Commodo eu ut sunt qui minim fugiat elit nisi enim</Text>

        <View style={styles.receiptBox}>
          <View style={styles.row}>
            <Text style={styles.label}>Subtotal</Text>
            <Text style={styles.value}>$2,800</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Tax (10%)</Text>
            <Text style={styles.value}>$280</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Fees</Text>
            <Text style={styles.value}>$0</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.row}>
            <Text style={styles.label}>Card</Text>
            <Text style={[styles.value, { fontWeight: 'bold' }]}>****** 2334</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.row}>
            <Text style={styles.label}>Total</Text>
            <View style={styles.totalValueRow}>
              <View style={styles.successBadge}>
                <Text style={styles.successBadgeText}>Success</Text>
              </View>
              <Text style={styles.totalValue}>$3,080</Text>
            </View>
          </View>
        </View>

        <Text style={styles.ratingLabel}>How was your experience?</Text>
        <View style={styles.starsRow}>
          {[1,2,3,4,5].map(star => (
            <Ionicons key={star} name="star" size={32} color="#FFD700" style={{ marginHorizontal: 4 }} />
          ))}
        </View>

        <TouchableOpacity style={styles.homeBtn} onPress={() => navigation.navigate('Main')}>
          <Ionicons name="home-outline" size={20} color={COLORS.white} style={{ marginRight: 8 }} />
          <Text style={styles.homeBtnText}>Back to Home</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 20, alignItems: 'center' },
  iconCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: COLORS.success, justifyContent: 'center', alignItems: 'center', marginTop: 40, marginBottom: 24 },
  title: { fontSize: 24, fontWeight: 'bold', color: COLORS.primary, marginBottom: 16 },
  subtitle: { textAlign: 'center', color: COLORS.lightText, marginBottom: 32, paddingHorizontal: 20 },
  receiptBox: { width: '100%', backgroundColor: '#F9F9F9', borderRadius: 12, padding: 20, marginBottom: 40 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  label: { color: COLORS.lightText },
  value: { color: COLORS.text, fontSize: 16 },
  divider: { height: 1, backgroundColor: COLORS.border, marginBottom: 16 },
  totalValueRow: { flexDirection: 'row', alignItems: 'center' },
  successBadge: { backgroundColor: '#E8F5E9', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, marginRight: 8 },
  successBadgeText: { color: COLORS.success, fontSize: 12 },
  totalValue: { fontSize: 18, color: COLORS.text, fontWeight: 'bold' },
  ratingLabel: { color: COLORS.text, marginBottom: 16 },
  starsRow: { flexDirection: 'row', marginBottom: 40 },
  homeBtn: { width: '100%', backgroundColor: COLORS.primary, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', height: 48, borderRadius: 8 },
  homeBtnText: { color: COLORS.white, fontWeight: 'bold', fontSize: 16 },
});

