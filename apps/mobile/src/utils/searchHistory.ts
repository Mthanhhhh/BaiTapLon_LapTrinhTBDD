import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const SEARCH_HISTORY_KEY = 'ESHOP_SEARCH_KEYWORDS_HISTORY';
const VIEWED_CATEGORIES_KEY = 'ESHOP_VIEWED_CATEGORIES_HISTORY';

// Memory fallback for environments without storage
let memoryKeywords: string[] = [];
let memoryCategories: number[] = [];

export const searchHistory = {
  /**
   * Lưu từ khóa tìm kiếm mới nhất vào đầu danh sách
   */
  async recordKeyword(rawKeyword: string): Promise<string[]> {
    if (!rawKeyword) return await this.getKeywords();
    const keyword = rawKeyword.trim().toLowerCase();
    if (!keyword || keyword.length < 2) return await this.getKeywords();

    const current = await this.getKeywords();
    // Loại bỏ từ trùng lặp và đưa lên đầu
    const updated = [keyword, ...current.filter((k) => k.toLowerCase() !== keyword)].slice(0, 10);

    await this._saveKeywords(updated);

    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('searchHistory:updated', { detail: updated }));
    }

    return updated;
  },

  /**
   * Lấy danh sách từ khóa đã tìm kiếm
   */
  async getKeywords(): Promise<string[]> {
    try {
      if (Platform.OS === 'web') {
        const raw = localStorage.getItem(SEARCH_HISTORY_KEY);
        return raw ? JSON.parse(raw) : memoryKeywords;
      } else {
        const raw = await SecureStore.getItemAsync(SEARCH_HISTORY_KEY);
        return raw ? JSON.parse(raw) : memoryKeywords;
      }
    } catch (e) {
      return memoryKeywords;
    }
  },

  /**
   * Xóa một từ khóa khỏi lịch sử
   */
  async removeKeyword(keywordToRemove: string): Promise<string[]> {
    const current = await this.getKeywords();
    const updated = current.filter((k) => k.toLowerCase() !== keywordToRemove.toLowerCase());
    await this._saveKeywords(updated);

    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('searchHistory:updated', { detail: updated }));
    }

    return updated;
  },

  /**
   * Xóa toàn bộ lịch sử tìm kiếm
   */
  async clearKeywords(): Promise<void> {
    memoryKeywords = [];
    try {
      if (Platform.OS === 'web') {
        localStorage.removeItem(SEARCH_HISTORY_KEY);
      } else {
        await SecureStore.deleteItemAsync(SEARCH_HISTORY_KEY);
      }
    } catch (e) {
      // ignore
    }

    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('searchHistory:updated', { detail: [] }));
    }
  },

  /**
   * Ghi nhận ID danh mục người dùng vừa xem
   */
  async recordViewedCategory(categoryId: number): Promise<void> {
    if (!categoryId) return;
    try {
      const current = await this.getViewedCategories();
      const updated = [categoryId, ...current.filter((c) => c !== categoryId)].slice(0, 5);
      memoryCategories = updated;

      if (Platform.OS === 'web') {
        localStorage.setItem(VIEWED_CATEGORIES_KEY, JSON.stringify(updated));
      } else {
        await SecureStore.setItemAsync(VIEWED_CATEGORIES_KEY, JSON.stringify(updated));
      }
    } catch (e) {
      // ignore
    }
  },

  /**
   * Lấy danh sách các danh mục người dùng đã xem gần đây
   */
  async getViewedCategories(): Promise<number[]> {
    try {
      if (Platform.OS === 'web') {
        const raw = localStorage.getItem(VIEWED_CATEGORIES_KEY);
        return raw ? JSON.parse(raw) : memoryCategories;
      } else {
        const raw = await SecureStore.getItemAsync(VIEWED_CATEGORIES_KEY);
        return raw ? JSON.parse(raw) : memoryCategories;
      }
    } catch (e) {
      return memoryCategories;
    }
  },

  async _saveKeywords(keywords: string[]): Promise<void> {
    memoryKeywords = keywords;
    try {
      if (Platform.OS === 'web') {
        localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(keywords));
      } else {
        await SecureStore.setItemAsync(SEARCH_HISTORY_KEY, JSON.stringify(keywords));
      }
    } catch (e) {
      // ignore
    }
  },
};

