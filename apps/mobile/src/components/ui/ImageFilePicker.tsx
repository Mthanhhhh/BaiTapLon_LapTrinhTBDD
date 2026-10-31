import React from 'react';
import { Image, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../theme';
import { Button, Typography } from './index';

export type LocalImage = { uri: string; name?: string | null };

export function ImageFilePicker({
  label,
  images,
  onChange,
  multiple = false,
}: {
  label: string;
  images: LocalImage[];
  onChange: (images: LocalImage[]) => void;
  multiple?: boolean;
}) {
  const choose = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: multiple,
      quality: 0.85,
    });
    if (result.canceled) return;
    const selected = result.assets.map(asset => ({ uri: asset.uri, name: asset.fileName }));
    onChange(multiple ? [...images, ...selected] : selected.slice(0, 1));
  };

  return <View style={styles.container}>
    <Button size="sm" variant="outline" onPress={choose}>{images.length ? 'Chọn ảnh khác' : label}</Button>
    {images.length > 0 && <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.images}>
      {images.map((image, index) => <View key={`${image.uri}-${index}`} style={styles.preview}>
        <Image source={{ uri: image.uri }} style={styles.image} />
        <TouchableOpacity accessibilityRole="button" accessibilityLabel="Xóa ảnh đã chọn" onPress={() => onChange(images.filter((_, i) => i !== index))} style={styles.remove}>
          <Ionicons name="close" size={14} color="#fff" />
        </TouchableOpacity>
      </View>)}
    </ScrollView>}
  </View>;
}

const styles = StyleSheet.create({ container: { gap: 8 }, images: { gap: 8 }, preview: { position: 'relative' }, image: { width: 72, height: 72, borderRadius: 8, backgroundColor: COLORS.surfaceAlt }, remove: { position: 'absolute', top: 3, right: 3, width: 22, height: 22, borderRadius: 11, backgroundColor: COLORS.ink, alignItems: 'center', justifyContent: 'center' } });
