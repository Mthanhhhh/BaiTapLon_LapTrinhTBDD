import { Platform } from 'react-native';

// These are public upload identifiers, not Cloudinary API secrets. Keep the
// provided project values as fallbacks so Expo works even when started before
// its .env file was loaded; deployments can override them at build time.
const cloudName = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME || 't4eozcyt';
const uploadPreset = process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'eshop_products';

export async function uploadImageToCloudinary(uri: string, fileName?: string | null): Promise<string> {
  if (!cloudName || !uploadPreset) {
    throw new Error('Thiếu cấu hình Cloudinary. Vui lòng cấu hình cloud name và upload preset.');
  }

  const form = new FormData();
  form.append('upload_preset', uploadPreset);

  if (Platform.OS === 'web') {
    const response = await fetch(uri);
    if (!response.ok) throw new Error('Không đọc được ảnh đã chọn.');
    const blob = await response.blob();
    form.append('file', blob, fileName || 'product-image');
  } else {
    const extension = uri.split('.').pop()?.toLowerCase() || 'jpg';
    form.append('file', {
      uri,
      name: fileName || `product-image.${extension}`,
      type: extension === 'png' ? 'image/png' : 'image/jpeg',
    } as any);
  }

  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: 'POST',
    body: form,
  });
  const result = await response.json();
  if (!response.ok || !result.secure_url) {
    throw new Error(result.error?.message || 'Không thể tải ảnh lên Cloudinary.');
  }
  return result.secure_url as string;
}
