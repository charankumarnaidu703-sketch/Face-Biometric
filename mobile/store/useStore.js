import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

const useStore = create((set) => ({
  // Authentication states
  token: null,
  user: null,
  role: null,
  isInitialized: false, // Flag to check if stored auth has been restored on startup

  // Actions
  setAuth: async (token, user, role) => {
    set({ token, user, role });
    try {
      // Persist auth state to native SecureStore
      await SecureStore.setItemAsync('user_token', token);
      await SecureStore.setItemAsync('user_profile', JSON.stringify(user));
      await SecureStore.setItemAsync('user_role', role);
    } catch (e) {
      console.error('Failed to save secure auth state:', e);
    }
  },

  logout: async () => {
    set({ token: null, user: null, role: null });
    try {
      // Remove keys from SecureStore
      await SecureStore.deleteItemAsync('user_token');
      await SecureStore.deleteItemAsync('user_profile');
      await SecureStore.deleteItemAsync('user_role');
    } catch (e) {
      console.error('Failed to clear secure auth state:', e);
    }
  },

  // Call on app startup to restore session
  loadPersistedAuth: async () => {
    try {
      const token = await SecureStore.getItemAsync('user_token');
      const userStr = await SecureStore.getItemAsync('user_profile');
      const role = await SecureStore.getItemAsync('user_role');

      if (token && userStr && role) {
        set({ 
          token, 
          user: JSON.parse(userStr), 
          role, 
          isInitialized: true 
        });
      } else {
        set({ isInitialized: true });
      }
    } catch (e) {
      console.error('Failed to load persisted auth state:', e);
      set({ isInitialized: true });
    }
  }
}));

export default useStore;
