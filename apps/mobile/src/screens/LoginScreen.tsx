import React, { useState, useContext, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { Typography, Button, AuroraBackground } from '../components/ui';
import { COLORS, spacing, radius } from '../theme';
import { Ionicons, FontAwesome } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { apiClient } from '../api/client';

export default function LoginScreen() {
  const [loginMode, setLoginMode] = useState<'password' | 'qr'>('password');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Social Login Modal State
  const [socialModalVisible, setSocialModalVisible] = useState(false);
  const [socialProvider, setSocialProvider] = useState<'google' | 'facebook'>('google');
  const [customSocialEmail, setCustomSocialEmail] = useState('');

  // QR Login State
  const [qrToken, setQrToken] = useState<string | null>(null);
  const [qrLoading, setQrLoading] = useState(false);
  const pollTimerRef = useRef<any>(null);

  // Forgot Password Modal State
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotStep, setForgotStep] = useState<1 | 2>(1);
  const [forgotIdentifier, setForgotIdentifier] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotMsg, setForgotMsg] = useState('');

  const { login, socialLogin, forgotPassword, resetPassword } = useContext(AuthContext);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  // Handle QR code polling
  const startQrSession = async () => {
    try {
      setQrLoading(true);
      const res = await apiClient.post('/api/v1/auth/qr/generate');
      const token = res.data.data?.qrToken || res.data.qrToken;
      setQrToken(token);

      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
      pollTimerRef.current = setInterval(async () => {
        try {
          const checkRes = await apiClient.get(`/api/v1/auth/qr/check?qrToken=${token}`);
          if (checkRes.data.data?.status === 'CONFIRMED' || checkRes.data.status === 'CONFIRMED') {
            clearInterval(pollTimerRef.current);
            navigation.navigate('Main');
          }
        } catch (e) {
          // keep polling
        }
      }, 2000);
    } catch (err) {
      console.log('Failed to generate QR session', err);
    } finally {
      setQrLoading(false);
    }
  };

  useEffect(() => {
    if (loginMode === 'qr') {
      startQrSession();
    } else {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    }
    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, [loginMode]);

  const handleLogin = async () => {
    if (!identifier.trim()) {
      setErrorMessage('Vui lòng nhập Email hoặc Số điện thoại');
      return;
    }
    if (!password) {
      setErrorMessage('Vui lòng nhập mật khẩu');
      return;
    }
    setIsLoading(true);
    setErrorMessage('');

    try {
      await login({ email: identifier.trim(), password, rememberMe });
      navigation.navigate('Main');
    } catch (err: any) {
      setErrorMessage(err.message || 'Email hoặc mật khẩu không chính xác');
    } finally {
      setIsLoading(false);
    }
  };

  const openSocialLoginModal = (provider: 'google' | 'facebook') => {
    setSocialProvider(provider);
    setCustomSocialEmail(provider === 'google' ? 'nguyenvana.dev@gmail.com' : 'nguyen.van.a.fb@gmail.com');
    setSocialModalVisible(true);
  };

  const executeSocialLogin = async (emailToUse: string, fullName: string, avatarUrl: string) => {
    setIsLoading(true);
    setSocialModalVisible(false);
    setErrorMessage('');
    try {
      await socialLogin({
        provider: socialProvider,
        email: emailToUse,
        fullName: fullName,
        avatarUrl: avatarUrl,
      });
      if (Platform.OS === 'web') {
        alert(`Đăng nhập thành công với tài khoản ${socialProvider === 'google' ? 'Google' : 'Facebook'}!`);
      }
      navigation.navigate('Main');
    } catch (err: any) {
      setErrorMessage(err.message || `Đăng nhập ${socialProvider} thất bại. Vui lòng kiểm tra kết nối.`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSimulateQrScan = async () => {
    if (!qrToken) return;
    try {
      setQrLoading(true);
      await apiClient.post(`/api/v1/auth/qr/confirm?qrToken=${qrToken}`);
      if (Platform.OS === 'web') {
        alert('Đã quét mã QR thành công!');
      } else {
        Alert.alert('Thành công', 'Đã quét mã QR thành công!');
      }
      setTimeout(() => {
        navigation.navigate('Main');
      }, 600);
    } catch (e: any) {
      if (Platform.OS === 'web') {
        alert(e.message || 'Mô phỏng thất bại');
      } else {
        Alert.alert('Lỗi', e.message || 'Mô phỏng thất bại');
      }
    } finally {
      setQrLoading(false);
    }
  };

  const handleRequestOtp = async () => {
    if (!forgotIdentifier.trim()) {
      const msg = 'Vui lòng nhập Email hoặc Số điện thoại';
      if (Platform.OS === 'web') alert(msg);
      else Alert.alert('Lỗi', msg);
      return;
    }
    setForgotLoading(true);
    try {
      const data = await forgotPassword(forgotIdentifier.trim());
      setForgotStep(2);
      if (data && data.otp) {
        setOtpCode(data.otp);
        setForgotMsg(`Mã OTP xác thực của bạn: ${data.otp}`);
      } else {
        setForgotMsg('Mã OTP đã được gửi tới thông tin liên hệ của bạn.');
      }
    } catch (err: any) {
      const msg = err.message || 'Không tìm thấy tài khoản với thông tin này';
      if (Platform.OS === 'web') alert(msg);
      else Alert.alert('Lỗi', msg);
    } finally {
      setForgotLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!otpCode.trim()) {
      const msg = 'Vui lòng nhập mã OTP';
      if (Platform.OS === 'web') alert(msg);
      else Alert.alert('Lỗi', msg);
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      const msg = 'Mật khẩu mới phải có ít nhất 6 ký tự';
      if (Platform.OS === 'web') alert(msg);
      else Alert.alert('Lỗi', msg);
      return;
    }
    setForgotLoading(true);
    try {
      await resetPassword({
        identifier: forgotIdentifier.trim(),
        otp: otpCode.trim(),
        newPassword,
      });
      const successMsg = 'Đổi mật khẩu thành công! Bạn có thể đăng nhập ngay.';
      if (Platform.OS === 'web') {
        alert(successMsg);
      } else {
        Alert.alert('Thành công', successMsg);
      }
      setShowForgotModal(false);
      setIdentifier(forgotIdentifier.trim());
      setPassword(newPassword);
    } catch (err: any) {
      const msg = err.message || 'Đặt lại mật khẩu thất bại';
      if (Platform.OS === 'web') alert(msg);
      else Alert.alert('Lỗi', msg);
    } finally {
      setForgotLoading(false);
    }
  };

  const handleShowRememberInfo = () => {
    const info = 'Duy trì đăng nhập giúp tài khoản của bạn luôn sẵn sàng và không cần đăng nhập lại trong những lần mở ứng dụng tiếp theo.';
    if (Platform.OS === 'web') {
      alert(info);
    } else {
      Alert.alert('Duy trì đăng nhập', info);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <AuroraBackground variant="full" palette="calm">
        <SafeAreaView style={styles.container}>
          <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
            <View style={styles.card}>
              {/* Header: Title and QR Switch with Tooltip */}
              <View style={styles.headerRow}>
                <Typography variant="xxl" weight="bold" color="ink" style={styles.headerTitle}>
                  {loginMode === 'password' ? 'Đăng nhập' : 'Đăng nhập với mã QR'}
                </Typography>

                <TouchableOpacity
                  style={styles.qrSwitchButton}
                  activeOpacity={0.8}
                  onPress={() => setLoginMode(loginMode === 'password' ? 'qr' : 'password')}
                >
                  <View style={styles.qrTooltip}>
                    <Typography variant="xs" weight="semiBold" style={styles.qrTooltipText}>
                      {loginMode === 'password' ? 'Đăng nhập\nvới mã QR' : 'Đăng nhập\nvới mật khẩu'}
                    </Typography>
                    <View style={styles.qrTooltipArrow} />
                  </View>
                  <View style={styles.qrIconContainer}>
                    <Ionicons
                      name={loginMode === 'password' ? 'qr-code' : 'keypad-outline'}
                      size={28}
                      color={COLORS.primaryDeep}
                    />
                  </View>
                </TouchableOpacity>
              </View>

              {errorMessage ? (
                <View style={styles.errorBanner}>
                  <Ionicons name="alert-circle-outline" size={18} color={COLORS.danger} />
                  <Typography variant="xs" style={styles.errorText}>
                    {errorMessage}
                  </Typography>
                </View>
              ) : null}

              {loginMode === 'password' ? (
                /* PASSWORD LOGIN FORM (MATCHES SCREENSHOT LAYOUT) */
                <View style={styles.form}>
                  {/* Input 1: Email / SĐT / Tên đăng nhập */}
                  <View style={styles.inputContainer}>
                    <TextInput
                      style={styles.textInput}
                      placeholder="Email/Số điện thoại/Tên đăng nhập"
                      placeholderTextColor={COLORS.muted}
                      value={identifier}
                      onChangeText={(t) => {
                        setIdentifier(t);
                        setErrorMessage('');
                      }}
                      autoCapitalize="none"
                    />
                  </View>

                  {/* Input 2: Mật khẩu kèm icon con mắt + Quên mật khẩu? */}
                  <View style={[styles.inputContainer, styles.passwordInputRow]}>
                    <TextInput
                      style={[styles.textInput, { flex: 1 }]}
                      placeholder="Mật khẩu"
                      placeholderTextColor={COLORS.muted}
                      secureTextEntry={!showPassword}
                      value={password}
                      onChangeText={(t) => {
                        setPassword(t);
                        setErrorMessage('');
                      }}
                    />

                    <TouchableOpacity
                      onPress={() => setShowPassword(!showPassword)}
                      style={styles.eyeButton}
                      activeOpacity={0.7}
                    >
                      <Ionicons
                        name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                        size={18}
                        color={COLORS.muted}
                      />
                    </TouchableOpacity>

                    <View style={styles.verticalDivider} />

                    <TouchableOpacity
                      onPress={() => {
                        setForgotStep(1);
                        setForgotIdentifier(identifier);
                        setForgotMsg('');
                        setShowForgotModal(true);
                      }}
                      style={styles.forgotButton}
                      activeOpacity={0.7}
                    >
                      <Typography variant="xs" weight="medium" style={styles.forgotText}>
                        Quên mật khẩu?
                      </Typography>
                    </TouchableOpacity>
                  </View>

                  {/* Submit Button: ĐĂNG NHẬP */}
                  <Button
                    title="ĐĂNG NHẬP"
                    fullWidth
                    loading={isLoading}
                    onPress={handleLogin}
                    style={styles.loginButton}
                  />

                  {/* Checkbox: Duy trì đăng nhập (?) */}
                  <View style={styles.rememberRow}>
                    <TouchableOpacity
                      style={styles.checkboxClickable}
                      activeOpacity={0.7}
                      onPress={() => setRememberMe(!rememberMe)}
                    >
                      <View style={[styles.checkbox, rememberMe && styles.checkboxActive]}>
                        {rememberMe && <Ionicons name="checkmark" size={13} color="#fff" />}
                      </View>
                      <Typography variant="sm" color="inkSoft" style={styles.rememberText}>
                        Duy trì đăng nhập
                      </Typography>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={handleShowRememberInfo} activeOpacity={0.6}>
                      <Ionicons name="help-circle-outline" size={16} color={COLORS.muted} style={{ marginLeft: 6 }} />
                    </TouchableOpacity>
                  </View>

                  {/* OR Divider: HOẶC */}
                  <View style={styles.dividerRow}>
                    <View style={styles.line} />
                    <Typography variant="xs" weight="medium" color="muted" style={styles.orText}>
                      HOẶC
                    </Typography>
                    <View style={styles.line} />
                  </View>

                  {/* Social Buttons: Facebook & Google */}
                  <View style={styles.socialRow}>
                    <TouchableOpacity
                      style={styles.socialBtn}
                      activeOpacity={0.8}
                      onPress={() => openSocialLoginModal('facebook')}
                    >
                      <Ionicons name="logo-facebook" size={20} color="#1877F2" />
                      <Typography variant="sm" weight="semiBold" color="ink" style={styles.socialBtnText}>
                        Facebook
                      </Typography>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.socialBtn}
                      activeOpacity={0.8}
                      onPress={() => openSocialLoginModal('google')}
                    >
                      <FontAwesome name="google" size={19} color="#EA4335" />
                      <Typography variant="sm" weight="semiBold" color="ink" style={styles.socialBtnText}>
                        Google
                      </Typography>
                    </TouchableOpacity>
                  </View>

                  {/* Terms and Privacy */}
                  <Typography variant="xs" color="muted" style={styles.termsText}>
                    Bằng việc đăng nhập, bạn đồng ý với{' '}
                    <Typography variant="xs" weight="semiBold" style={{ color: COLORS.primaryDeep }}>
                      Điều khoản dịch vụ
                    </Typography>{' '}
                    &{' '}
                    <Typography variant="xs" weight="semiBold" style={{ color: COLORS.primaryDeep }}>
                      Chính sách bảo mật
                    </Typography>{' '}
                    của E-Shop
                  </Typography>

                  {/* Footer: Bạn mới biết đến E-Shop? Đăng ký */}
                  <View style={styles.registerRow}>
                    <Typography variant="sm" color="muted">
                      Bạn mới biết đến E-Shop?{' '}
                    </Typography>
                    <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                      <Typography variant="sm" weight="bold" style={styles.registerLink}>
                        Đăng ký
                      </Typography>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                /* QR CODE LOGIN VIEW */
                <View style={styles.qrView}>
                  <View style={styles.qrCodeBox}>
                    {qrLoading ? (
                      <ActivityIndicator size="large" color={COLORS.primaryDeep} />
                    ) : (
                      <View style={styles.qrPlaceholder}>
                        <Ionicons name="qr-code" size={160} color={COLORS.ink} />
                        <View style={styles.qrCenterLogo}>
                          <Ionicons name="bag-handle" size={20} color={COLORS.primaryDeep} />
                        </View>
                      </View>
                    )}
                  </View>

                  <Typography variant="sm" color="inkSoft" style={styles.qrInstruction}>
                    Quét mã QR bằng ứng dụng di động E-Shop để đăng nhập tức thì không cần mật khẩu
                  </Typography>

                  {/* Simulate Scan Button for testing on web */}
                  <TouchableOpacity
                    style={styles.simulateScanButton}
                    activeOpacity={0.8}
                    onPress={handleSimulateQrScan}
                    disabled={qrLoading}
                  >
                    <Ionicons name="phone-portrait-outline" size={18} color={COLORS.primaryDeep} />
                    <Typography variant="sm" weight="semiBold" style={{ color: COLORS.primaryDeep, marginLeft: 6 }}>
                      Mô phỏng quét mã thành công
                    </Typography>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.refreshQrBtn}
                    onPress={startQrSession}
                  >
                    <Ionicons name="refresh-outline" size={16} color={COLORS.muted} />
                    <Typography variant="xs" color="muted" style={{ marginLeft: 4 }}>
                      Làm mới mã QR
                    </Typography>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </ScrollView>

          {/* SOCIAL LOGIN POPUP MODAL (FIXED CENTERED FOR WEB & MOBILE) */}
          <Modal
            visible={socialModalVisible}
            transparent
            animationType="fade"
            onRequestClose={() => setSocialModalVisible(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalCard}>
                <View style={styles.modalHeader}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    {socialProvider === 'google' ? (
                      <FontAwesome name="google" size={20} color="#EA4335" style={{ marginRight: 8 }} />
                    ) : (
                      <Ionicons name="logo-facebook" size={22} color="#1877F2" style={{ marginRight: 8 }} />
                    )}
                    <Typography variant="md" weight="bold" color="ink">
                      {socialProvider === 'google' ? 'Đăng nhập với Google' : 'Đăng nhập với Facebook'}
                    </Typography>
                  </View>
                  <TouchableOpacity onPress={() => setSocialModalVisible(false)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                    <Ionicons name="close" size={22} color={COLORS.muted} />
                  </TouchableOpacity>
                </View>

                <View style={{ marginTop: spacing.md }}>
                  <Typography variant="xs" color="inkSoft" style={{ marginBottom: spacing.sm }}>
                    Chọn tài khoản để tiếp tục đến <Typography variant="xs" weight="bold" color="ink">E-Shop</Typography>:
                  </Typography>

                  {/* Suggested Account 1 */}
                  <TouchableOpacity
                    style={styles.socialAccountItem}
                    activeOpacity={0.7}
                    onPress={() => executeSocialLogin(
                      socialProvider === 'google' ? 'nguyenvana.dev@gmail.com' : 'nguyenvana.fb@gmail.com',
                      'Nguyễn Văn A',
                      'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'
                    )}
                  >
                    <View style={styles.avatarCircle}>
                      <Typography variant="sm" weight="bold" color="primaryDeep">A</Typography>
                    </View>
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Typography variant="sm" weight="bold" color="ink">Nguyễn Văn A</Typography>
                      <Typography variant="xs" color="inkSoft">
                        {socialProvider === 'google' ? 'nguyenvana.dev@gmail.com' : 'nguyenvana.fb@gmail.com'}
                      </Typography>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={COLORS.muted} />
                  </TouchableOpacity>

                  {/* Suggested Account 2 */}
                  <TouchableOpacity
                    style={styles.socialAccountItem}
                    activeOpacity={0.7}
                    onPress={() => executeSocialLogin(
                      socialProvider === 'google' ? 'khachhang.demo@gmail.com' : 'khachhang.demo@facebook.com',
                      'Khách Hàng Mẫu',
                      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150'
                    )}
                  >
                    <View style={[styles.avatarCircle, { backgroundColor: COLORS.mint }]}>
                      <Typography variant="sm" weight="bold" style={{ color: COLORS.mintDeep }}>K</Typography>
                    </View>
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Typography variant="sm" weight="bold" color="ink">Khách Hàng Mẫu</Typography>
                      <Typography variant="xs" color="inkSoft">
                        {socialProvider === 'google' ? 'khachhang.demo@gmail.com' : 'khachhang.demo@facebook.com'}
                      </Typography>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={COLORS.muted} />
                  </TouchableOpacity>

                  {/* Custom Email Input */}
                  <View style={styles.customEmailBlock}>
                    <Typography variant="xs" color="inkSoft" style={{ marginBottom: 6 }}>
                      Hoặc nhập email {socialProvider === 'google' ? 'Google' : 'Facebook'} của bạn:
                    </Typography>
                    <View style={styles.inputContainer}>
                      <Ionicons name="mail-outline" size={18} color={COLORS.muted} style={{ marginRight: 8 }} />
                      <TextInput
                        style={styles.textInput}
                        placeholder={socialProvider === 'google' ? 'emailcuaban@gmail.com' : 'emailcuaban@facebook.com'}
                        placeholderTextColor={COLORS.muted}
                        value={customSocialEmail}
                        onChangeText={setCustomSocialEmail}
                        autoCapitalize="none"
                      />
                    </View>
                    <Button
                      title={`Đăng Nhập Với ${socialProvider === 'google' ? 'Google' : 'Facebook'}`}
                      fullWidth
                      loading={isLoading}
                      onPress={() => {
                        if (!customSocialEmail.trim()) {
                          const msg = 'Vui lòng nhập email';
                          if (Platform.OS === 'web') alert(msg);
                          else Alert.alert('Thông báo', msg);
                          return;
                        }
                        executeSocialLogin(
                          customSocialEmail.trim(),
                          'Người Dùng E-Shop',
                          'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'
                        );
                      }}
                      style={{ marginTop: spacing.md }}
                    />
                  </View>
                </View>
              </View>
            </View>
          </Modal>

          {/* FORGOT PASSWORD MODAL */}
          <Modal
            visible={showForgotModal}
            transparent
            animationType="fade"
            onRequestClose={() => setShowForgotModal(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalCard}>
                <View style={styles.modalHeader}>
                  <Typography variant="lg" weight="bold" color="ink">
                    {forgotStep === 1 ? 'Khôi phục mật khẩu' : 'Xác thực OTP & Mật khẩu mới'}
                  </Typography>
                  <TouchableOpacity onPress={() => setShowForgotModal(false)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                    <Ionicons name="close" size={22} color={COLORS.muted} />
                  </TouchableOpacity>
                </View>

                {forgotStep === 1 ? (
                  <View style={{ marginTop: spacing.md }}>
                    <Typography variant="sm" color="inkSoft" style={{ marginBottom: spacing.md }}>
                      Nhập Email hoặc Số điện thoại đã đăng ký để nhận mã OTP khôi phục.
                    </Typography>

                    <View style={styles.inputContainer}>
                      <Ionicons name="person-outline" size={18} color={COLORS.muted} style={{ marginRight: 8 }} />
                      <TextInput
                        style={styles.textInput}
                        placeholder="Email hoặc Số điện thoại"
                        placeholderTextColor={COLORS.muted}
                        value={forgotIdentifier}
                        onChangeText={setForgotIdentifier}
                        autoCapitalize="none"
                      />
                    </View>

                    <Button
                      title="Gửi Mã Xác Thực OTP"
                      fullWidth
                      loading={forgotLoading}
                      onPress={handleRequestOtp}
                      style={{ marginTop: spacing.lg }}
                    />
                  </View>
                ) : (
                  <View style={{ marginTop: spacing.md }}>
                    {forgotMsg ? (
                      <View style={styles.infoBanner}>
                        <Ionicons name="information-circle" size={18} color={COLORS.primaryDeep} />
                        <Typography variant="xs" style={{ color: COLORS.primaryDeep, marginLeft: 6, flex: 1 }}>
                          {forgotMsg}
                        </Typography>
                      </View>
                    ) : null}

                    <Typography variant="xs" weight="medium" color="inkSoft" style={{ marginTop: spacing.xs, marginBottom: 6 }}>
                      MÃ XÁC THỰC OTP (6 SỐ)
                    </Typography>
                    <View style={styles.inputContainer}>
                      <TextInput
                        style={styles.textInput}
                        placeholder="Nhập mã OTP"
                        placeholderTextColor={COLORS.muted}
                        value={otpCode}
                        onChangeText={setOtpCode}
                        keyboardType="number-pad"
                      />
                    </View>

                    <Typography variant="xs" weight="medium" color="inkSoft" style={{ marginTop: spacing.md, marginBottom: 6 }}>
                      MẬT KHẨU MỚI
                    </Typography>
                    <View style={styles.inputContainer}>
                      <TextInput
                        style={styles.textInput}
                        placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)"
                        placeholderTextColor={COLORS.muted}
                        secureTextEntry
                        value={newPassword}
                        onChangeText={setNewPassword}
                      />
                    </View>

                    <Button
                      title="Xác Nhận Đổi Mật Khẩu"
                      fullWidth
                      loading={forgotLoading}
                      onPress={handleResetPassword}
                      style={{ marginTop: spacing.lg }}
                    />
                  </View>
                )}
              </View>
            </View>
          </Modal>
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
    alignItems: 'center',
    padding: spacing.xl,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: COLORS.surface,
    borderRadius: radius.xl,
    padding: spacing.xl,
    shadowColor: COLORS.ink,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 5,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  headerTitle: {
    fontSize: 22,
    letterSpacing: -0.3,
  },
  qrSwitchButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  qrTooltip: {
    backgroundColor: '#FFF9E8',
    borderWidth: 1,
    borderColor: '#FBD38D',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: radius.md,
    position: 'relative',
    marginRight: 8,
  },
  qrTooltipText: {
    color: '#DD6B20',
    fontSize: 11,
    lineHeight: 14,
    textAlign: 'center',
  },
  qrTooltipArrow: {
    position: 'absolute',
    right: -6,
    top: '38%',
    width: 0,
    height: 0,
    borderTopWidth: 5,
    borderTopColor: 'transparent',
    borderBottomWidth: 5,
    borderBottomColor: 'transparent',
    borderLeftWidth: 6,
    borderLeftColor: '#FBD38D',
  },
  qrIconContainer: {
    backgroundColor: COLORS.surfaceAlt,
    padding: 6,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.dangerSoft,
    borderWidth: 1,
    borderColor: '#ffcdd2',
    padding: spacing.sm,
    borderRadius: radius.md,
    marginBottom: spacing.md,
  },
  errorText: {
    color: COLORS.danger,
    marginLeft: 6,
    flex: 1,
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: radius.md,
    backgroundColor: COLORS.surface,
    height: 46,
    paddingHorizontal: 14,
    marginBottom: spacing.md,
  },
  textInput: {
    fontSize: 14,
    color: COLORS.ink,
    padding: 0,
    flex: 1,
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : {}),
  },
  passwordInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  eyeButton: {
    paddingHorizontal: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  verticalDivider: {
    width: 1,
    height: 18,
    backgroundColor: COLORS.border,
    marginHorizontal: 8,
  },
  forgotButton: {
    paddingHorizontal: 2,
    justifyContent: 'center',
  },
  forgotText: {
    color: COLORS.primaryDeep,
    fontSize: 12,
  },
  loginButton: {
    height: 46,
    borderRadius: radius.md,
    marginTop: spacing.xs,
  },
  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  checkboxClickable: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 18,
    height: 18,
    borderWidth: 1.5,
    borderColor: COLORS.muted,
    borderRadius: 3,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    backgroundColor: COLORS.surface,
  },
  checkboxActive: {
    backgroundColor: COLORS.primaryDeep,
    borderColor: COLORS.primaryDeep,
  },
  rememberText: {
    fontSize: 13,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },
  orText: {
    paddingHorizontal: spacing.md,
    fontSize: 11,
    letterSpacing: 0.6,
  },
  socialRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  socialBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 44,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: radius.md,
    backgroundColor: COLORS.surface,
    gap: spacing.sm,
    shadowColor: COLORS.ink,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  socialBtnText: {
    fontSize: 13,
  },
  termsText: {
    textAlign: 'center',
    fontSize: 11,
    lineHeight: 17,
    marginTop: spacing.lg,
    paddingHorizontal: spacing.sm,
  },
  registerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  registerLink: {
    color: COLORS.primaryDeep,
    fontSize: 14,
  },
  qrView: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  qrCodeBox: {
    width: 210,
    height: 210,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: radius.xl,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    shadowColor: COLORS.ink,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  qrPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  qrCenterLogo: {
    position: 'absolute',
    backgroundColor: COLORS.primarySoft,
    padding: 7,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  qrInstruction: {
    textAlign: 'center',
    marginTop: spacing.lg,
    paddingHorizontal: spacing.md,
    lineHeight: 20,
  },
  simulateScanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    borderRadius: radius.lg,
    paddingVertical: 10,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.lg,
    backgroundColor: COLORS.primarySoft,
  },
  refreshQrBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(43, 45, 66, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
    ...(Platform.OS === 'web'
      ? ({
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 999999,
        } as any)
      : {}),
  },
  modalCard: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: COLORS.surface,
    borderRadius: radius.xl,
    padding: spacing.xl,
    shadowColor: COLORS.ink,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  socialAccountItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: radius.lg,
    backgroundColor: COLORS.surfaceAlt,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  avatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primarySoft,
    justifyContent: 'center',
    alignItems: 'center',
  },
  customEmailBlock: {
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primarySoft,
    padding: spacing.sm,
    borderRadius: radius.md,
    marginBottom: spacing.sm,
  },
});
