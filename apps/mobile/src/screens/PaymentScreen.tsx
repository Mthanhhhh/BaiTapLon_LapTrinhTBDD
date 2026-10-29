import { appAlert } from '../utils/appAlert';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { useContext, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { OrderResponse } from '../hooks/useCart';
import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { COLORS, spacing, radius, typography } from '../theme';
import { Typography, Button, Badge } from '../components/ui';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useProcessPayment, PaymentRequest } from '../hooks/useCart';
import { formatVND } from '../utils/formatters';

export default function PaymentScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'Payment'>>();

  const orderId = Number(route.params?.orderId);
  const { user } = useContext(AuthContext);
  const orderQuery = useQuery({queryKey:['orders',user?.id,'payment',orderId],enabled:!!user&&Number.isFinite(orderId)&&orderId>0,queryFn:async()=> (await apiClient.get(`/api/v1/orders/${orderId}`)).data.data as OrderResponse});
  const totalAmount = orderQuery.data?.total ?? route.params?.total ?? 0;
  const orderNumber = route.params?.orderNumber ?? (orderId ? `#EC${orderId}` : '');

  const processPaymentMutation = useProcessPayment();

  const [method, setMethod] = useState<'VISA' | 'MAESTRO' | 'PAYPAL'>(route.params?.method ?? 'VISA');
  const [cardNumber, setCardNumber] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [paypalEmail, setPaypalEmail] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const saved=orderQuery.data?.paymentMethod;
    if(saved==='VISA'||saved==='MAESTRO'||saved==='PAYPAL')setMethod(saved);
  },[orderQuery.data?.paymentMethod]);

  const formatCardNumber = (text: string) => {
    const cleaned = text.replace(/\D/g, '').substring(0, 16);
    const parts = [];
    for (let i = 0; i < cleaned.length; i += 4) {
      parts.push(cleaned.substring(i, i + 4));
    }
    return parts.join(' ');
  };

  const handlePay = () => {
    setErrorMessage('');
    if (!orderId || !orderQuery.data || orderQuery.data.status !== 'PENDING_PAYMENT') {
      setErrorMessage('Không tìm thấy đơn hàng cần thanh toán. Hãy quay lại giỏ hàng và tạo đơn trước.');
      return;
    }

    if (method === 'PAYPAL') {
      if (!paypalEmail.includes('@')) {
        setErrorMessage('Please enter a valid PayPal email address.');
        return;
      }
    } else {
      const cleanCard = cardNumber.replace(/\s+/g, '');
      if (cleanCard.length < 12) {
        setErrorMessage('Please enter a valid card number (at least 12 digits).');
        return;
      }
      if (!cardHolder.trim()) {
        setErrorMessage('Cardholder name is required.');
        return;
      }
    }

    const payload: PaymentRequest = {
      orderId,
      method,
      cardNumber: method !== 'PAYPAL' ? cardNumber.replace(/\s+/g, '') : undefined,
      cardHolderName: method !== 'PAYPAL' ? cardHolder.trim() : undefined,
      cardExpiry: method !== 'PAYPAL' ? cardExpiry.trim() : undefined,
      cardCvv: method !== 'PAYPAL' ? cardCvv.trim() : undefined,
      paypalEmail: method === 'PAYPAL' ? paypalEmail.trim() : undefined,
    };

    processPaymentMutation.mutate(payload, {
      onSuccess: (paymentResp) => {
        navigation.replace('Success', {
          orderId,
          amount: paymentResp.amount,
          paymentMethod: method,
          cardLastFour: paymentResp.cardLastFour,
          transactionId: paymentResp.transactionId,
        });
      },
      onError: (err: any) => {
        const msg = err.message || 'Payment was declined by the bank.';
        setErrorMessage(msg);
        appAlert.alert('Payment Failed', msg);
      },
    });
  };

  if (orderQuery.isPending && user && orderId) return <SafeAreaView style={styles.container}><View style={{padding:24}}><Typography>Đang tải đơn hàng...</Typography></View></SafeAreaView>;
  if (!user || !Number.isFinite(orderId) || orderId <= 0 || orderQuery.isError || (orderQuery.data && orderQuery.data.status !== 'PENDING_PAYMENT')) return <SafeAreaView style={styles.container}><View style={{padding:24,gap:16}}><Typography>Đơn không còn chờ thanh toán hoặc bạn chưa đăng nhập đúng tài khoản.</Typography><Button onPress={()=>navigation.navigate('Main',{screen:'Orders'})}>Về đơn hàng</Button></View></SafeAreaView>;

  return (
    <SafeAreaView style={styles.container}>
      {(!user || !orderId || orderQuery.isError || (orderQuery.data && orderQuery.data.status !== 'PENDING_PAYMENT')) && <View style={{padding:16}}><Typography>Đơn không còn chờ thanh toán hoặc bạn chưa đăng nhập đúng tài khoản.</Typography><Button onPress={()=>navigation.navigate('Main',{screen:'Orders'})}>Về đơn hàng</Button></View>}
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.canGoBack() ? navigation.goBack() : navigation.navigate('Main', {screen:'Orders'})} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={22} color={COLORS.ink} />
        </TouchableOpacity>
        <Typography variant="lg" weight="bold" role="heading" aria-level={1}>
          Thanh toán
        </Typography>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Typography variant="sm" color="inkSoft">Thanh toán trực tuyến đang ở chế độ thử nghiệm local, không trừ tiền thật. Dùng dữ liệu thẻ thử nghiệm.</Typography>
        {/* Order Summary Card */}
        <View style={styles.orderSummaryCard}>
          <View style={styles.summaryTopRow}>
            <View>
              <Typography variant="xs" color="muted">
                Mã đơn hàng
              </Typography>
              <Typography variant="md" weight="bold" color="primaryDeep">
                {orderNumber}
              </Typography>
            </View>
            <Badge label="Chờ thanh toán" variant="warning" />
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryBottomRow}>
            <Typography variant="sm" color="inkSoft">
              Số tiền cần thanh toán
            </Typography>
            <Typography variant="xl" weight="bold" color="primaryDeep">
              {formatVND(totalAmount)}
            </Typography>
          </View>
        </View>

        {/* Payment Method Selector Tabs */}
        <Typography variant="md" weight="bold" style={styles.sectionTitle}>
          Chọn phương thức thanh toán
        </Typography>
        <View style={styles.methodTabsRow}>
          {(
            [
              { id: 'VISA', label: 'Visa', icon: 'card' },
              { id: 'MAESTRO', label: 'Maestro', icon: 'card-outline' },
              { id: 'PAYPAL', label: 'PayPal', icon: 'logo-paypal' },
            ] as const
          ).map((item) => {
            const isSelected = method === item.id;
            return (
              <TouchableOpacity
                key={item.id}
                style={[styles.methodTab, isSelected && styles.methodTabSelected]}
                onPress={() => {
                  setMethod(item.id);
                  setErrorMessage('');
                }}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={item.icon as any}
                  size={20}
                  color={isSelected ? COLORS.primaryDeep : COLORS.inkSoft}
                />
                <Typography
                  variant="xs"
                  weight={isSelected ? 'bold' : 'regular'}
                  color={isSelected ? 'primaryDeep' : 'inkSoft'}
                  style={{ marginTop: 4 }}
                >
                  {item.label}
                </Typography>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Card Form */}
        {method !== 'PAYPAL' ? (
          <View style={styles.formCard}>
            <Typography variant="sm" weight="bold" style={styles.fieldLabel}>
              Số thẻ thanh toán
            </Typography>
            <View style={styles.inputWithIcon}>
              <Ionicons name="card" size={20} color={COLORS.muted} style={{ marginRight: spacing.sm }} />
              <TextInput
                style={styles.textInput}
                placeholder="4111 2222 3333 4444"
                placeholderTextColor={COLORS.muted}
                value={cardNumber}
                onChangeText={(text) => setCardNumber(formatCardNumber(text))}
                keyboardType="numeric"
                maxLength={19}
              />
            </View>

            <Typography variant="sm" weight="bold" style={styles.fieldLabel}>
              Tên chủ thẻ (In hoa)
            </Typography>
            <View style={styles.inputWithIcon}>
              <Ionicons name="person" size={20} color={COLORS.muted} style={{ marginRight: spacing.sm }} />
              <TextInput
                style={styles.textInput}
                placeholder="NGUYEN VAN A"
                placeholderTextColor={COLORS.muted}
                value={cardHolder}
                onChangeText={setCardHolder}
                autoCapitalize="characters"
              />
            </View>

            <View style={styles.formRow}>
              <View style={{ flex: 1, marginRight: spacing.sm }}>
                <Typography variant="sm" weight="bold" style={styles.fieldLabel}>
                  Hạn thẻ (MM/YY)
                </Typography>
                <View style={styles.inputWithIcon}>
                  <TextInput
                    style={styles.textInput}
                    placeholder="MM/YY"
                    placeholderTextColor={COLORS.muted}
                    value={cardExpiry}
                    onChangeText={setCardExpiry}
                    maxLength={5}
                  />
                </View>
              </View>

              <View style={{ flex: 1, marginLeft: spacing.sm }}>
                <Typography variant="sm" weight="bold" style={styles.fieldLabel}>
                  Mã bảo mật CVV
                </Typography>
                <View style={styles.inputWithIcon}>
                  <TextInput
                    style={styles.textInput}
                    placeholder="123"
                    placeholderTextColor={COLORS.muted}
                    value={cardCvv}
                    onChangeText={setCardCvv}
                    keyboardType="numeric"
                    maxLength={4}
                    secureTextEntry
                  />
                </View>
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.formCard}>
            <Typography variant="sm" weight="bold" style={styles.fieldLabel}>
              Tài khoản Email PayPal
            </Typography>
            <View style={styles.inputWithIcon}>
              <Ionicons name="mail" size={20} color={COLORS.muted} style={{ marginRight: spacing.sm }} />
              <TextInput
                style={styles.textInput}
                placeholder="user@example.com"
                placeholderTextColor={COLORS.muted}
                value={paypalEmail}
                onChangeText={setPaypalEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>
        )}

        {/* Backend Mock Testing Guidance Box */}
        <View style={styles.hintBox}>
          <View style={styles.hintTitleRow}>
            <Ionicons name="bulb-outline" size={18} color={COLORS.star} />
            <Typography variant="xs" weight="bold" style={{ marginLeft: 6 }}>
              Hướng dẫn kiểm thử thanh toán
            </Typography>
          </View>
          <Typography variant="xs" color="inkSoft" style={{ marginTop: 4 }}>
            • <Typography variant="xs" weight="semiBold">Số thẻ thông thường</Typography> (VD kết thúc bằng 1234): mô phỏng giao dịch thành công ngay lập tức.
          </Typography>
          <Typography variant="xs" color="inkSoft" style={{ marginTop: 2 }}>
            • <Typography variant="xs" weight="semiBold">Số thẻ kết thúc bằng 0000</Typography> (VD: 4111 0000): kích hoạt lỗi từ chối để kiểm thử cơ chế hoàn kho Kafka Saga.
          </Typography>
        </View>

        {/* Error Message Display */}
        {errorMessage ? (
          <View style={styles.errorBanner}>
            <Ionicons name="alert-circle" size={18} color={COLORS.danger} />
            <Typography variant="xs" color="danger" weight="semiBold" style={{ marginLeft: spacing.xs, flex: 1 }}>
              {errorMessage}
            </Typography>
          </View>
        ) : null}

        {/* Security Trust Badge */}
        <View style={styles.trustBadgeRow}>
          <Ionicons name="shield-checkmark" size={16} color={COLORS.mintDeep} />
          <Typography variant="xs" color="muted" style={{ marginLeft: 6 }}>
            Giao dịch được bảo vệ và mã hóa 256-bit an toàn.
          </Typography>
        </View>
      </ScrollView>

      {/* Pay Now Bottom Bar */}
      <View style={styles.bottomBar}>
        <Button
          title={processPaymentMutation.isPending ? 'Đang xác thực thanh toán...' : `Thanh toán ${formatVND(totalAmount)}`}
          variant="primary"
          size="lg"
          fullWidth
          loading={processPaymentMutation.isPending}
          onPress={handlePay}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: 110,
  },
  orderSummaryCard: {
    backgroundColor: COLORS.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: spacing.lg,
  },
  summaryTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: spacing.sm,
  },
  summaryBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    marginBottom: spacing.sm,
  },
  methodTabsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  methodTab: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    marginHorizontal: 4,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  methodTabSelected: {
    borderColor: COLORS.primaryDeep,
    backgroundColor: COLORS.primarySoft,
  },
  formCard: {
    backgroundColor: COLORS.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: spacing.md,
  },
  fieldLabel: {
    marginBottom: 6,
    color: COLORS.ink,
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    height: 46,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  textInput: {
    flex: 1,
    fontFamily: typography.fontFamily.regular,
    fontSize: 14,
    color: COLORS.ink,
  },
  formRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  hintBox: {
    backgroundColor: '#FFFDF0',
    borderRadius: radius.md,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: '#FEEAA0',
    marginBottom: spacing.md,
  },
  hintTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEBF0',
    borderRadius: radius.md,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: '#FFCCD8',
    marginBottom: spacing.md,
  },
  trustBadgeRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.surface,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
});
