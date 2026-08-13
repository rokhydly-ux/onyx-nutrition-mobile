import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ImageBackground, KeyboardAvoidingView, Platform, Alert, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, CheckSquare, Square } from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import { supabase } from '../lib/supabase';

export default function LoginScreen() {
  const router = useRouter();
  const [phone, setPhone] = useState('');
    const [loading, setLoading] = useState(false);
    const [keepLoggedIn, setKeepLoggedIn] = useState(true);

  const handleLogin = async () => {
    if (!phone) return;
    const pin = phone.replace(/\s+/g, '').slice(-8).padStart(8, '0');
    setLoading(true);

    // 1. On supprime uniquement les espaces vides de l'identifiant saisi
    const cleanIdentifier = phone.replace(/\s+/g, '');

    // 2. Logique PWA stricte : si ça contient un "@", c'est un email, sinon on accole directement le domaine sans altérer le numéro
    const authEmail = cleanIdentifier.includes('@')
      ? cleanIdentifier
      : `${cleanIdentifier}@clients.onyxcrm.com`;

    console.log("Email synchronisé PWA/Mobile envoyé à Supabase :", authEmail);

    // 3. Lancement de l'authentification
    const finalEmail = authEmail.trim();
    const finalPassword = pin.trim();

    console.log(`Envoi strict API -> Email: '${finalEmail}' | Pass: '${finalPassword}'`);
    const { data, error } = await supabase.auth.signInWithPassword({
      email: finalEmail,
      password: finalPassword, // keyboardType is already "default"
    });

    setLoading(false);
    if (!error) {
      console.log("Connexion réussie ! Session synchronisée pour le client ID :", data.session.user.id);
      router.replace('/(tabs)');
    } else {
      console.error("Erreur de connexion :", error.message);
      const errorMessage = "Identifiants incorrects. Veuillez utiliser les mêmes identifiants que sur l'application Web.";
      if (Platform.OS === 'web') {
        window.alert(errorMessage);
      } else {
        Alert.alert("Erreur de connexion", errorMessage);
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



              {/* Keep Me Logged In Checkbox (Visual Only) */}
              <TouchableOpacity
                className="flex-row items-center mt-2 mb-2"
                onPress={() => setKeepLoggedIn(!keepLoggedIn)}
                activeOpacity={0.7}
              >
                {keepLoggedIn ? (
                  <CheckSquare size={20} color="#39FF14" />
                ) : (
                  <Square size={20} color="#9CA3AF" />
                )}
                <Text className="ml-2 text-gray-700" style={{ fontFamily: 'Poppins_400Regular' }}>
                  Rester connecté(e)
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              className={`w-full py-4 rounded-full items-center shadow-[0_0_15px_rgba(57,255,20,0.5)] mb-6 ${loading ? 'bg-gray-400' : 'bg-[#39FF14]'}`}
              onPress={handleLogin}
              disabled={loading}
            >
              <Text className="text-black font-bold text-lg uppercase" style={{ fontFamily: 'Poppins_700Bold' }}>
                {loading ? 'Connexion...' : "C'est parti !"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => Linking.openURL('https://wa.me/1234567890?text=Bonjour%20Coach%2C%20j%27ai%20oubli%C3%A9%20le%20mot%20de%20passe%20de%20mon%20application%20Onyx%20Nutrition.%20Pouvez-vous%20m%27aider%20%C3%A0%20le%20r%C3%A9initialiser%20%3F')}
              className="items-center"
            >
              <Text className="text-gray-300 font-medium underline" style={{ fontFamily: 'Poppins_500Medium' }}>
                Mot de passe oublié ?
              </Text>
            </TouchableOpacity>

          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ImageBackground>
  );
}
