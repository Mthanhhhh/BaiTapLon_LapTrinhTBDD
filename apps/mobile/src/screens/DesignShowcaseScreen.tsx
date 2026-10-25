import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, SafeAreaView, Switch, Alert } from 'react-native';
import { Typography, Button, Input, Badge, ProductCard, Skeleton, AuroraBackground } from '../components/ui';
import { COLORS, spacing, radius } from '../theme';
import { Ionicons } from '@expo/vector-icons';

export default function DesignShowcaseScreen() {
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const simulateLoading = () => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 2000);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Typography variant="xxl" weight="bold" color="primaryDeep">
            Design System
          </Typography>
          <Typography variant="md" color="inkSoft" style={{ marginTop: spacing.xs }}>
            Pastel colors, rounded corners, Plus Jakarta Sans
          </Typography>
        </View>

        {/* TYPOGRAPHY */}
        <View style={styles.section}>
          <Typography variant="lg" weight="bold" style={styles.sectionTitle}>
            Typography
          </Typography>
          <Typography variant="xxxl" weight="bold">Heading XXXL (32px)</Typography>
          <Typography variant="xxl" weight="semiBold">Heading XXL (24px)</Typography>
          <Typography variant="xl" weight="medium">Heading XL (20px)</Typography>
          <Typography variant="lg">Body LG (18px)</Typography>
          <Typography variant="md">Body MD (16px) - Default</Typography>
          <Typography variant="sm" color="inkSoft">Body SM (14px)</Typography>
          <Typography variant="xs" color="muted">Body XS (12px)</Typography>
        </View>

        {/* COLORS */}
        <View style={styles.section}>
          <Typography variant="lg" weight="bold" style={styles.sectionTitle}>
            Colors (Pastel Palette)
          </Typography>
          <View style={styles.colorGrid}>
            {[
              { name: 'Primary', color: COLORS.primary },
              { name: 'Primary Soft', color: COLORS.primarySoft },
              { name: 'Mint', color: COLORS.mint },
              { name: 'Peach', color: COLORS.peach },
              { name: 'Pink', color: COLORS.pink },
              { name: 'Sky', color: COLORS.sky },
              { name: 'Lilac', color: COLORS.lilac },
            ].map((c) => (
              <View key={c.name} style={styles.colorSwatch}>
                <View style={[styles.colorCircle, { backgroundColor: c.color }]} />
                <Typography variant="xs" align="center">{c.name}</Typography>
              </View>
            ))}
          </View>
        </View>

        {/* BUTTONS */}
        <View style={styles.section}>
          <Typography variant="lg" weight="bold" style={styles.sectionTitle}>
            Buttons
          </Typography>
          <Button title="Primary Button" onPress={simulateLoading} loading={isLoading} style={styles.elementSpacing} />
          <Button title="Secondary Button" variant="secondary" style={styles.elementSpacing} />
          <Button title="Outline Button" variant="outline" style={styles.elementSpacing} />
          <Button title="Ghost Button" variant="ghost" style={styles.elementSpacing} />
          <View style={styles.row}>
            <Button title="Small" size="sm" style={styles.elementSpacing} />
            <Button title="Medium" size="md" style={styles.elementSpacing} />
            <Button title="Large" size="lg" style={styles.elementSpacing} />
          </View>
          <Button 
            title="With Icons" 
            leftIcon={<Ionicons name="cart-outline" size={20} color={COLORS.surface} />}
            rightIcon={<Ionicons name="arrow-forward" size={20} color={COLORS.surface} />}
          />
        </View>

        {/* INPUTS */}
        <View style={styles.section}>
          <Typography variant="lg" weight="bold" style={styles.sectionTitle}>
            Inputs
          </Typography>
          <Input 
            label="Email Address" 
            placeholder="Enter your email" 
            value={inputText}
            onChangeText={setInputText}
            leftIcon={<Ionicons name="mail-outline" size={20} color={COLORS.muted} />}
          />
          <Input 
            label="Password" 
            placeholder="Enter your password" 
            secureTextEntry
            leftIcon={<Ionicons name="lock-closed-outline" size={20} color={COLORS.muted} />}
            rightIcon={<Ionicons name="eye-outline" size={20} color={COLORS.muted} />}
            onRightIconPress={() => Alert.alert('Toggle visibility')}
          />
          <Input 
            label="Error State" 
            placeholder="Invalid input" 
            error="This field is required"
          />
        </View>

        {/* BADGES */}
        <View style={styles.section}>
          <Typography variant="lg" weight="bold" style={styles.sectionTitle}>
            Badges
          </Typography>
          <View style={[styles.row, { flexWrap: 'wrap' }]}>
            <Badge label="Default" style={styles.elementSpacing} />
            <Badge label="Primary" variant="primary" style={styles.elementSpacing} />
            <Badge label="Success" variant="success" style={styles.elementSpacing} />
            <Badge label="Warning" variant="warning" style={styles.elementSpacing} />
            <Badge label="Danger" variant="danger" style={styles.elementSpacing} />
          </View>
        </View>

        {/* PRODUCT CARD */}
        <View style={styles.section}>
          <Typography variant="lg" weight="bold" style={styles.sectionTitle}>
            Product Card
          </Typography>
          <View style={styles.productGrid}>
            <ProductCard
              id={1}
              name="Pastel Ceramic Mug"
              price={12.99}
              originalPrice={18.0}
              rating={4.8}
              soldCount={1240}
              thumbnailUrl="https://picsum.photos/400"
            />
            <ProductCard
              id={2}
              name="Minimalist Desk Lamp with warm light"
              price={34.50}
              rating={4.5}
              soldCount={350}
            />
          </View>
        </View>

        {/* SKELETON */}
        <View style={styles.section}>
          <Typography variant="lg" weight="bold" style={styles.sectionTitle}>
            Skeletons (Loading state)
          </Typography>
          <View style={[styles.row, { justifyContent: 'space-between', marginBottom: spacing.md }]}>
            <View style={{ width: '48%' }}>
              <Skeleton height={150} borderRadius={radius.lg} style={{ marginBottom: spacing.sm }} />
              <Skeleton height={20} width="80%" style={{ marginBottom: spacing.xs }} />
              <Skeleton height={24} width="50%" />
            </View>
            <View style={{ width: '48%' }}>
              <Skeleton height={150} borderRadius={radius.lg} style={{ marginBottom: spacing.sm }} />
              <Skeleton height={20} width="90%" style={{ marginBottom: spacing.xs }} />
              <Skeleton height={24} width="60%" />
            </View>
          </View>
        </View>

        {/* AURORA BACKGROUND */}
        <View style={[styles.section, { padding: 0, overflow: 'hidden' }]}>
          <Typography variant="lg" weight="bold" style={[styles.sectionTitle, { margin: spacing.md }]}>
            Aurora Background (Calm, Header)
          </Typography>
          <AuroraBackground variant="header" headerHeight={240} palette="calm">
            <View style={{ padding: spacing.xl, alignItems: 'center' }}>
              <View style={[styles.whiteCard, { marginTop: spacing.xl }]}>
                <Typography variant="md" weight="semiBold" color="ink">
                  Contrast Test (Ink on White Card)
                </Typography>
                <Typography variant="sm" color="inkSoft">
                  This text should be easily readable.
                </Typography>
              </View>
            </View>
          </AuroraBackground>
        </View>

        <View style={[styles.section, { padding: 0, overflow: 'hidden' }]}>
          <Typography variant="lg" weight="bold" style={[styles.sectionTitle, { margin: spacing.md }]}>
            Aurora Background (Candy, Full)
          </Typography>
          <View style={{ height: 400 }}>
            <AuroraBackground variant="full" palette="candy">
              <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl }}>
                <View style={styles.whiteCard}>
                  <Typography variant="xl" weight="bold" color="ink">
                    Candy Palette
                  </Typography>
                  <Typography variant="md" color="ink" style={{ marginTop: spacing.sm }}>
                    Direct text on Aurora is not recommended, but if needed, use ink or inkSoft.
                  </Typography>
                  <Button title="Continue" fullWidth style={{ marginTop: spacing.lg }} />
                </View>
              </View>
            </AuroraBackground>
          </View>
        </View>
        
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  container: {
    padding: spacing.md,
    paddingBottom: 80, // For the bottom tab bar
  },
  header: {
    marginBottom: spacing.xl,
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  section: {
    marginBottom: spacing.xl,
    backgroundColor: COLORS.surface,
    padding: spacing.md,
    borderRadius: radius.lg,
  },
  sectionTitle: {
    marginBottom: spacing.md,
    color: COLORS.ink,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingBottom: spacing.xs,
  },
  whiteCard: {
    backgroundColor: COLORS.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    width: '100%',
    shadowColor: COLORS.ink,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  colorSwatch: {
    alignItems: 'center',
    width: 60,
  },
  colorCircle: {
    width: 48,
    height: 48,
    borderRadius: radius.full,
    marginBottom: spacing.xs,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  elementSpacing: {
    marginBottom: spacing.sm,
    marginRight: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  productGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});

