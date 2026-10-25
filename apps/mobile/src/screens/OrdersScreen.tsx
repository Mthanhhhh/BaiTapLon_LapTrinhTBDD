import React, { useContext } from 'react';
import { View, StyleSheet, SafeAreaView } from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { RequireLoginView } from '../components/RequireLoginView';
import { Typography } from '../components/ui';
import { COLORS, spacing } from '../theme';

export default function OrdersScreen() {
  const { user } = useContext(AuthContext);

  if (!user) {
    return (
      <RequireLoginView
        title="Your Orders"
        description="Log in to view and track your recent orders."
      />
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Typography variant="xl" weight="bold">Orders</Typography>
        <Typography variant="md" color="inkSoft" style={{ marginTop: spacing.md }}>
          Order history will be implemented in future phases.
        </Typography>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  content: {
    padding: spacing.md,
  },
});

