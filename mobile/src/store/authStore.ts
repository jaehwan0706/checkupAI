import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

interface User {
  userId: number;
  name: string;
  email: string;
  gender?: string;
  birthDate?: string;
  isPremium?: boolean;
}

interface AuthState {
  token: string | null;
  user: User | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  setToken: (token: string) => Promise<void>;
  setUser: (user: User) => Promise<void>;
  logout: () => Promise<void>;
  loadFromStorage: () => Promise<void>;
}

function parseJwt(token: string) {
  try {
    const payload = token.split('.')[1];
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(base64));
  } catch {
    return null;
  }
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  isLoggedIn: false,
  isLoading: true,

  setToken: async (token: string) => {
    await SecureStore.setItemAsync('token', token);
    const payload = parseJwt(token);
    set({ token, isLoggedIn: true });
    if (payload) {
      const user: User = {
        userId: payload.sub || payload.userId,
        name: payload.name || '',
        email: payload.email || '',
      };
      await SecureStore.setItemAsync('user', JSON.stringify(user));
      set({ user });
    }
  },

  setUser: async (user: User) => {
    await SecureStore.setItemAsync('user', JSON.stringify(user));
    set({ user });
  },

  logout: async () => {
    await SecureStore.deleteItemAsync('token');
    await SecureStore.deleteItemAsync('user');
    set({ token: null, user: null, isLoggedIn: false });
  },

  loadFromStorage: async () => {
    try {
      const token = await SecureStore.getItemAsync('token');
      const userStr = await SecureStore.getItemAsync('user');
      if (token && userStr) {
        const user = JSON.parse(userStr);
        set({ token, user, isLoggedIn: true, isLoading: false });
      } else {
        set({ isLoading: false });
      }
    } catch {
      set({ isLoading: false });
    }
  },
}));
