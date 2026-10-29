import { Alert, AlertButton, AlertOptions, Platform } from 'react-native';
// React Native Web does not implement native Alert buttons.
export const appAlert = {
  alert(title: string, message?: string, buttons?: AlertButton[], options?: AlertOptions) {
    if (Platform.OS !== 'web') return Alert.alert(title, message, buttons, options);
    if (typeof window === 'undefined') return;
    const text = [title, message].filter(Boolean).join('\n\n');
    const action = buttons?.find(b => b.style !== 'cancel' && b.onPress);
    if (action) {
      if (window.confirm(text)) action.onPress?.();
      else buttons?.find(b => b.style === 'cancel')?.onPress?.();
    } else window.alert(text);
  },
};
