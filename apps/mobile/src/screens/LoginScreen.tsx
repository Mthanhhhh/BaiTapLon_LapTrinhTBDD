import React, { useState, useContext } from 'react';
import { View, StyleSheet, SafeAreaView, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { Typography, Button, Input, AuroraBackground } from '../components/ui';
import { COLORS, spacing, radius } from '../theme';
import { Ionicons } from '@expo/vector-icons';
import { AppError } from '../api/client';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const { login } = useContext(AuthContext);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const handleLogin = async () => {
    if (isLoading) return;
    setIsLoading(true);
    setErrors({});
    
    try {
      await login({ email, password });
      navigation.navigate('Main');
    } catch (err: any) {
      const appErr = err as AppError;
      if (appErr.fieldErrors) {
        setErrors(appErr.fieldErrors);
      } else {
        Alert.alert('Login Failed', appErr.message || 'Invalid email or password.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1 }} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <AuroraBackground variant="full" palette="calm">
        <SafeAreaView style={styles.container}>
          <ScrollView contentContainerStyle={styles.scroll}>
            <View style={styles.card}>
              <Typography variant="xxl" weight="bold" color="ink" style={styles.title}>
                Welcome Back
              </Typography>
              <Typography variant="md" color="inkSoft" style={styles.subtitle}>
                Log in to continue shopping
              </Typography>

              <Input
                label="Email"
                placeholder="Enter your email"
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  if (errors.email) setErrors({ ...errors, email: '' });
                }}
                error={errors.email}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                textContentType="emailAddress"
                leftIcon={<Ionicons name="mail-outline" size={20} color={COLORS.muted} />}
              />

              <Input
                label="Password"
                placeholder="Enter your password"
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  if (errors.password) setErrors({ ...errors, password: '' });
                }}
                error={errors.password}
                secureTextEntry={!showPassword}
                autoComplete="current-password"
                textContentType="password"
                leftIcon={<Ionicons name="lock-closed-outline" size={20} color={COLORS.muted} />}
                rightIcon={<Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color={COLORS.muted} />}
                onRightIconPress={() => setShowPassword(!showPassword)}
              />

              <Button
                title="Log In"
                fullWidth
                loading={isLoading}
                onPress={handleLogin}
                style={styles.button}
              />

              <View style={styles.footer}>
                <Typography variant="sm" color="inkSoft">
                  Don't have an account?{' '}
                </Typography>
                <Typography 
                  variant="sm" 
                  weight="semiBold" 
                  color="primaryDeep"
                  onPress={() => navigation.navigate('Register')}
                >
                  Register
                </Typography>
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </AuroraBackground>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing.xl,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: radius.xl,
    padding: spacing.xl,
    shadowColor: COLORS.ink,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  title: {
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  subtitle: {
    marginBottom: spacing.xl,
    textAlign: 'center',
  },
  button: {
    marginTop: spacing.md,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.xl,
  },
});
