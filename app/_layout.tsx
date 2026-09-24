import { View, Image, Animated } from "react-native";
import { useRef , useEffect } from "react";
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import '../global.css';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import {
  useFonts,
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
  Poppins_800ExtraBold,
  Poppins_900Black,
} from '@expo-google-fonts/poppins';
import * as SplashScreen from 'expo-splash-screen';
import { supabase } from '@/lib/supabase';
import { useMenuStore, useProfileStore } from '@/lib/store';

export const unstable_settings = {
  anchor: '(tabs)',
};

// Prevent auto hiding splash screen
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();

  const [fontsLoaded, error] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
    Poppins_800ExtraBold,
    Poppins_900Black,
  });

  const x = useRef(new Animated.Value(0)).current;
  const y = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(y, { toValue: -15, duration: 4000, useNativeDriver: true }),
        Animated.timing(y, { toValue: 15, duration: 4000, useNativeDriver: true }),
        Animated.timing(y, { toValue: 0, duration: 4000, useNativeDriver: true })
      ])
    ).start();
  }, []);

  useEffect(() => {
    if (fontsLoaded || error) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, error]);

  useEffect(() => {
    let globalChannel: ReturnType<typeof supabase.channel> | null = null;

    const setupRealtime = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData?.session?.user?.id;

      if (!userId) return;

      globalChannel = supabase.channel('custom-all-channel');

      globalChannel
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'nutrition_profiles', filter: `client_id=eq.${userId}` },
          (payload: any) => {
            console.log('Profile updated via realtime:', payload);
            if (payload.new) {
              const profileStore = useProfileStore.getState();
              profileStore.setProfileData({
                weight: payload.new.weight !== undefined ? payload.new.weight : profileStore.weight,
                target_weight: payload.new.target_weight !== undefined ? payload.new.target_weight : profileStore.target_weight,
                height: payload.new.height !== undefined ? payload.new.height : profileStore.height,
                daily_calories: payload.new.daily_calorie_goal !== undefined ? payload.new.daily_calorie_goal : profileStore.daily_calories,
              });
            }
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'nutrition_daily_logs', filter: `client_id=eq.${userId}` },
          (payload: any) => {
            console.log('Daily logs updated via realtime:', payload);

            // Sync water logs to useMenuStore's dailyMacros if they exist
            if (payload.new && typeof payload.new.water_glasses === 'number') {
              const currentMacros = useMenuStore.getState().dailyMacros;
              useMenuStore.getState().setDailyMacros({
                ...currentMacros,
                water: payload.new.water_glasses
              });
            }

            // Sync consumed calories if present (depends on how logs update calories_consumed)
            if (payload.new && typeof payload.new.calories_consumed === 'number') {
              const currentMacros = useMenuStore.getState().dailyMacros;
              useMenuStore.getState().setDailyMacros({
                ...currentMacros,
                calories: payload.new.calories_consumed
              });
            }
          }
        )
        .subscribe();
    };

    setupRealtime();

    return () => {
      if (globalChannel) {
        supabase.removeChannel(globalChannel);
      }
    };
  }, []);

  if (!fontsLoaded && !error) {
    return null;
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>


      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: 'white' } }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="welcome" />
        <Stack.Screen name="login" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal', headerShown: true }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );}
