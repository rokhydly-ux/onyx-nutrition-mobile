import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import React, { useState } from 'react';
import { Alert, ImageBackground, KeyboardAvoidingView, Platform, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase';

export default function LoginScreen() {
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!phone || !pin) return;
    setLoading(true);

    // 1. Clean all non-digit and non-plus characters
    let cleanPhone = phone.replace(/[^0-9+]/g, '');

    // 2. BACKEND LOGIC: Automatic detection of Senegalese format
    // If it's a 9-digit number starting with 70, 75, 76, 77 or 78 (without country code), add +221
    if (/^(70|75|76|77|78)\d{7}$/.test(cleanPhone)) {
      cleanPhone = `+221${cleanPhone}`;
    }
    // Otherwise, if the number doesn't start with "+", add "+" at the beginning
    else if (!cleanPhone.startsWith('+')) {
      cleanPhone = `+${cleanPhone}`;
    }

    // 3. Form the official fictional email
    const authEmail = `${cleanPhone}@clients.onyxcrm.com`;
    console.log("Email envoyé à Supabase Auth :", authEmail);

    const { error } = await supabase.auth.signInWithPassword({ email: authEmail, password: pin });

    setLoading(false);
    if (!error) {
      router.replace('/(tabs)');
    } else {
      if (Platform.OS === 'web') {
        window.alert(`Erreur de connexion: ${error.message}`);
      } else {
        Alert.alert("Erreur de connexion", error.message);
      }
    }
  };

  return (
    <ImageBackground
      source={{ uri: 'https://images.unsplash.com/photo-1547592180-85f173990554?q=80&w=1000&auto=format&fit=crop' }}
      className="flex-1"
    >
      <View className="absolute inset-0 bg-black/60" />
      <SafeAreaView className="flex-1 p-6" edges={['top', 'bottom']}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} className="flex-1">

          {/* Back Button */}
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-12 h-12 rounded-full overflow-hidden mb-8"
          >
            <BlurView intensity={50} tint="dark" className="w-full h-full items-center justify-center">
              <ArrowLeft color="white" size={24} />
            </BlurView>
          </TouchableOpacity>

          {/* Content */}
          <View className="flex-1 justify-center">
            <Text className="text-white text-4xl font-bold mb-2" style={{ fontFamily: 'Poppins_700Bold' }}>Bon retour !</Text>
            <Text className="text-gray-300 text-lg mb-10" style={{ fontFamily: 'Poppins_400Regular' }}>Prêt pour ton menu du jour ?</Text>

            {/* Form Card */}
            <View className="bg-white rounded-[2rem] p-6 mb-8">
              <View className="mb-6">
                <Text className="text-gray-500 font-medium mb-2" style={{ fontFamily: 'Poppins_500Medium' }}>Numéro de téléphone</Text>
                <View className="border-b border-gray-300 pb-2">
                  <TextInput
                    value={phone}
                    onChangeText={setPhone}
                    placeholder="Ex: 77 123 45 67"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="phone-pad"
                    className="text-black text-lg p-0 m-0"
                    style={{ fontFamily: 'Poppins_400Regular' }}
                  />
                </View>
              </View>

              <View className="mb-6">
                <Text className="text-gray-500 font-medium mb-2" style={{ fontFamily: 'Poppins_500Medium' }}>Mot de passe</Text>
                <View className="border-b border-gray-300 pb-2">
                  <TextInput
                    value={pin}
                    onChangeText={setPin}
                    placeholder="••••"
                    placeholderTextColor="#9CA3AF"
                    secureTextEntry={true}
                    keyboardType="default"
                    className="text-black text-lg p-0 m-0 tracking-[1em]"
                  />
                </View>
              </View>
            </View>

            <TouchableOpacity
              className={`w-full py-4 rounded-full items-center shadow-[0_0_15px_rgba(57,255,20,0.5)] ${loading ? 'bg-gray-400' : 'bg-[#39FF14]'}`}
              onPress={handleLogin}
              disabled={loading}
            >
              <Text className="text-black font-bold text-lg uppercase" style={{ fontFamily: 'Poppins_700Bold' }}>
                {loading ? 'Connexion...' : "C'est parti !"}
              </Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ImageBackground>
  );
}
