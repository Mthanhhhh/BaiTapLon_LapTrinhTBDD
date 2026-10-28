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

export default function RegisterScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const { register } = useContext(AuthContext);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!email.includes('@')) newErrors.email = 'Email không hợp lệ.';
    if (password.length < 6) newErrors.password = 'Mật khẩu phải có ít nhất 6 ký tự.';
    if (!fullName.trim()) newErrors.fullName = 'Vui lòng nhập họ và tên.';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (isLoading) return;
    if (!validate()) return;
    
    setIsLoading(true);
    setErrors({});
    
    try {
      const payload: any = { email, password, fullName };
      if (phone.trim()) {
        payload.phone = phone.trim();
      }
      
      await register(payload);
    } catch (err: any) {
      const appErr = err as AppError;
      if (appErr.fieldErrors) {
        setErrors(appErr.fieldErrors);
      } else {
        Alert.alert('Đăng ký thất bại', appErr.message || 'Có lỗi xảy ra, vui lòng thử lại.');
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
              <Typography variant="xxl" weight="bold" color="ink" role="heading" aria-level={1} style={styles.title}>
                Tạo Tài Khoản
              </Typography>
              <Typography variant="md" color="inkSoft" style={styles.subtitle}>
                Đăng ký để bắt đầu mua sắm cùng E-Shop
              </Typography>

              <Input
                label="Họ và tên"
                placeholder="Nhập họ và tên đầy đủ"
                value={fullName}
                onChangeText={(text) => {
                  setFullName(text);
                  if (errors.fullName) setErrors({ ...errors, fullName: '' });
                }}
                error={errors.fullName}
                autoComplete="name"
                textContentType="name"
                leftIcon={<Ionicons name="person-outline" size={20} color={COLORS.muted} />}
              />

              <Input
                label="Địa chỉ Email"
                placeholder="Nhập địa chỉ email"
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
                label="Số điện thoại (Không bắt buộc)"
                placeholder="Nhập số điện thoại nhận hàng"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                autoComplete="tel"
                textContentType="telephoneNumber"
                leftIcon={<Ionicons name="call-outline" size={20} color={COLORS.muted} />}
              />

              <Input
                label="Mật khẩu"
                placeholder="Tạo mật khẩu (từ 6 ký tự)"
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  if (errors.password) setErrors({ ...errors, password: '' });
                }}
                error={errors.password}
                secureTextEntry={!showPassword}
                autoComplete="new-password"
                textContentType="newPassword"
                leftIcon={<Ionicons name="lock-closed-outline" size={20} color={COLORS.muted} />}
                rightIcon={<Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color={COLORS.muted} />}
                onRightIconPress={() => setShowPassword(!showPassword)}
              />

              <Button
                title="Đăng Ký"
                fullWidth
                loading={isLoading}
                onPress={handleRegister}
                style={styles.button}
              />

              <View style={styles.footer}>
                <Typography variant="sm" color="inkSoft">
                  Đã có tài khoản?{' '}
                </Typography>
                <Typography 
                  variant="sm" 
                  weight="semiBold" 
                  color="primaryDeep"
                  onPress={() => navigation.navigate('Login')}
                >
                  Đăng nhập ngay
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
