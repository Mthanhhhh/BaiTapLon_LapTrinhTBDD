import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { COLORS } from '../theme/colors';

export default function FilterScreen() {
  const navigation = useNavigation();
  const [shipping, setShipping] = useState<Record<string, boolean>>({});

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={{ width: 24 }} />
        <Text style={styles.headerTitle}>Filter</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={24} color={COLORS.text} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Shipping options</Text>
            <Ionicons name="chevron-up" size={20} color={COLORS.darkGray} />
          </View>
          {['Instant (2 hours delivery)', 'Express (2 days delivery)', 'Standard (7- 10 days delivery)'].map((opt, i) => (
            <TouchableOpacity key={i} style={styles.checkboxRow} onPress={() => setShipping({ ...shipping, [opt]: !shipping[opt] })}>
              <Ionicons name={shipping[opt] ? 'checkbox' : 'square-outline'} size={20} color={shipping[opt] ? COLORS.primary : COLORS.darkGray} />
              <Text style={styles.checkboxLabel}>{opt}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.divider} />

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Price range</Text>
            <Ionicons name="chevron-up" size={20} color={COLORS.darkGray} />
          </View>
          <View style={styles.priceRow}>
            <View style={styles.priceInputBox}>
              <Text style={styles.currencySymbol}>$</Text>
              <TextInput style={styles.priceInput} value="10" keyboardType="numeric" />
            </View>
            <View style={styles.priceInputBox}>
              <Text style={styles.currencySymbol}>$</Text>
              <TextInput style={styles.priceInput} value="1000" keyboardType="numeric" />
            </View>
          </View>
          <View style={styles.sliderMock}>
            <View style={styles.sliderLine} />
            <View style={[styles.sliderKnob, { left: '10%' }]} />
            <View style={[styles.sliderKnob, { left: '80%' }]} />
            <View style={[styles.sliderActiveLine, { left: '10%', right: '20%' }]} />
          </View>
        </View>
        <View style={styles.divider} />

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Average review</Text>
            <Ionicons name="chevron-up" size={20} color={COLORS.darkGray} />
          </View>
          <View style={styles.starsRow}>
            {[1,2,3,4,5].map(star => (
              <Ionicons key={star} name="star" size={24} color={star <= 4 ? '#FFD700' : COLORS.border} style={{ marginRight: 4 }} />
            ))}
            <Text style={styles.starsText}>& Up</Text>
          </View>
        </View>
        <View style={styles.divider} />

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Others</Text>
            <Ionicons name="chevron-up" size={20} color={COLORS.darkGray} />
          </View>
          <View style={styles.othersGrid}>
            <TouchableOpacity style={[styles.otherBtn, styles.otherBtnActive]}>
              <Ionicons name="swap-horizontal" size={24} color={COLORS.primary} />
              <Text style={[styles.otherBtnText, { color: COLORS.primary }]}>30-day Free Return</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.otherBtn}>
              <Ionicons name="shield-checkmark-outline" size={24} color={COLORS.lightText} />
              <Text style={styles.otherBtnText}>Buyer Protection</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.otherBtn}>
              <Ionicons name="pricetag-outline" size={24} color={COLORS.lightText} />
              <Text style={styles.otherBtnText}>Best Deal</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.otherBtn}>
              <Ionicons name="location-outline" size={24} color={COLORS.lightText} />
              <Text style={styles.otherBtnText}>Ship to store</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  content: { padding: 20 },
  section: { marginBottom: 20 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold' },
  checkboxRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  checkboxLabel: { marginLeft: 12, color: COLORS.text },
  divider: { height: 1, backgroundColor: COLORS.border, marginBottom: 20 },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  priceInputBox: { flex: 0.45, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: COLORS.border, borderRadius: 8, paddingHorizontal: 12, height: 40 },
  currencySymbol: { color: COLORS.lightText, marginRight: 8 },
  priceInput: { flex: 1 },
  sliderMock: { height: 40, justifyContent: 'center' },
  sliderLine: { height: 4, backgroundColor: COLORS.border, borderRadius: 2 },
  sliderActiveLine: { position: 'absolute', height: 4, backgroundColor: COLORS.primary, borderRadius: 2 },
  sliderKnob: { position: 'absolute', width: 20, height: 20, borderRadius: 10, backgroundColor: COLORS.white, borderWidth: 2, borderColor: COLORS.primary, top: 10 },
  starsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  starsText: { marginLeft: 12, color: COLORS.text },
  othersGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  otherBtn: { width: '48%', borderWidth: 1, borderColor: COLORS.border, borderRadius: 8, padding: 16, alignItems: 'center', marginBottom: 12 },
  otherBtnActive: { borderColor: COLORS.primary },
  otherBtnText: { marginTop: 8, fontSize: 12, color: COLORS.lightText, textAlign: 'center' },
});

