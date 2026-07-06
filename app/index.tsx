import React, { useEffect, useRef } from 'react';
import { View, Animated, Image } from 'react-native';
import { useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';

// Keep the native splash screen visible while we render our custom one
SplashScreen.preventAutoHideAsync().catch(() => {});

export default function CustomSplashScreen() {
  const router = useRouter();
  const scaleValue = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Hide the native splash screen smoothly
    const hideNativeSplash = async () => {
      try {
        await SplashScreen.hideAsync();
      } catch {
        // Ignore errors
      }
    };

    hideNativeSplash();

    // Start the pulsing animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(scaleValue, {
          toValue: 1.05,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(scaleValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Redirect to the Welcome Screen after 2.5 seconds
    const timer = setTimeout(() => {
      router.replace('/welcome');
    }, 2500);

    return () => clearTimeout(timer);
  }, [router, scaleValue]);

  return (
    <View className="flex-1 bg-white items-center justify-center">
      <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
        <Image
          source={{ uri: 'https://res.cloudinary.com/dtr2wtoty/image/upload/v1781224243/logo_dore_um5fsr.png' }}
          className="w-48 h-48"
          resizeMode="contain"
        />
      </Animated.View>
    </View>
  );
}