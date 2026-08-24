import { Tabs } from 'expo-router';
import { BlurView } from 'expo-blur';
import { StyleSheet, View, SafeAreaView, Animated } from 'react-native';
import { Home, Calendar, Utensils, Users, User, ShoppingBag, Package } from 'lucide-react-native';
import React, { useRef, useEffect } from 'react';

import { useColorScheme, Text } from 'react-native';
import GlobalHeader from '../../components/GlobalHeader';
import { useShopStore } from '../../lib/store';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const shopCart = useShopStore((state) => state.shopCart);
  const cartCount = shopCart.reduce((acc, item) => acc + item.quantity, 0);

  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.2,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [scaleAnim]);


  return (
    <View style={{ flex: 1 }}>
      <SafeAreaView>
        <GlobalHeader />
      </SafeAreaView>
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colorScheme === 'dark' ? '#39FF14' : '#000000',
        tabBarInactiveTintColor: colorScheme === 'dark' ? '#9CA3AF' : '#6B7280',
        tabBarStyle: {
          position: 'absolute',
          bottom: 16,
          left: 16,
          right: 16,
          height: 70,
          borderRadius: 24,
          elevation: 0,
          backgroundColor: 'transparent',
          borderTopWidth: 0,
        },
        tabBarBackground: () => (
          <BlurView
            tint={colorScheme === 'dark' ? 'dark' : 'light'}
            intensity={85}
            style={[
              StyleSheet.absoluteFill,

              {
                borderRadius: 24,
                overflow: 'hidden',
                backgroundColor: colorScheme === 'dark' ? 'rgba(18, 18, 18, 0.85)' : 'rgba(255, 255, 255, 0.90)',
                borderWidth: 1,
                borderColor: colorScheme === 'dark' ? 'rgba(57, 255, 20, 0.2)' : 'rgba(0, 0, 0, 0.08)',
              }
            ]}
          />
        ),
      }}>
            <Tabs.Screen
        name="index"
        options={{
          title: 'Accueil',
          tabBarIcon: ({ color }) => <Home color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="menu"
        options={{
          title: 'Menu',
          tabBarIcon: ({ color }) => <Utensils color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="my-day"
        options={{
          title: 'Mon Jour',
          tabBarIcon: ({ color }) => <Calendar color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="shop"
        options={{
          title: 'Boutique',
          tabBarIcon: ({ color }) => (
            <View>
              <ShoppingBag color={color} size={24} />
              {cartCount > 0 && (
                <Animated.View
                  className="absolute -top-1 -right-2 bg-red-500 w-4 h-4 rounded-full flex items-center justify-center"
                  style={{ transform: [{ scale: scaleAnim }] }}
                >
                  <Text className="text-white text-[10px] font-bold">{cartCount}</Text>
                </Animated.View>
              )}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: 'Commandes',
          tabBarIcon: ({ color }) => <Package color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color }) => <User color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          href: null,
        }}
      />
    </Tabs>
    </View>
  );
}