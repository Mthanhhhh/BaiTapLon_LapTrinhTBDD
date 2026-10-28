import React, { useContext, useState } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthContext } from '../context/AuthContext';
import { Typography, Button, AuroraBackground } from '../components/ui';
import { RequireLoginView } from '../components/RequireLoginView';
import { COLORS, spacing, radius } from '../theme';
import { RootStackParamList } from '../navigation/AppNavigator';
import {
  useUserProfile,
  useUpdateProfile,
  useUserAddresses,
  useAddAddress,
  useDeleteAddress,
  useSetDefaultAddress,
} from '../hooks/useProfile';

export default function AccountScreen() {
  const { user, logout } = useContext(AuthContext);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  // Profile Query & Mutations
  const { data: profile } = useUserProfile();
  const updateProfileMutation = useUpdateProfile();
  const { data: addresses, isLoading: loadingAddresses } = useUserAddresses();
  const addAddressMutation = useAddAddress();
  const deleteAddressMutation = useDeleteAddress();
  const setDefaultAddressMutation = useSetDefaultAddress();

  // Edit Profile Modal
  const [profileModalVisible, setProfileModalVisible] = useState(false);
  const [editFullName, setEditFullName] = useState(profile?.fullName || user?.fullName || '');
  const [editPhone, setEditPhone] = useState(profile?.phone || '');

  // Address Manager Modal
  const [addressModalVisible, setAddressModalVisible] = useState(false);
  const [newAddressModalVisible, setNewAddressModalVisible] = useState(false);
  const [newFullName, setNewFullName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newStreet, setNewStreet] = useState('');
  const [newCity, setNewCity] = useState('');
  const [newCountry, setNewCountry] = useState('United States');
  const [newZip, setNewZip] = useState('');

  if (!user) {
    return (
      <RequireLoginView
        title="Tài khoản của bạn"
        description="Đăng nhập để quản lý hồ sơ cá nhân, theo dõi đơn hàng và nhiều tiện ích khác."
      />
    );
  }

  const handleLogout = async () => {
    const doLogout = async () => {
      try {
        await logout();
        navigation.navigate('Login');
      } catch (error) {
        console.error('Logout error', error);
      }
    };

    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.confirm) {
        if (window.confirm('Bạn có chắc chắn muốn đăng xuất không?')) {
          await doLogout();
        }
      } else {
        await doLogout();
      }
    } else {
      Alert.alert('Đăng xuất', 'Bạn có chắc chắn muốn đăng xuất?', [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Đăng xuất',
          style: 'destructive',
          onPress: doLogout,
        },
      ]);
    }
  };

  const getInitials = (name: string) => {
    return name ? name.charAt(0).toUpperCase() : 'U';
  };

  const handleSaveProfile = () => {
    updateProfileMutation.mutate(
      { fullName: editFullName.trim(), phone: editPhone.trim() },
      {
        onSuccess: () => {
          setProfileModalVisible(false);
          Alert.alert('Success', 'Profile updated successfully.');
        },
        onError: (err: any) => {
          Alert.alert('Error', err.response?.data?.message || 'Failed to update profile.');
        },
      }
    );
  };

  const handleAddNewAddress = () => {
    if (!newFullName || !newPhone || !newStreet || !newCity) {
      Alert.alert('Missing Fields', 'Please complete the recipient name, phone, street and city.');
      return;
    }

    addAddressMutation.mutate(
      {
        fullName: newFullName.trim(),
        phone: newPhone.trim(),
        street: newStreet.trim(),
        city: newCity.trim(),
        country: newCountry.trim(),
        zipCode: newZip.trim() || undefined,
        isDefault: !addresses || addresses.length === 0,
      },
      {
        onSuccess: () => {
          setNewAddressModalVisible(false);
          setNewFullName('');
          setNewPhone('');
          setNewStreet('');
          setNewCity('');
          setNewZip('');
          Alert.alert('Address Added', 'New delivery address has been saved.');
        },
        onError: (err: any) => {
          Alert.alert('Error', err.response?.data?.message || 'Failed to save address.');
        },
      }
    );
  };

  return (
    <View style={styles.container}>
      <AuroraBackground variant="header" headerHeight={260} palette="calm">
        <SafeAreaView style={styles.headerSafeArea}>
          <View style={styles.headerContent}>
            <View style={styles.avatarContainer}>
              <View style={styles.avatarPlaceholder}>
                <Typography variant="xxxl" weight="bold" color="primaryDeep">
                  {getInitials(profile?.fullName || user.fullName)}
                </Typography>
              </View>
            </View>
            <Typography variant="xl" weight="bold" color="ink" style={{ marginTop: spacing.sm }}>
              {profile?.fullName || user.fullName}
            </Typography>
            <Typography variant="sm" color="inkSoft">
              {profile?.email || user.email}
            </Typography>
          </View>
        </SafeAreaView>
      </AuroraBackground>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Main Menu Options */}
        <View style={styles.menuCard}>
          <MenuItem
            icon="person-outline"
            title="Chỉnh sửa thông tin"
            onPress={() => {
              setEditFullName(profile?.fullName || user.fullName);
              setEditPhone(profile?.phone || '');
              setProfileModalVisible(true);
            }}
          />
          <MenuItem
            icon="location-outline"
            title="Sổ địa chỉ nhận hàng"
            onPress={() => setAddressModalVisible(true)}
          />
          <MenuItem
            icon="receipt-outline"
            title="Lịch sử đơn hàng"
            onPress={() => navigation.navigate('Main', { screen: 'Orders' } as any)}
          />
          <MenuItem
            icon="card-outline"
            title="Phương thức thanh toán"
            onPress={() => Alert.alert('Phương thức thanh toán', 'Quản lý thẻ ngân hàng và ví điện tử của bạn.')}
          />
          <MenuItem
            icon="notifications-outline"
            title="Cài đặt thông báo"
            onPress={() => Alert.alert('Thông báo', 'Tính năng nhận thông báo ưu đãi đang được bật.')}
          />
          <MenuItem
            icon="log-out-outline"
            title="Đăng xuất"
            onPress={handleLogout}
            color={COLORS.danger}
            noBorder
          />
        </View>

        {/* Version info footer */}
        <View style={styles.footerInfo}>
          <Typography variant="xs" color="inkSoft">
            E-Shop Mobile • Phiên bản 2.4.0 (Bản dựng 2026)
          </Typography>
        </View>
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal
        visible={profileModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setProfileModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Typography variant="lg" weight="bold" color="ink">
                Chỉnh sửa thông tin
              </Typography>
              <TouchableOpacity onPress={() => setProfileModalVisible(false)}>
                <Ionicons name="close-circle" size={24} color={COLORS.inkSoft} />
              </TouchableOpacity>
            </View>

            <Typography variant="xs" weight="bold" color="inkSoft" style={{ marginTop: spacing.sm }}>
              HỌ VÀ TÊN
            </Typography>
            <TextInput
              style={styles.modalInput}
              value={editFullName}
              onChangeText={setEditFullName}
              placeholder="Nhập họ và tên"
              placeholderTextColor={COLORS.muted}
            />

            <Typography variant="xs" weight="bold" color="inkSoft" style={{ marginTop: spacing.sm }}>
              SỐ ĐIỆN THOẠI
            </Typography>
            <TextInput
              style={styles.modalInput}
              value={editPhone}
              onChangeText={setEditPhone}
              placeholder="0912 345 678"
              placeholderTextColor={COLORS.muted}
              keyboardType="phone-pad"
            />

            <Button
              variant="primary"
              size="md"
              fullWidth
              loading={updateProfileMutation.isPending}
              onPress={handleSaveProfile}
              style={{ marginTop: spacing.lg }}
            >
              Lưu thay đổi
            </Button>
          </View>
        </View>
      </Modal>

      {/* Address Book Modal */}
      <Modal
        visible={addressModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setAddressModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { maxHeight: '80%' }]}>
            <View style={styles.modalHeader}>
              <Typography variant="lg" weight="bold" color="ink">
                Sổ địa chỉ nhận hàng
              </Typography>
              <TouchableOpacity onPress={() => setAddressModalVisible(false)}>
                <Ionicons name="close-circle" size={24} color={COLORS.inkSoft} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {loadingAddresses ? (
                <ActivityIndicator size="small" color={COLORS.primaryDeep} style={{ margin: spacing.lg }} />
              ) : (
                addresses?.map((addr) => (
                  <View key={addr.id} style={styles.addressItemCard}>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Typography variant="sm" weight="bold" color="ink">
                          {addr.fullName}
                        </Typography>
                        {addr.isDefault && (
                          <View style={styles.defaultBadge}>
                            <Typography variant="xs" weight="bold" color="primaryDeep">
                              Mặc định
                            </Typography>
                          </View>
                        )}
                      </View>
                      <Typography variant="xs" color="inkSoft" style={{ marginTop: 2 }}>
                        {addr.phone}
                      </Typography>
                      <Typography variant="sm" color="ink" style={{ marginTop: 4 }}>
                        {addr.street}, {addr.city}, {addr.country}
                      </Typography>
                    </View>

                    <View style={styles.addrActions}>
                      {!addr.isDefault && (
                        <TouchableOpacity
                          style={styles.addrActionBtn}
                          onPress={() => setDefaultAddressMutation.mutate(addr.id)}
                        >
                          <Typography variant="xs" weight="bold" color="primaryDeep">
                            Mặc định
                          </Typography>
                        </TouchableOpacity>
                      )}
                      <TouchableOpacity
                        style={[styles.addrActionBtn, { marginLeft: spacing.xs }]}
                        onPress={() => deleteAddressMutation.mutate(addr.id)}
                      >
                        <Ionicons name="trash-outline" size={18} color={COLORS.danger} />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))
              )}

              <Button
                variant="outline"
                size="md"
                fullWidth
                onPress={() => setNewAddressModalVisible(true)}
                style={{ marginTop: spacing.md }}
              >
                + Thêm địa chỉ mới
              </Button>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Add New Address Modal */}
      <Modal
        visible={newAddressModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setNewAddressModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Typography variant="lg" weight="bold" color="ink">
                Thêm địa chỉ giao hàng
              </Typography>
              <TouchableOpacity onPress={() => setNewAddressModalVisible(false)}>
                <Ionicons name="close-circle" size={24} color={COLORS.inkSoft} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Typography variant="xs" weight="bold" color="inkSoft">
                TÊN NGƯỜI NHẬN
              </Typography>
              <TextInput
                style={styles.modalInput}
                value={newFullName}
                onChangeText={setNewFullName}
                placeholder="Họ và tên người nhận"
                placeholderTextColor={COLORS.muted}
              />

              <Typography variant="xs" weight="bold" color="inkSoft" style={{ marginTop: spacing.sm }}>
                SỐ ĐIỆN THOẠI
              </Typography>
              <TextInput
                style={styles.modalInput}
                value={newPhone}
                onChangeText={setNewPhone}
                placeholder="Số điện thoại nhận hàng"
                placeholderTextColor={COLORS.muted}
                keyboardType="phone-pad"
              />

              <Typography variant="xs" weight="bold" color="inkSoft" style={{ marginTop: spacing.sm }}>
                ĐỊA CHỈ NHÀ / TÊN ĐƯỜNG
              </Typography>
              <TextInput
                style={styles.modalInput}
                value={newStreet}
                onChangeText={setNewStreet}
                placeholder="Số nhà, tên đường, phường/xã"
                placeholderTextColor={COLORS.muted}
              />

              <Typography variant="xs" weight="bold" color="inkSoft" style={{ marginTop: spacing.sm }}>
                TỈNH / THÀNH PHỐ
              </Typography>
              <TextInput
                style={styles.modalInput}
                value={newCity}
                onChangeText={setNewCity}
                placeholder="Quận/Huyện, Tỉnh/Thành phố"
                placeholderTextColor={COLORS.muted}
              />

              <Typography variant="xs" weight="bold" color="inkSoft" style={{ marginTop: spacing.sm }}>
                QUỐC GIA
              </Typography>
              <TextInput
                style={styles.modalInput}
                value={newCountry}
                onChangeText={setNewCountry}
                placeholder="Việt Nam"
                placeholderTextColor={COLORS.muted}
              />

              <Button
                variant="primary"
                size="md"
                fullWidth
                loading={addAddressMutation.isPending}
                onPress={handleAddNewAddress}
                style={{ marginTop: spacing.lg, marginBottom: spacing.md }}
              >
                Lưu địa chỉ
              </Button>
              <TextInput
                style={styles.modalInput}
                value={newStreet}
                onChangeText={setNewStreet}
                placeholder="Street and apartment number"
                placeholderTextColor={COLORS.muted}
              />

              <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm }}>
                <View style={{ flex: 1 }}>
                  <Typography variant="xs" weight="bold" color="inkSoft">
                    CITY
                  </Typography>
                  <TextInput
                    style={styles.modalInput}
                    value={newCity}
                    onChangeText={setNewCity}
                    placeholder="City"
                    placeholderTextColor={COLORS.muted}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Typography variant="xs" weight="bold" color="inkSoft">
                    ZIP CODE
                  </Typography>
                  <TextInput
                    style={styles.modalInput}
                    value={newZip}
                    onChangeText={setNewZip}
                    placeholder="ZIP"
                    placeholderTextColor={COLORS.muted}
                  />
                </View>
              </View>

              <Button
                variant="primary"
                size="md"
                fullWidth
                loading={addAddressMutation.isPending}
                onPress={handleAddNewAddress}
                style={{ marginTop: spacing.lg }}
              >
                Save Address
              </Button>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const MenuItem = ({ icon, title, onPress, color = COLORS.ink, noBorder = false }: any) => (
  <TouchableOpacity
    style={[styles.menuItem, !noBorder && styles.menuItemBorder]}
    onPress={onPress}
  >
    <View style={styles.menuItemLeft}>
      <Ionicons name={icon} size={22} color={color} />
      <Typography variant="md" weight="medium" style={{ marginLeft: spacing.md, color }}>
        {title}
      </Typography>
    </View>
    <Ionicons name="chevron-forward" size={18} color={COLORS.muted} />
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
    justifyContent: 'center',
    paddingVertical: spacing.lg,
  },
  avatarContainer: {
    width: 84,
    height: 84,
    borderRadius: radius.full,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  avatarPlaceholder: {
    width: 76,
    height: 76,
    borderRadius: radius.full,
    backgroundColor: COLORS.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xl,
    marginTop: -24,
  },
  menuCard: {
    backgroundColor: COLORS.surface,
    borderRadius: radius.xl,
    paddingHorizontal: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
  },
  menuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerInfo: {
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.xl,
    gap: spacing.xs,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  modalInput: {
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    color: COLORS.ink,
    fontSize: 14,
    marginTop: 4,
  },
  addressItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surfaceAlt,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: spacing.sm,
  },
  defaultBadge: {
    backgroundColor: COLORS.primarySoft,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: radius.sm,
    marginLeft: spacing.xs,
  },
  addrActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addrActionBtn: {
    padding: spacing.xs,
  },
});
