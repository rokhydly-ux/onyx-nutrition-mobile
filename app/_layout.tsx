import { View, Image, Animated } from "react-native";
import { useRef } from "react";
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
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

  useEffect(() => {
    if (fontsLoaded || error) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, error]);



  const x = useRef(new Animated.Value(0)).current;
  const y = useRef(new Animated.Value(0)).current;

  // Since we don't have reanimated gyro easily setup for Playwright,
  // we will just do a slow floating parallax animation with standard Animated
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(y, { toValue: -15, duration: 4000, useNativeDriver: true }),
        Animated.timing(y, { toValue: 15, duration: 4000, useNativeDriver: true }),
        Animated.timing(y, { toValue: 0, duration: 4000, useNativeDriver: true })
      ])
    ).start();
  }, []);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <View className="flex-1 bg-white dark:bg-zinc-900">
        <View className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-[#39FF14]/10 blur-3xl" pointerEvents="none" />
        <View className="absolute top-1/2 -left-20 w-72 h-72 rounded-full bg-[#39FF14]/5 blur-3xl" pointerEvents="none" />

        <Animated.View style={{ position: 'absolute', inset: 0, transform: [{ translateY: y }] }} pointerEvents="none">
          <View className="absolute top-[10%] left-[10%] opacity-15 dark:opacity-10">
             <Image source={{uri: 'https://res.cloudinary.com/dtr2wtoty/image/upload/v1782675091/sauce_gmyero.png'}} style={{width: 60, height: 60, tintColor: colorScheme === 'dark' ? 'white' : '#39FF14'}} />
          </View>
          <View className="absolute top-[40%] right-[15%] opacity-15 dark:opacity-10">
             <Image source={{uri: 'https://res.cloudinary.com/dtr2wtoty/image/upload/v1782675042/2_maewiy.png'}} style={{width: 50, height: 50, tintColor: colorScheme === 'dark' ? 'white' : '#39FF14'}} />
          </View>
          <View className="absolute bottom-[20%] left-[20%] opacity-15 dark:opacity-10">
             <Image source={{uri: 'https://res.cloudinary.com/dtr2wtoty/image/upload/v1782675093/3_topvyj.png'}} style={{width: 70, height: 70, tintColor: colorScheme === 'dark' ? 'white' : '#39FF14'}} />
          </View>
        </Animated.View>

        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: 'transparent' } }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="welcome" />
          <Stack.Screen name="login" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal', headerShown: true }} />
        </Stack>
      </View>
      <StatusBar style="auto" />
    </ThemeProvider>
  );}
