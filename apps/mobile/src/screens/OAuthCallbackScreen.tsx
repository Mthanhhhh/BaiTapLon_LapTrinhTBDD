import React from 'react';
import {View} from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import {Typography} from '../components/ui';
WebBrowser.maybeCompleteAuthSession();
export default function OAuthCallbackScreen(){return <View style={{flex:1,padding:24,justifyContent:'center',gap:12}}><Typography weight="bold">Đang hoàn tất đăng nhập</Typography><Typography variant="sm">Bạn có thể quay lại cửa sổ E-Shop đã bắt đầu đăng nhập. Nếu cửa sổ đó đã đóng, hãy bắt đầu lại từ trang đăng nhập.</Typography></View>;}
