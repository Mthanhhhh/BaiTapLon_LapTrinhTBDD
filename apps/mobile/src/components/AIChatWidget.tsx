import React, { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, radius } from '../theme';
import { Typography } from './ui';
import { RemoteImage } from './ui/RemoteImage';
import { apiClient } from '../api/client';
import { ProductListResponse } from '../hooks/useProducts';
import { formatVND } from '../utils/formatters';

type ChatMessage = { role: 'user' | 'assistant'; content: string; products?: ProductListResponse[] };

export default function AIChatWidget({ onProductPress }: { onProductPress: (id: number) => void }) {
  const [visible, setVisible] = useState(false);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [slowRequest, setSlowRequest] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([{ role: 'assistant', content: 'Chào bạn! Mình có thể tìm và so sánh sản phẩm, hướng dẫn dùng E-Shop, hoặc tra cứu đơn hàng, địa chỉ và shop thuộc tài khoản đang đăng nhập. Bạn cần hỗ trợ gì?' }]);

  const send = async (value = text) => {
    const message = value.trim();
    if (!message || sending) return;
    const previous = messages;
    setText(''); setMessages([...previous, { role: 'user', content: message }]); setSending(true);
    const slowRequestTimer = setTimeout(() => setSlowRequest(true), 8000);
    try {
      const { data } = await apiClient.post('/api/v1/ai/chat', {
        message,
        history: previous.slice(-8).map(({ role, content }) => ({ role, content })),
      });
      const result = data.data;
      setMessages(current => [...current, { role: 'assistant', content: result.answer, products: result.products || [] }]);
    } catch {
      setMessages(current => [...current, { role: 'assistant', content: 'Mình chưa kết nối được dịch vụ tư vấn lúc này. Bạn thử lại sau ít phút nhé.' }]);
    } finally { clearTimeout(slowRequestTimer); setSlowRequest(false); setSending(false); }
  };

  return <>
    <TouchableOpacity accessibilityRole="button" accessibilityLabel="Mở trợ lý mua sắm AI" onPress={() => setVisible(true)} style={styles.bubble}>
      <Ionicons name="sparkles" size={23} color="#fff" />
    </TouchableOpacity>
    <Modal visible={visible} animationType="slide" transparent onRequestClose={() => setVisible(false)}>
      <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.panel}>
          <View style={styles.header}>
            <View style={styles.titleIcon}><Ionicons name="sparkles" size={18} color={COLORS.primaryDeep} /></View>
            <View style={{ flex: 1 }}><Typography weight="bold">Trợ lý mua sắm</Typography><Typography variant="xs" color="inkSoft">Tìm sản phẩm và hướng dẫn E-Shop</Typography></View>
            <TouchableOpacity accessibilityRole="button" accessibilityLabel="Đóng chat" onPress={() => setVisible(false)}><Ionicons name="close" size={24} color={COLORS.ink} /></TouchableOpacity>
          </View>
          <ScrollView style={styles.messages} contentContainerStyle={{ gap: 12, paddingVertical: 14 }}>
            {messages.map((item, index) => <View key={index} style={[styles.message, item.role === 'user' ? styles.userMessage : styles.aiMessage]}>
              <Typography variant="sm">{item.content}</Typography>
              {!!item.products?.length && <View style={{ marginTop: 10, gap: 8 }}>{item.products.map(product => <TouchableOpacity key={product.id} style={styles.product} onPress={() => { setVisible(false); onProductPress(product.id); }}>
                <RemoteImage sourceUrl={product.thumbnailUrl} name={product.name} style={styles.productImage} />
                <View style={{ flex: 1 }}><Typography variant="xs" weight="semiBold" numberOfLines={1} ellipsizeMode="tail">{product.name}</Typography><Typography variant="xs" color="primaryDeep" weight="bold">{formatVND(product.price)}</Typography></View>
                <Ionicons name="chevron-forward" size={16} color={COLORS.muted} />
              </TouchableOpacity>)}</View>}
            </View>)}
            {sending && <View style={{ alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <ActivityIndicator color={COLORS.primaryDeep} />
              {slowRequest && <Typography variant="xs" color="inkSoft">Trợ lý đang xử lý, có thể mất đến 60 giây…</Typography>}
            </View>}
          </ScrollView>
          <View style={styles.suggestions}><TouchableOpacity style={styles.chip} onPress={() => send('Tìm điện thoại giúp tôi')}><Typography variant="xs" color="primaryDeep">Tìm điện thoại</Typography></TouchableOpacity><TouchableOpacity style={styles.chip} onPress={() => send('Gợi ý sản phẩm bán chạy')}><Typography variant="xs" color="primaryDeep">Gợi ý bán chạy</Typography></TouchableOpacity></View>
          <View style={styles.composer}><TextInput value={text} onChangeText={setText} onSubmitEditing={() => send()} placeholder="Hỏi về sản phẩm bạn cần..." maxLength={500} returnKeyType="send" style={styles.input} /><TouchableOpacity accessibilityRole="button" accessibilityLabel="Gửi tin nhắn" disabled={!text.trim() || sending} onPress={() => send()} style={[styles.send, (!text.trim() || sending) && { opacity: 0.5 }]}><Ionicons name="send" size={18} color="#fff" /></TouchableOpacity></View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  </>;
}

const styles = StyleSheet.create({
  bubble: { position: 'absolute', right: 16, bottom: 88, width: 50, height: 50, borderRadius: 25, backgroundColor: COLORS.primaryDeep, alignItems: 'center', justifyContent: 'center', elevation: 8, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 8, zIndex: 20 },
  overlay: { flex: 1, backgroundColor: 'rgba(20,25,40,0.42)', justifyContent: 'flex-end' },
  panel: { height: '82%', backgroundColor: COLORS.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, overflow: 'hidden' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 16, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  titleIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.primarySoft, alignItems: 'center', justifyContent: 'center' },
  messages: { flex: 1, paddingHorizontal: 14 },
  message: { maxWidth: '90%', borderRadius: 16, padding: 12 },
  aiMessage: { alignSelf: 'flex-start', backgroundColor: COLORS.surfaceAlt },
  userMessage: { alignSelf: 'flex-end', backgroundColor: COLORS.primarySoft },
  product: { flexDirection: 'row', alignItems: 'center', gap: 9, backgroundColor: COLORS.surface, padding: 8, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border },
  productImage: { width: 44, height: 44, borderRadius: 8 },
  suggestions: { flexDirection: 'row', gap: 8, paddingHorizontal: 12, paddingBottom: 10 },
  chip: { borderWidth: 1, borderColor: COLORS.border, borderRadius: radius.full, paddingHorizontal: 10, paddingVertical: 7 },
  composer: { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 8, borderTopWidth: 1, borderTopColor: COLORS.border },
  input: { flex: 1, minHeight: 44, maxHeight: 90, borderRadius: radius.full, backgroundColor: COLORS.surfaceAlt, paddingHorizontal: 15, color: COLORS.ink },
  send: { width: 42, height: 42, borderRadius: 21, backgroundColor: COLORS.primaryDeep, alignItems: 'center', justifyContent: 'center' },
});
