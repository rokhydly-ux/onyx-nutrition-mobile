import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, Animated, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';
import { User, Lock, Sun, Moon } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';

export default function LoginScreen() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(true);

  // Parallax animation values
  const tomatoAnim = useRef(new Animated.Value(0)).current;
  const mangoAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Floating animations for background elements
    Animated.loop(
      Animated.sequence([
        Animated.timing(tomatoAnim, {
          toValue: 20,
          duration: 3000,
          useNativeDriver: true,
        }),
        Animated.timing(tomatoAnim, {
          toValue: 0,
          duration: 3000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(mangoAnim, {
          toValue: -20,
          duration: 4000,
          useNativeDriver: true,
        }),
        Animated.timing(mangoAnim, {
          toValue: 0,
          duration: 4000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [tomatoAnim, mangoAnim]);

  const handleLogin = async () => {
    const cleanInput = identifier.replace(/\s+/g, '');
    const authEmail = cleanInput.includes('@') ? cleanInput : `${cleanInput}@clients.onyxcrm.com`;

    // Attempt sign in (will handle errors silently for this mockup if no valid credentials)
    await supabase.auth.signInWithPassword({ email: authEmail, password });

    // For now, always route to tabs to allow user to see the tabs UI
    router.replace('/(tabs)');
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className={`flex-1 ${isDarkMode ? 'bg-black' : 'bg-zinc-100'}`}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }} bounces={false}>
        <View className="flex-1 items-center justify-center relative px-6 py-10">

          {/* Dark Mode Toggle */}
          <TouchableOpacity
            className="absolute top-12 right-6 z-50 p-3 rounded-full border border-gray-400/30"
            style={{ backgroundColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }}
            onPress={() => setIsDarkMode(!isDarkMode)}
          >
            {isDarkMode ? <Sun color="white" size={20} /> : <Moon color="black" size={20} />}
          </TouchableOpacity>

          {/* Floating Background Elements */}
          <Animated.Image
            source={{ uri: 'https://res.cloudinary.com/dtr2wtoty/image/upload/v1782919475/tomates_nqeqjn.png' }}
            style={{ transform: [{ translateY: tomatoAnim }] }}
            className="absolute top-10 left-10 w-24 h-24 opacity-80"
            resizeMode="contain"
          />
          <Animated.Image
            source={{ uri: 'https://res.cloudinary.com/dtr2wtoty/image/upload/v1782918952/MANGO_lo6yxx.png' }}
            style={{ transform: [{ translateY: mangoAnim }] }}
            className="absolute bottom-1/4 right-10 w-20 h-20 opacity-80"
            resizeMode="contain"
          />

          {/* Main Glassmorphism Card */}
          <View className="w-full max-w-xl rounded-[2.5rem] overflow-hidden border border-white/10 z-10">
            <BlurView intensity={50} tint={isDarkMode ? "dark" : "light"} className="py-8 px-8 items-center w-full">

              {/* Logo & Title */}
              <Image
                source={{ uri: 'https://res.cloudinary.com/dtr2wtoty/image/upload/v1781224243/logo_dore_um5fsr.png' }}
                className="w-28 h-28 mb-4"
                resizeMode="contain"
              />
              <Text className={`text-2xl font-black uppercase tracking-wider mb-8 ${isDarkMode ? 'text-white' : 'text-black'}`}>
                Bon retour !
              </Text>

              {/* Form Inputs */}
              <View className="w-full space-y-4 mb-6">
                <View className="relative justify-center mb-4">
                  <View className="absolute left-4 z-10">
                    <User color={isDarkMode ? '#ffffff80' : '#00000080'} size={20} />
                  </View>
                  <TextInput
                    value={identifier}
                    onChangeText={setIdentifier}
                    placeholder="Email ou N° WhatsApp"
                    placeholderTextColor={isDarkMode ? "#ffffff80" : "#00000080"}
                    className={`rounded-2xl py-4 pl-12 pr-4 text-base ${isDarkMode ? 'bg-black/40 text-white border-white/10' : 'bg-black/10 text-black border-black/10'} border focus:border-neon`}
                    autoCapitalize="none"
                  />
                </View>

                <View className="relative justify-center mb-6">
                  <View className="absolute left-4 z-10">
                    <Lock color={isDarkMode ? '#ffffff80' : '#00000080'} size={20} />
                  </View>
                  <TextInput
                    value={password}
                    onChangeText={setPassword}
                    placeholder="Mot de passe"
                    placeholderTextColor={isDarkMode ? "#ffffff80" : "#00000080"}
                    secureTextEntry
                    className={`rounded-2xl py-4 pl-12 pr-4 text-base ${isDarkMode ? 'bg-black/40 text-white border-white/10' : 'bg-black/10 text-black border-black/10'} border focus:border-neon`}
                  />
                </View>

                <TouchableOpacity
                  onPress={handleLogin}
                  className="bg-neon py-4 rounded-2xl items-center"
                >
                  <Text className="text-black font-black uppercase tracking-widest text-base">Ouvrir mon Dashboard</Text>
                </TouchableOpacity>
              </View>

              {/* Quick Goals Options */}
              <View className="w-full flex-row justify-between mt-4">
                <TouchableOpacity className="bg-neon/10 border border-neon/40 rounded-xl py-3 px-2 flex-1 mx-1 items-center">
                  <Text className="text-neon text-xs font-bold text-center">Perdre du Poids</Text>
                </TouchableOpacity>
                <TouchableOpacity className="bg-neon/10 border border-neon/40 rounded-xl py-3 px-2 flex-1 mx-1 items-center">
                  <Text className="text-neon text-xs font-bold text-center">Prendre de la Masse</Text>
                </TouchableOpacity>
                <TouchableOpacity className="bg-neon/10 border border-neon/40 rounded-xl py-3 px-2 flex-1 mx-1 items-center">
                  <Text className="text-neon text-xs font-bold text-center">Maintenir la Forme</Text>
                </TouchableOpacity>
              </View>

            </BlurView>
          </View>

        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}