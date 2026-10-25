import React, { useState, useEffect } from 'react';
import { View, Text, Image, StyleSheet, ImageStyle, StyleProp, ViewStyle, ImageResizeMode } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../theme/colors';

/**
 * resolveImageUrl:
 * Chỉ nhận URL hợp lệ bắt đầu bằng http:// hoặc https://.
 * Tất cả đường dẫn tương đối (như /images/...) coi là không có ảnh (trả về null),
 * tuyệt đối không tự ý ghép host backend.
 */
export const resolveImageUrl = (url?: string | null): string | null => {
  if (!url) return null;
  const trimmed = url.trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }
  return null;
};

const PASTEL_PALETTE = [
  COLORS.lilac,
  COLORS.sky,
  COLORS.peach,
  COLORS.mint,
  COLORS.pink,
  COLORS.lemon,
];

export const getPastelColorByName = (name?: string | null): string => {
  if (!name) return PASTEL_PALETTE[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash << 5) - hash + name.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % PASTEL_PALETTE.length;
  return PASTEL_PALETTE[index];
};

export interface RemoteImageProps {
  sourceUrl?: string | null;
  name?: string | null;
  style?: StyleProp<ImageStyle>;
  containerStyle?: StyleProp<ViewStyle>;
  resizeMode?: ImageResizeMode;
  iconSize?: number;
}

const getInitials = (str?: string | null): string => {
  if (!str) return '';
  const words = str.trim().split(/\s+/);
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return str.slice(0, 2).toUpperCase();
};

export const RemoteImage: React.FC<RemoteImageProps> = ({
  sourceUrl,
  name,
  style,
  containerStyle,
  resizeMode = 'cover',
  iconSize = 28,
}) => {
  const [hasError, setHasError] = useState(false);
  const resolved = resolveImageUrl(sourceUrl);
  const pastelColor = getPastelColorByName(name);

  // Reset error state when sourceUrl changes
  useEffect(() => {
    setHasError(false);
  }, [sourceUrl]);

  if (!resolved || hasError) {
    const initials = getInitials(name);
    return (
      <View style={[styles.placeholder, { backgroundColor: pastelColor }, style as any, containerStyle]}>
        <Ionicons name="image-outline" size={iconSize} color={COLORS.inkSoft} />
        {initials.length > 0 && (
          <Text style={[styles.initials, { fontSize: Math.max(10, Math.floor(iconSize * 0.42)) }]}>
            {initials}
          </Text>
        )}
      </View>
    );
  }

  return (
    <Image
      source={{ uri: resolved }}
      style={style}
      resizeMode={resizeMode}
      onError={() => setHasError(true)}
    />
  );
};

const styles = StyleSheet.create({
  placeholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  initials: {
    fontFamily: 'PlusJakartaSans-Bold',
    color: COLORS.inkSoft,
    marginTop: 2,
    letterSpacing: 1,
  },
});

