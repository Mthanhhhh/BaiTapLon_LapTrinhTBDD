import {provinceLabel} from '../utils/vietnamShipping';
import { MarketplaceHeader } from '../components/MarketplaceHeader';
import { useOrders } from '../hooks/useOrders';
import { appAlert } from '../utils/appAlert';
import { useShop, useOpenShop } from '../hooks/useShop';
import React, { useContext, useState } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
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
import { STRINGS } from '../constants/strings';
import {
  useUserProfile,
  useUpdateProfile,
  useUserAddresses,
  useAddAddress,
  useDeleteAddress,
  useSetDefaultAddress,
} from '../hooks/useProfile';

const addressFieldNames: Record<string, string> = {
  fullName: 'Tên người nhận',
  phone: 'Số điện thoại',
  street: 'Địa chỉ nhà/tên đường',
  city: 'Tỉnh/thành phố',
  state: 'Quận/huyện',
  country: 'Quốc gia',
};

const getAddressSaveError = (error: any) => {
  const fieldErrors = error?.fieldErrors as Record<string, string> | undefined;
  const firstFieldError = fieldErrors && Object.entries(fieldErrors)[0];
  if (firstFieldError) {
    const [field, message] = firstFieldError;
    const label = addressFieldNames[field] || field;
    if (/blank|empty|required/i.test(message)) return `Vui lòng nhập ${label.toLowerCase()}.`;
    return `${label}: ${message}`;
  }

  if (error?.status === 401) return 'Phiên đăng nhập đã hết hạn. Hãy đăng nhập lại rồi thử lưu địa chỉ.';
  if (error?.status === 403) return 'Tài khoản hiện không có quyền lưu địa chỉ.';
  if (error?.code === 'NETWORK_ERROR') return 'Không kết nối được máy chủ. Kiểm tra mạng và thử lại.';
  if (error?.code === 'CONFLICT') return 'Địa chỉ này đang bị trùng hoặc không thể lưu.';
  if (error?.message && error.message !== 'An unexpected error occurred') return error.message;
  return 'Máy chủ chưa lưu được địa chỉ. Vui lòng kiểm tra thông tin và thử lại.';
};

export default function AccountScreen() {
  const { user, logout } = useContext(AuthContext);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const { data: shop } = useShop();
  const openShop = useOpenShop();
  const orders = useOrders(0,100);

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
  const [newState, setNewState] = useState('');
  const [newCountry, setNewCountry] = useState('Việt Nam');
  const [newZip, setNewZip] = useState('');
  const [addressError, setAddressError] = useState('');

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
      appAlert.alert('Đăng xuất', 'Bạn có chắc chắn muốn đăng xuất?', [
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
          appAlert.alert('Success', 'Profile updated successfully.');
        },
        onError: (err: any) => {
          appAlert.alert('Error', err.response?.data?.message || 'Failed to update profile.');
        },
      }
    );
  };

  const handleAddNewAddress = () => {
    const missingField = [
      [newFullName, 'tên người nhận'],
      [newPhone, 'số điện thoại'],
      [newStreet, 'địa chỉ nhà hoặc tên đường'],
      [newCity, 'tỉnh/thành phố'],
      [newState, 'quận/huyện'],
      [newCountry, 'quốc gia'],
    ].find(([value]) => !String(value).trim());
    if (missingField) {
      setAddressError(`Vui lòng nhập ${missingField[1]}.`);
      return;
    }
    setAddressError('');

    addAddressMutation.mutate(
      {
        fullName: newFullName.trim(),
        phone: newPhone.trim(),
        street: newStreet.trim(),
        city: provinceLabel(newCity),
        state: newState.trim(),
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
          setNewState('');
          setNewZip('');
          setAddressError('');
          appAlert.alert('Address Added', 'New delivery address has been saved.');
        },
        onError: (err: any) => {
          setAddressError(getAddressSaveError(err));
        },
      }
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <MarketplaceHeader title="Tài khoản" />
      <ScrollView contentContainerStyle={[styles.scrollContent,{paddingTop:8,gap:8}]}>
        <View style={{backgroundColor:COLORS.primarySoft,borderRadius:18,padding:16,gap:16,borderWidth:1,borderColor:COLORS.border}}>
          <View style={{flexDirection:'row',gap:12,alignItems:'center'}}>
            <View style={{width:60,height:60,borderRadius:30,backgroundColor:COLORS.surface,alignItems:'center',justifyContent:'center'}}><Typography variant="xxl" weight="bold" color="primaryDeep">{getInitials(profile?.fullName||user.fullName)}</Typography></View>
            <View style={{flex:1,gap:4}}><Typography variant="lg" weight="bold">{profile?.fullName||user.fullName}</Typography><Typography variant="xs" color="inkSoft" numberOfLines={1}>{profile?.email||user.email}</Typography><Typography variant="xs" color="primaryDeep">{shop?'Người mua · Chủ shop':'Tài khoản mua sắm'}</Typography></View>
            <TouchableOpacity accessibilityRole="button" accessibilityLabel="Sửa hồ sơ" onPress={()=>{setEditFullName(profile?.fullName||user.fullName);setEditPhone(profile?.phone||'');setProfileModalVisible(true);}}><Ionicons name="settings-outline" size={24} color={COLORS.primaryDeep}/></TouchableOpacity>
          </View>
          <TouchableOpacity accessibilityRole="button" onPress={()=>shop?navigation.navigate('Shop',{shopId:shop.id}):openShop.mutate(`${user.fullName} Shop`,{onError:(e:any)=>appAlert.alert('Không thể mở shop',e.message)})} style={{flexDirection:'row',alignItems:'center',gap:8,paddingTop:12,borderTopWidth:1,borderColor:COLORS.border}}><Ionicons name="storefront-outline" size={20} color={COLORS.primaryDeep}/><Typography variant="sm" weight="bold" style={{flex:1}}>{shop?`Quản lý ${shop.name}`:'Mở shop và bắt đầu bán hàng'}</Typography><Ionicons name="chevron-forward" size={18} color={COLORS.primaryDeep}/></TouchableOpacity>
        </View>
        <View style={[styles.menuCard,{padding:14,gap:18}]}>
          <View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between'}}><Typography weight="bold">Đơn mua</Typography><TouchableOpacity accessibilityRole="button" onPress={()=>navigation.navigate('Main',{screen:'Orders',params:{status:'ALL'}})}><Typography variant="xs" color="inkSoft">Lịch sử mua hàng ›</Typography></TouchableOpacity></View>
          <View style={{flexDirection:'row',justifyContent:'space-between'}}>{([
            ['WAITING_CONFIRMATION','Chờ xác nhận','wallet-outline'],['WAITING_PICKUP','Chờ lấy hàng','cube-outline'],['SHIPPING','Đang giao','car-outline'],['DELIVERED','Đã nhận','star-outline']
          ] as const).map(([status,label,icon])=>{const count=orders.data?.last?orders.data.content.filter(o=>o.status===status||(status==='WAITING_PICKUP'&&o.status==='PAID')).length:undefined;return <TouchableOpacity key={status} accessibilityRole="button" onPress={()=>navigation.navigate('Main',{screen:'Orders',params:{status}})} style={{alignItems:'center',gap:8,width:'24%'}}><View><Ionicons name={icon} size={27} color={COLORS.primaryDeep}/>{!!count&&<View style={{position:'absolute',top:-6,right:-10,paddingHorizontal:4,borderRadius:9,backgroundColor:COLORS.deal}}><Typography variant="xs" color="surface">{count}</Typography></View>}</View><Typography variant="xs" align="center">{label}</Typography></TouchableOpacity>})}</View>
        </View>
        <Typography variant="lg" weight="bold">Tiện ích của tôi</Typography>
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
          <MenuItem icon="storefront-outline" title={shop ? `Quản lý shop: ${shop.name}` : 'Mở shop của tôi'}
            onPress={() => {
              if (shop) navigation.navigate('Shop', { shopId: shop.id });
              else openShop.mutate(`${user.fullName} Shop`, { onError: (err: any) => appAlert.alert('Không thể mở shop', err.message) });
            }} />
          <MenuItem
            icon="receipt-outline"
            title="Lịch sử đơn hàng"
            onPress={() => navigation.navigate('Main', { screen: 'Orders', params:{status:'ALL'} })}
          />
          <MenuItem
            icon="card-outline"
            title="Đơn chờ thanh toán"
            onPress={() => navigation.navigate('Main',{screen:'Orders',params:{status:'PENDING_PAYMENT'}})}
          />
          <MenuItem
            icon="notifications-outline"
            title="Thông báo của tôi"
            onPress={() => navigation.navigate('Main',{screen:'Notifications'})}
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
                        {[addr.street, addr.state, provinceLabel(addr.city), addr.country].filter(Boolean).join(', ')}
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
                onPress={() => { setAddressError(''); setNewAddressModalVisible(true); }}
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

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <Typography variant="xs" weight="bold" color="inkSoft">TÊN NGƯỜI NHẬN</Typography>
              <TextInput style={styles.modalInput} value={newFullName} onChangeText={(value) => { setNewFullName(value); setAddressError(''); }} placeholder="Họ và tên người nhận" placeholderTextColor={COLORS.muted} />

              <Typography variant="xs" weight="bold" color="inkSoft" style={{ marginTop: spacing.sm }}>SỐ ĐIỆN THOẠI</Typography>
              <TextInput style={styles.modalInput} value={newPhone} onChangeText={(value) => { setNewPhone(value); setAddressError(''); }} placeholder="Số điện thoại nhận hàng" placeholderTextColor={COLORS.muted} keyboardType="phone-pad" />

              <Typography variant="xs" weight="bold" color="inkSoft" style={{ marginTop: spacing.sm }}>ĐỊA CHỈ NHÀ / TÊN ĐƯỜNG</Typography>
              <TextInput style={styles.modalInput} value={newStreet} onChangeText={(value) => { setNewStreet(value); setAddressError(''); }} placeholder="Số nhà, tên đường, phường/xã" placeholderTextColor={COLORS.muted} />

              <Typography variant="xs" weight="bold" color="inkSoft" style={{ marginTop: spacing.sm }}>QUẬN / HUYỆN</Typography>
              <TextInput style={styles.modalInput} value={newState} onChangeText={(value) => { setNewState(value); setAddressError(''); }} placeholder="Ví dụ: Quận 1" placeholderTextColor={COLORS.muted} />

              <Typography variant="xs" weight="bold" color="inkSoft" style={{ marginTop: spacing.sm }}>TỈNH / THÀNH PHỐ</Typography>
              <TextInput style={styles.modalInput} value={newCity} onChangeText={(value) => { setNewCity(value); setAddressError(''); }} placeholder="Ví dụ: Hồ Chí Minh" placeholderTextColor={COLORS.muted} />

              <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm }}>
                <View style={{ flex: 1 }}>
                  <Typography variant="xs" weight="bold" color="inkSoft">QUỐC GIA</Typography>
                  <TextInput style={styles.modalInput} value={newCountry} onChangeText={(value) => { setNewCountry(value); setAddressError(''); }} placeholder="Việt Nam" placeholderTextColor={COLORS.muted} />
                </View>
                <View style={{ flex: 1 }}>
                  <Typography variant="xs" weight="bold" color="inkSoft">MÃ BƯU CHÍNH (KHÔNG BẮT BUỘC)</Typography>
                  <TextInput style={styles.modalInput} value={newZip} onChangeText={(value) => { setNewZip(value); setAddressError(''); }} placeholder="Mã bưu chính" placeholderTextColor={COLORS.muted} />
                </View>
              </View>

              {addressError ? (
                <View style={styles.addressErrorBox} accessibilityRole="alert">
                  <Ionicons name="alert-circle" size={16} color={COLORS.danger} />
                  <Typography variant="xs" color={COLORS.danger} style={styles.addressErrorText} numberOfLines={2}>
                    {addressError}
                  </Typography>
                </View>
              ) : null}

              <Button
                variant="primary"
                size="md"
                fullWidth
                loading={addAddressMutation.isPending}
                disabled={addAddressMutation.isPending}
                onPress={handleAddNewAddress}
                style={{ marginTop: spacing.md, marginBottom: spacing.md }}
              >
                Lưu địa chỉ
              </Button>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
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
    backgroundColor: 'transparent',
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
    shadowOpacity: 0,
    shadowRadius: 10,
    elevation: 0,
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
    marginTop: 0,
  },
  menuCard: {
    backgroundColor: COLORS.surface,
    borderRadius: radius.xl,
    paddingHorizontal: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0,
    shadowRadius: 12,
    elevation: 0,
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
  addressErrorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.dangerSoft,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    marginTop: spacing.md,
  },
  addressErrorText: {
    flex: 1,
    marginLeft: spacing.xs,
    color: COLORS.danger,
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
