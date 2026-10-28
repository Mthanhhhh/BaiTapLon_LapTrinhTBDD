import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Modal,
  TextInput,
  Alert,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Typography, Button, Badge } from '../components/ui';
import { COLORS, spacing, radius } from '../theme';
import {
  useOrders,
  useConfirmOrder,
  useShipOrder,
  useReceiveOrder,
  useReturnOrder,
  useCancelOrder,
  useAutoConfirmSetting,
  useSubmitReview,
  ReviewRequest,
} from '../hooks/useOrders';
import { OrderResponse, OrderStatus } from '../hooks/useCart';
import { RootStackParamList } from '../navigation/AppNavigator';
import { formatVND } from '../utils/formatters';

type OrderTab =
  | 'ALL'
  | 'PENDING_PAYMENT'
  | 'WAITING_CONFIRMATION'
  | 'WAITING_PICKUP'
  | 'SHIPPING'
  | 'DELIVERED'
  | 'RETURNED'
  | 'CANCELLED';

const TABS: { id: OrderTab; label: string }[] = [
  { id: 'ALL', label: 'Tất cả' },
  { id: 'PENDING_PAYMENT', label: 'Chờ thanh toán' },
  { id: 'WAITING_CONFIRMATION', label: 'Chờ xác nhận' },
  { id: 'WAITING_PICKUP', label: 'Chờ lấy hàng' },
  { id: 'SHIPPING', label: 'Chờ giao hàng' },
  { id: 'DELIVERED', label: 'Đã giao' },
  { id: 'RETURNED', label: 'Trả hàng' },
  { id: 'CANCELLED', label: 'Đã hủy' },
];

export default function OrdersScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [activeTab, setActiveTab] = useState<OrderTab>('ALL');
  const [isShopView, setIsShopView] = useState(false);

  const { data, isLoading, refetch } = useOrders();
  const confirmOrderMutation = useConfirmOrder();
  const shipOrderMutation = useShipOrder();
  const receiveOrderMutation = useReceiveOrder();
  const returnOrderMutation = useReturnOrder();
  const cancelOrderMutation = useCancelOrder();
  const { autoConfirm, setAutoConfirm, isUpdating: isTogglingAuto } = useAutoConfirmSetting();
  const submitReviewMutation = useSubmitReview();

  // Review Modal State
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<OrderResponse | null>(null);
  const [reviewProductId, setReviewProductId] = useState<number | null>(null);
  const [reviewProductName, setReviewProductName] = useState<string>('');
  const [rating, setRating] = useState<number>(5);
  const [comment, setComment] = useState<string>('');
  const [selectedEmotion, setSelectedEmotion] = useState<'GOOD' | 'NEUTRAL' | 'BAD'>('GOOD');
  const [selectedTag, setSelectedTag] = useState<string>('GREAT_QUALITY');

  const orders = data?.content || [];

  const filteredOrders = orders.filter((order) => {
    if (activeTab === 'ALL') return true;
    if (activeTab === 'WAITING_PICKUP' && order.status === 'PAID') return true;
    return order.status === activeTab;
  });

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'PENDING_PAYMENT':
        return <Badge label="Chờ thanh toán" variant="warning" />;
      case 'WAITING_CONFIRMATION':
        return <Badge label="Chờ xác nhận" variant="warning" />;
      case 'WAITING_PICKUP':
      case 'PAID':
        return <Badge label="Chờ lấy hàng" variant="primary" />;
      case 'SHIPPING':
        return <Badge label="Đang giao hàng" variant="primary" />;
      case 'DELIVERED':
        return <Badge label="Đã giao hàng" variant="success" />;
      case 'RETURNED':
        return <Badge label="Trả hàng / Hoàn tiền" variant="danger" />;
      case 'CANCELLED':
        return <Badge label="Đã hủy" variant="default" />;
      default:
        return <Badge label={status} variant="default" />;
    }
  };

  const handleCancelOrder = (orderId: number) => {
    Alert.alert(
      'Hủy đơn hàng',
      'Bạn có chắc chắn muốn hủy đơn hàng này không?',
      [
        { text: 'Không', style: 'cancel' },
        {
          text: 'Đồng ý hủy',
          style: 'destructive',
          onPress: () => {
            cancelOrderMutation.mutate(orderId, {
              onSuccess: () => {
                Alert.alert('Thành công', 'Đơn hàng của bạn đã được hủy.');
              },
              onError: (err: any) => {
                Alert.alert('Lỗi', err.response?.data?.message || 'Hủy đơn hàng thất bại.');
              },
            });
          },
        },
      ]
    );
  };

  const handleConfirmOrder = (orderId: number) => {
    confirmOrderMutation.mutate(orderId, {
      onSuccess: () => {
        Alert.alert('Thành công', 'Đã xác nhận đơn hàng! Đơn đã chuyển sang "Chờ lấy hàng".');
      },
      onError: (err: any) => {
        Alert.alert('Lỗi', err.response?.data?.message || 'Không thể xác nhận đơn hàng.');
      },
    });
  };

  const handleShipOrder = (orderId: number) => {
    shipOrderMutation.mutate(orderId, {
      onSuccess: () => {
        Alert.alert('Thành công', 'Đã bàn giao đơn hàng cho đơn vị vận chuyển!');
      },
      onError: (err: any) => {
        Alert.alert('Lỗi', err.response?.data?.message || 'Không thể cập nhật giao hàng.');
      },
    });
  };

  const handleReceiveOrder = (orderId: number) => {
    Alert.alert(
      'Xác nhận đã nhận hàng',
      'Bạn đã nhận được kiện hàng này nguyên vẹn và hài lòng với sản phẩm?',
      [
        { text: 'Chưa nhận', style: 'cancel' },
        {
          text: 'Đã nhận được hàng',
          style: 'default',
          onPress: () => {
            receiveOrderMutation.mutate(orderId, {
              onSuccess: () => {
                Alert.alert('Hoàn thành', 'Cảm ơn bạn đã mua sắm! Hãy để lại đánh giá cho Shop nhé.');
              },
              onError: (err: any) => {
                Alert.alert('Lỗi', err.response?.data?.message || 'Không thể cập nhật trạng thái.');
              },
            });
          },
        },
      ]
    );
  };

  const handleReturnOrder = (orderId: number) => {
    Alert.alert(
      'Yêu cầu trả hàng / Hoàn tiền',
      'Bạn muốn yêu cầu trả hàng hoặc hoàn tiền cho đơn hàng này?',
      [
        { text: 'Hủy bỏ', style: 'cancel' },
        {
          text: 'Gửi yêu cầu',
          style: 'destructive',
          onPress: () => {
            returnOrderMutation.mutate(orderId, {
              onSuccess: () => {
                Alert.alert('Đã gửi yêu cầu', 'Yêu cầu trả hàng của bạn đã được gửi tới Shop.');
              },
              onError: (err: any) => {
                Alert.alert('Lỗi', err.response?.data?.message || 'Không thể gửi yêu cầu trả hàng.');
              },
            });
          },
        },
      ]
    );
  };

  const openReviewModal = (order: OrderResponse, item: any) => {
    setSelectedOrder(order);
    setReviewProductId(item.productId);
    setReviewProductName(item.productName);
    setRating(5);
    setComment('');
    setSelectedEmotion('GOOD');
    setSelectedTag('GREAT_QUALITY');
    setReviewModalVisible(true);
  };

  const handleSubmitReview = () => {
    if (!selectedOrder || !reviewProductId) return;

    const payload: ReviewRequest = {
      orderId: selectedOrder.id,
      rating,
      comment: comment.trim() || undefined,
      emotion: selectedEmotion,
      tags: [selectedTag],
    };

    submitReviewMutation.mutate(
      { productId: reviewProductId, payload },
      {
        onSuccess: () => {
          setReviewModalVisible(false);
          Alert.alert('Đánh giá thành công', 'Cảm ơn phản hồi thực tế của bạn!');
        },
        onError: (err: any) => {
          Alert.alert('Lỗi', err.response?.data?.message || 'Gửi đánh giá thất bại.');
        },
      }
    );
  };

  const renderOrderItem = ({ item }: { item: OrderResponse }) => {
    const isPendingPayment = item.status === 'PENDING_PAYMENT';
    const isWaitingConfirmation = item.status === 'WAITING_CONFIRMATION';
    const isWaitingPickup = item.status === 'WAITING_PICKUP' || item.status === 'PAID';
    const isShipping = item.status === 'SHIPPING';
    const isDelivered = item.status === 'DELIVERED';
    const isReturned = item.status === 'RETURNED';
    const isCancelled = item.status === 'CANCELLED';
    const firstProduct = item.items?.[0];

    return (
      <View style={styles.orderCard}>
        {/* Card Header */}
        <View style={styles.cardHeader}>
          <View style={styles.orderNumberRow}>
            <Ionicons name="receipt-outline" size={16} color={COLORS.primaryDeep} />
            <Typography variant="sm" weight="bold" color="ink" style={{ marginLeft: spacing.xs }}>
              #ORD-{item.id}
            </Typography>
          </View>
          {getStatusBadge(item.status)}
        </View>

        {/* Shipping info preview */}
        {item.shippingName && (
          <View style={styles.shippingPreviewRow}>
            <Ionicons name="location-outline" size={14} color={COLORS.inkSoft} style={{ marginRight: 4 }} />
            <Typography variant="xs" color="inkSoft" numberOfLines={1} style={{ flex: 1 }}>
              {item.shippingName} • {item.shippingPhone} ({item.shippingCity})
            </Typography>
          </View>
        )}

        {/* Product Items List */}
        <View style={styles.itemsContainer}>
          {item.items?.map((prod) => (
            <TouchableOpacity
              key={prod.id || `${item.id}-${prod.productId}`}
              style={styles.itemRow}
              activeOpacity={0.7}
              onPress={() => navigation.navigate('ProductDetail', { productId: prod.productId })}
            >
              <Image
                source={{
                  uri:
                    prod.productImage ||
                    'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&q=80',
                }}
                style={styles.productThumb}
              />
              <View style={styles.productInfo}>
                <Typography variant="sm" weight="semiBold" color="ink" numberOfLines={2}>
                  {prod.productName}
                </Typography>
                {prod.variantName && (
                  <Typography variant="xs" color="muted" style={{ marginTop: 2 }}>
                    Phân loại: {prod.variantName}
                  </Typography>
                )}
                <View style={styles.itemPriceQty}>
                  <Typography variant="sm" weight="bold" color="primaryDeep">
                    {formatVND(prod.price)}
                  </Typography>
                  <Typography variant="xs" color="inkSoft">
                    x{prod.quantity}
                  </Typography>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Card Summary Breakdown */}
        <View style={styles.cardSummary}>
          <View>
            <Typography variant="xs" color="inkSoft">
              {item.createdAt ? new Date(item.createdAt).toLocaleDateString('vi-VN') : 'Vừa xong'}
            </Typography>
            <Typography variant="xs" color="muted" style={{ marginTop: 2 }}>
              {item.paymentMethod === 'COD' ? 'Thanh toán khi nhận hàng (COD)' : 'Thanh toán trực tuyến'}
            </Typography>
          </View>
          <View style={styles.totalRow}>
            <Typography variant="sm" color="inkSoft" style={{ marginRight: spacing.xs }}>
              Tổng tiền ({item.items?.length || 1} sp):
            </Typography>
            <Typography variant="md" weight="bold" color="primaryDeep">
              {formatVND(item.total || 0)}
            </Typography>
          </View>
        </View>

        {/* Card Action Buttons: Tùy theo vai trò Shop hay Khách Mua */}
        <View style={styles.actionRow}>
          {isShopView ? (
            /* SHOP ACTIONS */
            <>
              {isWaitingConfirmation && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onPress={() => handleCancelOrder(item.id)}
                    loading={cancelOrderMutation.isPending}
                    style={styles.actionBtn}
                  >
                    Từ chối đơn
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onPress={() => handleConfirmOrder(item.id)}
                    loading={confirmOrderMutation.isPending}
                    style={[styles.actionBtn, { marginLeft: spacing.sm }]}
                  >
                    ✓ Xác nhận đơn
                  </Button>
                </>
              )}

              {isWaitingPickup && (
                <Button
                  variant="primary"
                  size="sm"
                  onPress={() => handleShipOrder(item.id)}
                  loading={shipOrderMutation.isPending}
                  style={styles.actionBtn}
                >
                  🚚 Giao cho vận chuyển
                </Button>
              )}

              {isShipping && (
                <Typography variant="xs" color="primaryDeep" weight="semiBold" style={{ fontStyle: 'italic' }}>
                  Đang giao hàng tới khách
                </Typography>
              )}

              {isDelivered && (
                <Typography variant="xs" color="mintDeep" weight="bold">
                  ✓ Giao thành công
                </Typography>
              )}

              {isReturned && (
                <Typography variant="xs" color="danger" weight="bold">
                  Đang xử lý trả hàng
                </Typography>
              )}

              {isCancelled && (
                <Typography variant="xs" color="muted">
                  Đơn đã hủy
                </Typography>
              )}
            </>
          ) : (
            /* BUYER ACTIONS */
            <>
              {isPendingPayment && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onPress={() => handleCancelOrder(item.id)}
                    loading={cancelOrderMutation.isPending}
                    style={styles.actionBtn}
                  >
                    Hủy đơn
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onPress={() =>
                      navigation.navigate('Payment', {
                        orderId: item.id,
                        total: item.total || 0,
                        orderNumber: `#ORD-${item.id}`,
                      })
                    }
                    style={[styles.actionBtn, { marginLeft: spacing.sm }]}
                  >
                    Thanh toán ngay
                  </Button>
                </>
              )}

              {isWaitingConfirmation && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onPress={() => handleCancelOrder(item.id)}
                    loading={cancelOrderMutation.isPending}
                    style={styles.actionBtn}
                  >
                    Hủy đơn hàng
                  </Button>
                  <Typography variant="xs" color="inkSoft" style={{ marginLeft: spacing.sm, fontStyle: 'italic' }}>
                    Đang đợi Shop xác nhận
                  </Typography>
                </>
              )}

              {isWaitingPickup && (
                <Typography variant="xs" color="primaryDeep" style={{ fontStyle: 'italic' }}>
                  Shop đang chuẩn bị hàng và đóng gói
                </Typography>
              )}

              {isShipping && (
                <Button
                  variant="primary"
                  size="sm"
                  onPress={() => handleReceiveOrder(item.id)}
                  loading={receiveOrderMutation.isPending}
                  style={styles.actionBtn}
                >
                  ✓ Đã nhận được hàng
                </Button>
              )}

              {isDelivered && (
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <Button
                    variant="outline"
                    size="sm"
                    onPress={() => handleReturnOrder(item.id)}
                    loading={returnOrderMutation.isPending}
                    style={styles.actionBtn}
                  >
                    Trả hàng / Hoàn tiền
                  </Button>
                  {firstProduct && (
                    <Button
                      variant="soft"
                      size="sm"
                      onPress={() => openReviewModal(item, firstProduct)}
                      style={styles.actionBtn}
                    >
                      Viết đánh giá
                    </Button>
                  )}
                </View>
              )}

              {isReturned && (
                <Typography variant="xs" color="danger" weight="medium">
                  Đã gửi yêu cầu trả hàng / hoàn tiền
                </Typography>
              )}

              {isCancelled && (
                <Typography variant="xs" color="muted">
                  Đơn hàng đã được hủy
                </Typography>
              )}
            </>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Screen Header */}
      <View style={styles.header}>
        <View>
          <Typography variant="xl" weight="bold" color="ink" role="heading" aria-level={1}>
            {isShopView ? 'Quản lý đơn hàng (Shop)' : 'Đơn hàng của tôi'}
          </Typography>
          <Typography variant="xs" color="inkSoft" style={{ marginTop: 2 }}>
            {isShopView ? 'Kênh Người Bán - TechZone Official' : 'Theo dõi trạng thái đơn hàng thực tế'}
          </Typography>
        </View>

        {/* Nút chuyển đổi giao diện Khách Mua <-> Kênh Shop */}
        <TouchableOpacity
          style={[styles.roleSwitchPill, isShopView && styles.roleSwitchPillActive]}
          activeOpacity={0.8}
          onPress={() => setIsShopView(!isShopView)}
        >
          <Ionicons
            name={isShopView ? 'storefront' : 'person-outline'}
            size={14}
            color={isShopView ? '#fff' : COLORS.primaryDeep}
            style={{ marginRight: 4 }}
          />
          <Typography
            variant="xs"
            weight="bold"
            style={{ color: isShopView ? '#fff' : COLORS.primaryDeep }}
          >
            {isShopView ? 'Kênh Shop' : 'Khách Mua'}
          </Typography>
        </TouchableOpacity>
      </View>

      {/* SHOP AUTO-CONFIRM BAR (Hiện khi ở Kênh Shop) */}
      {isShopView && (
        <View style={styles.shopAutoConfirmBar}>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="flash" size={16} color={COLORS.primaryDeep} style={{ marginRight: 6 }} />
              <Typography variant="sm" weight="bold" color="primaryDeep">
                Tự động xác nhận đơn hàng
              </Typography>
            </View>
            <Typography variant="xs" color="inkSoft" style={{ marginTop: 2 }}>
              {autoConfirm
                ? 'Đang bật: Đơn mới sẽ tự động duyệt sang "Chờ lấy hàng"'
                : 'Đang tắt: Shop cần nhấn "Xác nhận đơn" thủ công'}
            </Typography>
          </View>
          <TouchableOpacity
            style={[styles.switchToggle, autoConfirm && styles.switchToggleActive]}
            activeOpacity={0.8}
            disabled={isTogglingAuto}
            onPress={() => setAutoConfirm(!autoConfirm)}
          >
            <View style={[styles.switchThumb, autoConfirm && styles.switchThumbActive]} />
          </TouchableOpacity>
        </View>
      )}

      {/* Tabs Phân Loại Trạng Thái Đơn Hàng Chuẩn Shopee */}
      <View style={styles.tabContainer}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={TABS}
          keyExtractor={(t) => t.id}
          contentContainerStyle={styles.tabListContent}
          renderItem={({ item }) => {
            const isActive = activeTab === item.id;
            return (
              <TouchableOpacity
                style={[styles.tabButton, isActive && styles.tabButtonActive]}
                onPress={() => setActiveTab(item.id)}
                activeOpacity={0.7}
              >
                <Typography
                  variant="sm"
                  weight={isActive ? 'bold' : 'medium'}
                  color={isActive ? 'primaryDeep' : 'inkSoft'}
                >
                  {item.label}
                </Typography>
                {isActive && <View style={styles.tabIndicator} />}
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* Orders List */}
      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={COLORS.primaryDeep} />
        </View>
      ) : filteredOrders.length === 0 ? (
        <View style={styles.centerContainer}>
          <Ionicons name="receipt-outline" size={64} color={COLORS.muted} />
          <Typography variant="md" weight="semiBold" color="ink" style={{ marginTop: spacing.md }}>
            Chưa có đơn hàng nào
          </Typography>
          <Typography variant="sm" color="inkSoft" style={{ marginTop: spacing.xs, textAlign: 'center' }}>
            {activeTab === 'ALL'
              ? 'Chưa có đơn hàng thực tế nào trong mục này.'
              : `Hiện không có đơn hàng nào ở trạng thái "${TABS.find((t) => t.id === activeTab)?.label}".`}
          </Typography>
        </View>
      ) : (
        <FlatList
          data={filteredOrders}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderOrderItem}
          contentContainerStyle={styles.listContent}
          refreshing={isLoading}
          onRefresh={refetch}
        />
      )}

      {/* Write Review Modal */}
      <Modal
        visible={reviewModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setReviewModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Typography variant="lg" weight="bold" color="ink">
                Đánh giá sản phẩm
              </Typography>
              <TouchableOpacity onPress={() => setReviewModalVisible(false)}>
                <Ionicons name="close-circle" size={24} color={COLORS.inkSoft} />
              </TouchableOpacity>
            </View>

            <Typography variant="sm" weight="semiBold" color="inkSoft" numberOfLines={1}>
              {reviewProductName}
            </Typography>

            <ScrollView contentContainerStyle={styles.modalBody}>
              {/* Star Rating */}
              <Typography variant="xs" weight="bold" color="inkSoft" style={styles.sectionTitle}>
                ĐÁNH GIÁ SAO
              </Typography>
              <View style={styles.starRow}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <TouchableOpacity key={star} onPress={() => setRating(star)} activeOpacity={0.7}>
                    <Ionicons
                      name={star <= rating ? 'star' : 'star-outline'}
                      size={28}
                      color={star <= rating ? COLORS.star : COLORS.muted}
                      style={{ marginHorizontal: 4 }}
                    />
                  </TouchableOpacity>
                ))}
              </View>

              {/* Emotion Selector */}
              <Typography variant="xs" weight="bold" color="inkSoft" style={styles.sectionTitle}>
                CẢM NHẬN CHUNG
              </Typography>
              <View style={styles.chipRow}>
                {[
                  { id: 'GOOD', label: 'Hài lòng 😍' },
                  { id: 'NEUTRAL', label: 'Bình thường 😐' },
                  { id: 'BAD', label: 'Không hài lòng 😞' },
                ].map((emo) => {
                  const isSelected = selectedEmotion === emo.id;
                  return (
                    <TouchableOpacity
                      key={emo.id}
                      style={[styles.chip, isSelected && styles.chipActive]}
                      onPress={() => setSelectedEmotion(emo.id as any)}
                    >
                      <Typography
                        variant="xs"
                        weight={isSelected ? 'bold' : 'regular'}
                        color={isSelected ? 'surface' : 'ink'}
                      >
                        {emo.label}
                      </Typography>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Comment Input */}
              <Typography variant="xs" weight="bold" color="inkSoft" style={styles.sectionTitle}>
                NHẬN XÉT CHI TIẾT
              </Typography>
              <TextInput
                placeholder="Chia sẻ trải nghiệm thực tế của bạn về chất lượng và thời gian giao hàng..."
                placeholderTextColor={COLORS.muted}
                value={comment}
                onChangeText={setComment}
                multiline
                numberOfLines={3}
                style={styles.textArea}
              />

              {/* Submit Button */}
              <Button
                title={submitReviewMutation.isPending ? 'Đang gửi...' : 'Gửi Đánh Giá'}
                variant="primary"
                size="md"
                fullWidth
                loading={submitReviewMutation.isPending}
                onPress={handleSubmitReview}
                style={{ marginTop: spacing.md }}
              />
            </ScrollView>
          </View>
        </View>
      </Modal>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  roleSwitchPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceAlt,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: COLORS.lilac,
  },
  roleSwitchPillActive: {
    backgroundColor: COLORS.primaryDeep,
    borderColor: COLORS.primaryDeep,
  },
  shopAutoConfirmBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.primarySoft,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  switchToggle: {
    width: 48,
    height: 26,
    borderRadius: 13,
    backgroundColor: COLORS.border,
    padding: 2,
    justifyContent: 'center',
  },
  switchToggleActive: {
    backgroundColor: COLORS.primaryDeep,
  },
  switchThumb: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#fff',
  },
  switchThumbActive: {
    transform: [{ translateX: 22 }],
  },
  tabContainer: {
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  tabListContent: {
    paddingHorizontal: spacing.sm,
  },
  tabButton: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    alignItems: 'center',
    position: 'relative',
  },
  tabButtonActive: {},
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    height: 2.5,
    width: '80%',
    backgroundColor: COLORS.primaryDeep,
    borderRadius: 2,
  },
  listContent: {
    padding: spacing.md,
    gap: spacing.md,
  },
  orderCard: {
    backgroundColor: COLORS.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.ink,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0,
    shadowRadius: 3,
    elevation: 0,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  orderNumberRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  shippingPreviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surfaceAlt,
  },
  itemsContainer: {
    paddingVertical: spacing.sm,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  productThumb: {
    width: 52,
    height: 52,
    borderRadius: radius.sm,
    backgroundColor: COLORS.surfaceAlt,
  },
  productInfo: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  itemPriceQty: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  cardSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingTop: spacing.sm,
    marginTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: COLORS.surfaceAlt,
  },
  actionBtn: {
    minWidth: 100,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
  },
  modalCard: {
    width: '100%',
    maxWidth: 480,
    backgroundColor: COLORS.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  modalBody: {
    marginTop: spacing.sm,
  },
  sectionTitle: {
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  starRow: {
    flexDirection: 'row',
    marginVertical: spacing.xs,
  },
  chipRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    flexWrap: 'wrap',
  },
  chip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surfaceAlt,
  },
  chipActive: {
    backgroundColor: COLORS.primaryDeep,
    borderColor: COLORS.primaryDeep,
  },
  textArea: {
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: radius.md,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    minHeight: 70,
    textAlignVertical: 'top',
  },
});
