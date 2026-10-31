import {useQuery} from '@tanstack/react-query';
import {apiClient} from '../api/client';
import {PricingQuote} from '../hooks/usePromotions';
import * as Crypto from 'expo-crypto';
import {provinceLabel} from '../utils/vietnamShipping';
import {CartProductImage} from '../components/CartProductImage';
import { appAlert } from '../utils/appAlert';
import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { COLORS, spacing, radius, typography } from '../theme';
import { Typography, Button, Badge, RemoteImage } from '../components/ui';
import { RootStackParamList } from '../navigation/AppNavigator';
import { formatVND } from '../utils/formatters';
import {
  useCart,
  useUpdateCartItem,
  useRemoveCartItem,
  useAddresses,
  useCreateOrder,
} from '../hooks/useCart';

export default function CheckoutScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const { data: cart, isLoading: isCartLoading, isError: isCartError, error: cartError, refetch: refetchCart } = useCart();
  const { data: addresses, isLoading: isAddrLoading } = useAddresses();
  const updateCartItemMutation = useUpdateCartItem();
  const removeCartItemMutation = useRemoveCartItem();
  const createOrderMutation = useCreateOrder();

  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'COD' | 'VISA' | 'MAESTRO' | 'PAYPAL'>('COD');
  const [orderNote, setOrderNote] = useState('');
  const [autoBest,setAutoBest]=useState(true),[voucherCodes,setVoucherCodes]=useState<string[]>([]),[manualCode,setManualCode]=useState('');
  const [idempotencyKey]=useState(()=>Crypto.randomUUID());
  const quote=useQuery<PricingQuote>({queryKey:['promotionQuote',cart?.id,cart?.items.map(i=>[i.id,i.quantity,i.price]),autoBest,voucherCodes],enabled:!!cart?.items.length,retry:false,queryFn:async()=>(await apiClient.post('/api/v1/promotions/quote',{autoBest,codes:voucherCodes})).data.data});

  useEffect(() => {
    if (selectedAddressId == null && addresses?.length) {
      setSelectedAddressId(addresses.find((address) => address.isDefault)?.id ?? addresses[0].id);
    }
  }, [addresses, selectedAddressId]);

  const currentAddress = addresses?.find((a) => a.id === selectedAddressId) ?? addresses?.find((a) => a.isDefault) ?? addresses?.[0];

  const subtotal=quote.data?.subtotal??0,tax=quote.data?.tax??0,shippingFee=quote.data?.fees??0,total=quote.data?.total??0;

  const handleQuantityChange = (itemId: number, currentQty: number, delta: number) => {
    const newQty = currentQty + delta;
    if (newQty <= 0) {
      appAlert.alert('Xóa sản phẩm', 'Bạn có chắc chắn muốn bỏ sản phẩm này khỏi giỏ hàng?', [
        { text: 'Hủy', style: 'cancel' },
        { text: 'Xóa ngay', style: 'destructive', onPress: () => removeCartItemMutation.mutate(itemId) },
      ]);
    } else {
      if (newQty > 99) {
        appAlert.alert('Vượt giới hạn', 'Mỗi sản phẩm chỉ được đặt tối đa 99 sản phẩm.');
        return;
      }
      updateCartItemMutation.mutate({ itemId, quantity: newQty });
    }
  };

  const handlePlaceOrder = () => {
    if (createOrderMutation.isPending) return;
    if(!quote.data||quote.isFetching||quote.isError){appAlert.alert('Cập nhật giá','Hãy tải lại bảng tính tiền trước khi đặt hàng.');quote.refetch();return;}
    if (!cart?.items || cart.items.length === 0) {
      appAlert.alert('Giỏ hàng trống', 'Vui lòng thêm sản phẩm vào giỏ hàng trước khi đặt hàng.');
      return;
    }
    if (!currentAddress) {
      appAlert.alert('Thiếu địa chỉ nhận hàng', 'Hãy thêm địa chỉ giao hàng trong mục Tài khoản trước khi đặt hàng.');
      return;
    }

    createOrderMutation.mutate(
      {
        addressId: currentAddress.id,
        autoBest,voucherCodes,quoteHash:quote.data.quoteHash,idempotencyKey,
        note: orderNote.trim(),
        paymentMethod: selectedPaymentMethod,
      },
      {
        onSuccess: (order) => {
          if (selectedPaymentMethod === 'COD') {
            navigation.replace('Success', { orderId: order.id, amount: order.total, paymentMethod: 'COD' });
            return;
          }
          navigation.replace('Payment', {
            method: selectedPaymentMethod,
            orderId: order.id,
            total: order.total,
            orderNumber: order.orderNo ? `#${order.orderNo}` : `#EC${order.id}`,
          });
        },
        onError: (err: any) => {
          quote.refetch();
          appAlert.alert('Lỗi đặt hàng', err.message || 'Không thể tạo đơn hàng. Vui lòng thử lại.');
        },
      }
    );
  };

  if (isCartLoading && !cart) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.primaryDeep} />
        <Typography variant="sm" color="muted" style={{ marginTop: spacing.md }}>
          Đang tải giỏ hàng của bạn...
        </Typography>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.canGoBack() ? navigation.goBack() : navigation.navigate('Main', {screen:'Home'})} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={22} color={COLORS.ink} />
        </TouchableOpacity>
        <Typography variant="lg" weight="bold" role="heading" aria-level={1}>
          Xác nhận đơn hàng
        </Typography>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Section 1: Delivery Address */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.cardTitleWithIcon}>
              <Ionicons name="location-sharp" size={18} color={COLORS.primaryDeep} />
              <Typography variant="md" weight="bold" style={{ marginLeft: spacing.xs }}>
                Địa chỉ nhận hàng
              </Typography>
            </View>
            {currentAddress?.isDefault && <Badge label="Mặc định" variant="primary" />}
          </View>

          {currentAddress ? (
            <View style={styles.addressBox}>
              <Typography variant="sm" weight="semiBold" color="ink">
                {currentAddress.fullName} | {currentAddress.phone}
              </Typography>
              <Typography variant="sm" color="inkSoft" style={{ marginTop: 2 }}>
                {[currentAddress.street, currentAddress.state, provinceLabel(currentAddress.city), currentAddress.country].filter(Boolean).join(', ')}
              </Typography>
            </View>
          ) : (
            <Typography variant="sm" color="muted">
              Chưa có địa chỉ nhận hàng được chọn.
            </Typography>
          )}
        </View>

        {/* Section 2: Order Items */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Typography variant="md" weight="bold">
              Sản phẩm ({cart?.items?.length || 0})
            </Typography>
          </View>

          {isCartError ? (
            <View style={styles.emptyCartBox}>
              <Ionicons name="cloud-offline-outline" size={36} color={COLORS.danger} />
              <Typography variant="sm" color="inkSoft" align="center" style={{ marginTop: spacing.xs }}>
                Không tải được giỏ hàng{cartError?.message ? `: ${cartError.message}` : '.'}
              </Typography>
              <Button title="Thử tải lại" variant="outline" size="sm" style={{ marginTop: spacing.sm }} onPress={() => refetchCart()} />
            </View>
          ) : cart?.items && cart.items.length > 0 ? (
            cart.items.map((item, idx) => (
              <View key={item.id} style={[styles.itemRow, idx !== cart.items.length - 1 && styles.itemBorder]}>
                <CartProductImage item={item} style={styles.itemImage} />
                <View style={styles.itemDetails}>
                  <Typography variant="sm" weight="semiBold" numberOfLines={1}>
                    {item.productName}
                  </Typography>
                  {item.variantName ? (
                    <Typography variant="xs" color="muted" style={{ marginTop: 2 }}>
                      Phân loại: {item.variantName}
                    </Typography>
                  ) : null}
                  <Typography variant="sm" weight="bold" color="primaryDeep" style={{ marginTop: 4 }}>
                    {formatVND(quote.data?.lines.find(line=>line.cartItemId===item.id)?.unitPrice??item.price)}
                  </Typography>
                </View>

                {/* Quantity Controls */}
                <View style={styles.qtyContainer}>
                  <TouchableOpacity
                    style={styles.qtyBtn}
                    onPress={() => handleQuantityChange(item.id, item.quantity, -1)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="remove" size={14} color={COLORS.ink} />
                  </TouchableOpacity>
                  <Typography variant="sm" weight="bold" style={styles.qtyText}>
                    {item.quantity}
                  </Typography>
                  <TouchableOpacity
                    style={styles.qtyBtn}
                    onPress={() => handleQuantityChange(item.id, item.quantity, 1)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="add" size={14} color={COLORS.ink} />
                  </TouchableOpacity>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyCartBox}>
              <Ionicons name="cart-outline" size={40} color={COLORS.muted} />
              <Typography variant="sm" color="muted" style={{ marginTop: spacing.xs }}>
                Giỏ hàng của bạn đang trống.
              </Typography>
            </View>
          )}
        </View>

        {/* Section 4: Payment Method */}
        <View style={styles.card}>
          <Typography variant="md" weight="bold" style={{ marginBottom: spacing.sm }}>
            Phương thức thanh toán
          </Typography>
          {(
            [
              { id: 'COD', label: 'Thanh toán khi nhận hàng (COD)', icon: 'cash-outline' },
              { id: 'VISA', label: 'Thẻ Quốc Tế Visa', icon: 'card-outline' },
              { id: 'MAESTRO', label: 'Thẻ Ghi Nợ Maestro', icon: 'card-outline' },
              { id: 'PAYPAL', label: 'Cổng Ví Điện Tử PayPal', icon: 'logo-paypal' },
            ] as const
          ).map((m) => {
            const isSelected = selectedPaymentMethod === m.id;
            return (
              <TouchableOpacity
                key={m.id}
                style={[styles.paymentMethodOption, isSelected && styles.paymentMethodOptionSelected]}
                onPress={() => setSelectedPaymentMethod(m.id)}
                activeOpacity={0.8}
              >
                <View style={styles.paymentLeft}>
                  <Ionicons
                    name={m.icon as any}
                    size={20}
                    color={isSelected ? COLORS.primaryDeep : COLORS.inkSoft}
                  />
                  <Typography
                    variant="sm"
                    weight={isSelected ? 'bold' : 'regular'}
                    style={{ marginLeft: spacing.sm }}
                  >
                    {m.label}
                  </Typography>
                </View>
                <Ionicons
                  name={isSelected ? 'radio-button-on' : 'radio-button-off'}
                  size={20}
                  color={isSelected ? COLORS.primaryDeep : COLORS.muted}
                />
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.card}><Typography variant="md" weight="bold">Voucher và ưu đãi</Typography><Typography variant="xs" color="muted">Tối đa 1 mã shop + 1 mã sàn + 1 mã vận chuyển, tùy điều kiện cộng dồn.</Typography><Button variant={autoBest?'primary':'outline'} onPress={()=>setAutoBest(!autoBest)}>{autoBest?'✓ Tự chọn tổ hợp tiết kiệm nhất':'Chọn mã thủ công'}</Button>
        {!autoBest&&<><TextInput accessibilityLabel="Mã voucher" placeholder="Nhập mã, cách nhau bằng dấu phẩy" value={manualCode} onChangeText={setManualCode} style={styles.noteInput}/><Button variant="outline" onPress={()=>setVoucherCodes(manualCode.split(',').map(c=>c.trim().toUpperCase()).filter(Boolean))}>Áp dụng mã đã nhập</Button><Button variant="ghost" onPress={()=>{setVoucherCodes([]);setManualCode('');}}>Bỏ các mã đã chọn</Button></>}
        {quote.isFetching&&<Typography variant="sm">Đang tính giá và kiểm tra lượt...</Typography>}{quote.isError&&<><Typography variant="sm" color="danger">{(quote.error as any)?.message||'Không tính được ưu đãi.'}</Typography><Button variant="outline" onPress={()=>quote.refetch()}>Tính lại</Button></>}
        {quote.data?.applied.map(a=><Typography key={a.id} variant="sm" weight="bold" color="deal">{a.code}: −{formatVND(a.amount)}</Typography>)}
        {quote.data?.vouchers.map(v=><View key={v.id} style={{paddingVertical:6,gap:4}}><Typography variant="sm" weight="semiBold">{v.code}</Typography><Typography variant="xs" color={v.eligible?'primaryDeep':'muted'}>{v.eligible?'Đủ điều kiện để chọn':v.reason}</Typography>{v.eligible&&<Button size="sm" variant="outline" onPress={()=>{setAutoBest(false);setVoucherCodes(current=>[...current.filter(code=>quote.data?.vouchers.find(c=>c.code===code)?.layer!==v.layer),v.code!]);}}>Chọn mã này</Button>}</View>)}
        </View>
        {/* Section 5: Order Note */}
        <View style={styles.card}>
          <Typography variant="md" weight="bold" style={{ marginBottom: spacing.xs }}>
            Ghi chú cho đơn hàng
          </Typography>
          <TextInput
            placeholder="Ví dụ: Giao giờ hành chính, gọi trước khi đến..."
            placeholderTextColor={COLORS.muted}
            value={orderNote}
            onChangeText={setOrderNote}
            style={styles.noteInput}
            multiline
          />
        </View>

        {quote.data&&<View style={styles.card}><Typography variant="sm">Giá hàng ban đầu: {formatVND(quote.data.originalSubtotal)}</Typography><Typography variant="sm" color="deal">Tiết kiệm flash sale: {formatVND(quote.data.flashSavings)}</Typography><Typography variant="sm" color="deal">Giảm mã shop/sàn: {formatVND(quote.data.discount)}</Typography><Typography variant="sm">Phí giao shop quy định: {formatVND(quote.data.shippingOriginal)}</Typography><Typography variant="sm" color="deal">Giảm vận chuyển: {formatVND(quote.data.shippingDiscount)}</Typography></View>}
        {/* Section 6: Payment Summary Breakdown */}
        <View style={styles.card}>
          <Typography variant="md" weight="bold" style={{ marginBottom: spacing.sm }}>
            Chi tiết thanh toán
          </Typography>
          <View style={styles.summaryRow}>
            <Typography variant="sm" color="inkSoft">
              Tiền hàng
            </Typography>
            <Typography variant="sm" weight="semiBold">
              {formatVND(subtotal)}
            </Typography>
          </View>

          {!!quote.data?.discount&&<View style={styles.summaryRow}><Typography variant="sm" color="inkSoft">Giảm mã shop / sàn</Typography><Typography variant="sm" weight="semiBold" color="deal">−{formatVND(quote.data.discount)}</Typography></View>}
          <View style={styles.summaryRow}>
            <Typography variant="sm" color="inkSoft">
              Thuế VAT (10%)
            </Typography>
            <Typography variant="sm" weight="semiBold">
              {formatVND(tax)}
            </Typography>
          </View>

          <View style={styles.summaryRow}>
            <Typography variant="sm" color="inkSoft">
              Phí vận chuyển
            </Typography>
            <Typography variant="sm" weight="semiBold" color="mintDeep">
              {formatVND(shippingFee)}
            </Typography>
          </View>

          <View style={styles.divider} />

          <View style={styles.summaryRow}>
            <Typography variant="md" weight="bold">
              Tổng sau ưu đãi
            </Typography>
            <Typography variant="lg" weight="bold" color="primaryDeep">
              {formatVND(total)}
            </Typography>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Action Bar */}
      <View style={styles.bottomBar}>
        <View>
          <Typography variant="xs" color="muted">
            Tạm tính
          </Typography>
          <Typography variant="lg" weight="bold" color="primaryDeep">
            {formatVND(total)}
          </Typography>
        </View>
        <Button
          title={createOrderMutation.isPending ? 'Đang xử lý...' : 'Đặt Hàng Ngay'}
          variant="primary"
          size="md"
          loading={createOrderMutation.isPending}
          disabled={!cart?.items || cart.items.length === 0||!quote.data||quote.isFetching||quote.isError}
          onPress={handlePlaceOrder}
          style={styles.placeOrderBtn}
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
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.bg,
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
    paddingBottom: 100,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  cardTitleWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addressBox: {
    marginTop: spacing.xs,
    padding: spacing.sm,
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: radius.md,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  itemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  itemImage: {
    width: 52,
    height: 52,
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  itemDetails: {
    flex: 1,
    marginLeft: spacing.md,
  },
  qtyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: radius.full,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  qtyBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyText: {
    paddingHorizontal: spacing.xs,
    minWidth: 20,
    textAlign: 'center',
  },
  emptyCartBox: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  paymentMethodOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: radius.md,
    marginBottom: spacing.xs,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  paymentMethodOptionSelected: {
    borderColor: COLORS.primaryDeep,
    backgroundColor: COLORS.primarySoft,
  },
  paymentLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  noteInput: {
    height: 54,
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: radius.md,
    padding: spacing.sm,
    fontFamily: typography.fontFamily.regular,
    fontSize: 13,
    color: COLORS.ink,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 4,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: spacing.sm,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.surface,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 8,
    shadowColor: COLORS.ink,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  placeOrderBtn: {
    minWidth: 140,
  },
});
