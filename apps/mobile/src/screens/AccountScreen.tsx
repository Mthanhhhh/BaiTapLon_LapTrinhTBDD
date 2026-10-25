import React, { useContext } from 'react';
import { View, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { Typography, Button, AuroraBackground } from '../components/ui';
import { RequireLoginView } from '../components/RequireLoginView';
import { COLORS, spacing, radius } from '../theme';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';

export default function AccountScreen() {
  const { user, logout } = useContext(AuthContext);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  if (!user) {
    return (
      <RequireLoginView
        title="Your Account"
        description="Log in to manage your profile, view orders, and more."
      />
    );
  }

  const handleLogout = async () => {
    try {
      await logout();
      navigation.navigate('Login');
    } catch (error) {
      Alert.alert('Logout Error', 'Could not log out correctly.');
    }
  };

  const getInitials = (name: string) => {
    return name.charAt(0).toUpperCase();
  };

  return (
    <View style={styles.container}>
      <AuroraBackground variant="header" headerHeight={280} palette="calm">
        <SafeAreaView style={styles.headerSafeArea}>
          <View style={styles.headerContent}>
            <View style={styles.avatarContainer}>
              {user.avatarUrl ? (
                <View style={styles.avatarPlaceholder} /> // Replace with real Image if available
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Typography variant="xxxl" weight="bold" color="primaryDeep">
                    {getInitials(user.fullName)}
                  </Typography>
                </View>
              )}
            </View>
            <Typography variant="xl" weight="bold" color="ink" style={{ marginTop: spacing.md }}>
              {user.fullName}
            </Typography>
            <Typography variant="sm" color="inkSoft">
              {user.email}
            </Typography>
          </View>
        </SafeAreaView>
      </AuroraBackground>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.menuCard}>
          <MenuItem 
            icon="person-outline" 
            title="Edit Profile" 
            onPress={() => Alert.alert('TODO', 'Edit Profile Modal/Screen')} 
          />
          <MenuItem 
            icon="log-out-outline" 
            title="Log Out" 
            onPress={handleLogout} 
            color={COLORS.danger} 
            noBorder 
          />
        </View>
      </ScrollView>
    </View>
  );
}

const MenuItem = ({ icon, title, onPress, color = COLORS.ink, noBorder = false }: any) => (
  <TouchableOpacity
    style={[styles.menuItem, !noBorder && styles.menuItemBorder]}
    onPress={onPress}
  >
    <View style={styles.menuItemLeft}>
      <Ionicons name={icon} size={24} color={color} />
      <Typography variant="md" weight="medium" style={{ marginLeft: spacing.md, color }}>
        {title}
      </Typography>
    </View>
    <Ionicons name="chevron-forward" size={20} color={COLORS.muted} />
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  headerSafeArea: {
    flex: 1,
  },
  headerContent: {
    alignItems: 'center',
    paddingTop: spacing.xxl,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.surface,
    padding: 4,
    shadowColor: COLORS.ink,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    borderRadius: 50,
    backgroundColor: COLORS.primarySoft,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: 100,
    zIndex: 10, // Ensure it sits on top of header
  },
  menuCard: {
    backgroundColor: COLORS.surface,
    borderRadius: radius.xl,
    paddingHorizontal: spacing.md,
    shadowColor: COLORS.ink,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    marginTop: -24, // Overlap the header
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.lg,
  },
  menuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});

