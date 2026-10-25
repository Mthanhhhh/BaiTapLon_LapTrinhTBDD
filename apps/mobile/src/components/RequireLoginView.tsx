import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { Typography, Button, AuroraBackground } from './ui';
import { spacing, radius, COLORS } from '../theme';
import { Ionicons } from '@expo/vector-icons';

interface RequireLoginViewProps {
  title: string;
  description: string;
}

export const RequireLoginView: React.FC<RequireLoginViewProps> = ({ title, description }) => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  return (
    <View style={styles.container}>
      <AuroraBackground variant="full" palette="calm">
        <View style={styles.content}>
          <View style={styles.card}>
            <View style={styles.iconContainer}>
              <Ionicons name="lock-closed-outline" size={48} color={COLORS.primaryDeep} />
            </View>
            <Typography variant="xl" weight="bold" align="center" color="ink" style={styles.title}>
              {title}
            </Typography>
            <Typography variant="md" align="center" color="inkSoft" style={styles.description}>
              {description}
            </Typography>
            
            <Button
              title="Log In or Register"
              fullWidth
              onPress={() => navigation.navigate('Login')}
              style={styles.button}
            />
          </View>
        </View>
      </AuroraBackground>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: radius.lg,
    padding: spacing.xl,
    width: '100%',
    alignItems: 'center',
    shadowColor: COLORS.ink,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primarySoft,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    marginBottom: spacing.sm,
  },
  description: {
    marginBottom: spacing.xl,
  },
  button: {
    marginTop: spacing.md,
  },
});

