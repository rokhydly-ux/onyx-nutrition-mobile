import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://placeholder-url.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

// Only create a dummy storage if on web and window is not defined (for static rendering)
const customStorage = Platform.OS === 'web'
  ? (typeof window !== 'undefined'
      ? window.localStorage
      : {
          getItem: () => Promise.resolve(null),
          setItem: () => Promise.resolve(),
          removeItem: () => Promise.resolve()
        } as any)
  : AsyncStorage;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: customStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
