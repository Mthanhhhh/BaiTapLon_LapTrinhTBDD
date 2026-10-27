import React from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { COLORS, spacing, radius } from '../theme';
import { Typography, Button, Badge } from '../components/ui';
import { RootStackParamList } from '../navigation/AppNavigator';
import { formatVND } from '../utils/formatters';

export default function SuccessScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'Success'>>();

  const orderId = route.params?.orderId;
  const amount = route.params?.amount ?? 0;
  const paymentMethod = route.params?.paymentMethod;
  const cardLastFour = route.params?.cardLastFour;
  const transactionId = route.params?.transactionId;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Success Icon */}
        <View style={styles.successIconWrapper}>
          <View style={styles.successIconOuter}>
            <View style={styles.successIconInner}>
              <Ionicons name="checkmark" size={44} color={COLORS.surface} />
            </View>
          </View>
        </View>

        {/* Title */}
        <Typography variant="xxl" weight="bold" align="center" style={{ marginTop: spacing.md }}>
          {paymentMethod === 'COD' ? 'Đặt hàng thành công!' : 'Thanh toán thành công!'}
        </Typography>
        <Typography variant="sm" color="inkSoft" align="center" style={{ marginTop: spacing.xs, marginHorizontal: spacing.lg }}>
          Đơn hàng của bạn đã được xác nhận và gửi tới người bán.
        </Typography>

        {/* Receipt Card */}
        <View style={styles.receiptCard}>
          <View style={styles.receiptHeader}>
            <View>
              <Typography variant="xs" color="muted">
                Mã đơn hàng
              </Typography>
              <Typography variant="md" weight="bold" color="primaryDeep">
                {orderId ? `#EC${orderId}` : '—'}
              </Typography>
            </View>
            <Badge
              label={paymentMethod === 'COD' ? 'ĐÃ ĐẶT HÀNG (COD)' : paymentMethod ? 'ĐÃ THANH TOÁN' : 'ĐÃ ĐẶT HÀNG'}
              variant="success"
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.receiptRow}>
            <Typography variant="sm" color="inkSoft">
              Phương thức thanh toán
            </Typography>
            <Typography variant="sm" weight="semiBold">
              {paymentMethod === 'COD'
                ? 'Thanh toán khi nhận hàng (Tiền mặt)'
                : paymentMethod ? `${paymentMethod} ${paymentMethod !== 'PAYPAL' && cardLastFour ? `•••• ${cardLastFour}` : ''}` : '—'}
            </Typography>
          </View>

          {transactionId ? (
            <View style={styles.receiptRow}>
              <Typography variant="sm" color="inkSoft">Mã giao dịch</Typography>
              <Typography variant="xs" color="muted" weight="semiBold">{transactionId}</Typography>
            </View>
          ) : null}

          <View style={styles.receiptRow}>
            <Typography variant="sm" color="inkSoft">
              Thời gian giao dịch
            </Typography>
            <Typography variant="xs" color="muted">
              {new Date().toLocaleDateString('vi-VN')} {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Typography>
          </View>

          <View style={styles.divider} />

          <View style={styles.receiptRow}>
            <Typography variant="md" weight="bold">
              Tổng thanh toán
            </Typography>
            <Typography variant="xl" weight="bold" color="primaryDeep">
              {formatVND(amount)}
            </Typography>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.btnGroup}>
          <Button
            title="Xem đơn hàng của tôi"
            variant="primary"
            size="lg"
            fullWidth
            onPress={() => navigation.navigate('Main', { screen: 'Orders' } as any)}
            style={{ marginBottom: spacing.sm }}
          />

          <Button
            title="Tiếp tục mua sắm"
            variant="soft"
            size="lg"
            fullWidth
            onPress={() => navigation.navigate('Main', { screen: 'Home' } as any)}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingTop: spacing.xxl,
    alignItems: 'center',
  },
  successIconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
  },
  successIconOuter: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: COLORS.mint,
    justifyContent: 'center',
    alignItems: 'center',
  },
  successIconInner: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: COLORS.mintDeep,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.mintDeep,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  receiptCard: {
    width: '100%',
    backgroundColor: COLORS.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    marginTop: spacing.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.ink,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  receiptHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: spacing.md,
  },
  receiptRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 4,
  },
  btnGroup: {
    width: '100%',
    marginTop: spacing.xl,
  },
});
