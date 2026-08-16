import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, TextInput, ActivityIndicator, Alert, useColorScheme } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Camera, Edit2, CheckCircle, Lock } from 'lucide-react-native';
import { supabase } from '../../lib/supabase';
import { decode } from 'base64-arraybuffer';

// Types
interface ClientProfile {
  id: string;
  full_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  cover_url: string | null;
  instagram: string | null;
  facebook: string | null;
  twitter: string | null;
}

interface DiagnosticData {
  poids?: number;
  taille?: number;
  [key: string]: any;
}

interface NutritionProfile {
  client_id: string;
  jongoma_xp: number;
  diagnostic_data: DiagnosticData;
}

// Badges Data
const BADGES = [
  { name: 'Lekkologue Or', xpReq: 0, uri: 'https://res.cloudinary.com/dtr2wtoty/image/upload/v1784493019/LEKKOLOGUE_OR_a0znxt.png' },
  { name: 'Force Baobab', xpReq: 1000, uri: 'https://res.cloudinary.com/dtr2wtoty/image/upload/v1784493020/FORCE_BAOBAB_ltcuer.png' },
  { name: 'Maître du Fonio', xpReq: 3000, uri: 'https://res.cloudinary.com/dtr2wtoty/image/upload/v1784493020/MAITRE_DU_FONIO_emczhf.png' },
  { name: 'Légende', xpReq: 5000, uri: 'https://res.cloudinary.com/dtr2wtoty/image/upload/v1784493019/LEGENDE_z4ipny.png' },
];

export default function ProfileScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [client, setClient] = useState<ClientProfile | null>(null);
  const [nutrition, setNutrition] = useState<NutritionProfile | null>(null);

  // Form State
  const [fullName, setFullName] = useState('');
  const [bio, setBio] = useState('');
  const [instagram, setInstagram] = useState('');
  const [facebook, setFacebook] = useState('');
  const [twitter, setTwitter] = useState('');
  const [poids, setPoids] = useState('');
  const [taille, setTaille] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [coverUrl, setCoverUrl] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const userId = session.user.id;

      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (clientError) throw clientError;

      const { data: nutritionData, error: nutritionError } = await supabase
        .from('nutrition_profiles')
        .select('*')
        .eq('client_id', userId)
        .maybeSingle();

      if (nutritionError) throw nutritionError;

      if (clientData) {
        setClient(clientData);
        setFullName(clientData.full_name || '');
        setBio(clientData.bio || '');
        setInstagram(clientData.instagram || '');
        setFacebook(clientData.facebook || '');
        setTwitter(clientData.twitter || '');
        setAvatarUrl(clientData.avatar_url);
        setCoverUrl(clientData.cover_url);
      }

      if (nutritionData) {
        setNutrition({
          ...nutritionData,
          diagnostic_data: typeof nutritionData.diagnostic_data === 'string'
            ? JSON.parse(nutritionData.diagnostic_data)
            : (nutritionData.diagnostic_data || {})
        });

        const diag = typeof nutritionData.diagnostic_data === 'string'
          ? JSON.parse(nutritionData.diagnostic_data)
          : (nutritionData.diagnostic_data || {});

        setPoids(diag.poids ? String(diag.poids) : '');
        setTaille(diag.taille ? String(diag.taille) : '');
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const uploadImage = async (base64Data: string, path: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(path, decode(base64Data), {
          contentType: 'image/jpeg',
          upsert: true,
        });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(path);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      Alert.alert('Erreur', "Impossible de télécharger l'image.");
      return null;
    }
  };

  const pickImage = async (type: 'avatar' | 'cover') => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permissionResult.granted === false) {
      Alert.alert("Permission requise", "L'accès à la galerie est nécessaire pour choisir une photo.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: type === 'avatar' ? [1, 1] : [16, 9],
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const uri = result.assets[0].uri;
      const base64Data = result.assets[0].base64;
      const { data: { session } } = await supabase.auth.getSession();
      if (!session || !base64Data) return;

      setSaving(true);
      const fileExt = uri.split('.').pop() || 'jpg';
      const fileName = `${session.user.id}-${type}-${Date.now()}.${fileExt}`;
      const filePath = `${session.user.id}/${fileName}`;

      const publicUrl = await uploadImage(base64Data, filePath);

      if (publicUrl) {
        if (type === 'avatar') {
          setAvatarUrl(publicUrl);
        } else {
          setCoverUrl(publicUrl);
        }
      }
      setSaving(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const userId = session.user.id;

      // Étape 1 : Mise à jour Auth
      await supabase.auth.updateUser({
        data: {
          full_name: fullName,
          avatar_url: avatarUrl,
        }
      });

      // Étape 2 : Mise à jour table clients
      const { error: clientError } = await supabase
        .from('clients')
        .update({
          full_name: fullName,

          avatar_url: avatarUrl,
          cover_url: coverUrl,
          instagram: instagram,
          facebook: facebook,
          twitter: twitter,
          bio: bio,
        })
        .eq('id', userId);

      if (clientError) throw clientError;

      // Étape 3 : Mise à jour table nutrition_profiles (fusion JSONB)
      if (nutrition) {
        const currentDiagnosticData = nutrition.diagnostic_data || {};
        const updatedDiagnosticData = {
          ...currentDiagnosticData,
          poids: poids ? parseFloat(poids) : null,
          taille: taille ? parseFloat(taille) : null
        };

        const { error: nutritionError } = await supabase
          .from('nutrition_profiles')
          .update({
            diagnostic_data: updatedDiagnosticData
          })
          .eq('client_id', userId);

        if (nutritionError) throw nutritionError;
      }

      Alert.alert('Succès', 'Votre profil a été mis à jour avec succès.');
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert('Erreur', 'Une erreur est survenue lors de la sauvegarde.');
    } finally {
      setSaving(false);
    }
  };

  const calculateIMC = () => {
    const p = parseFloat(poids);
    const t = parseFloat(taille);
    if (p > 0 && t > 0) {
      // Assuming taille is in cm
      const tInMeters = t / 100;
      return (p / (tInMeters * tInMeters)).toFixed(1);
    }
    return '--';
  };

  if (loading) {
    return (
      <View className={`flex-1 items-center justify-center ${isDark ? 'bg-zinc-950' : 'bg-white'}`}>
        <ActivityIndicator size="large" color="#39FF14" />
      </View>
    );
  }

  const currentXP = nutrition?.jongoma_xp || 0;
  const imc = calculateIMC();

  return (
    <ScrollView className={`flex-1 ${isDark ? 'bg-zinc-950' : 'bg-gray-50'}`} contentContainerStyle={{ paddingBottom: 100 }}>
      {/* Bannière & Avatar */}
      <View className="relative mb-16">
        <TouchableOpacity onPress={() => pickImage('cover')}>
          {coverUrl ? (
            <Image source={{ uri: coverUrl }} className="w-full h-40 rounded-[2rem]" resizeMode="cover" />
          ) : (
            <View className="w-full h-40 bg-gray-300 dark:bg-gray-800 items-center justify-center rounded-[2rem]">
              <Camera color={isDark ? '#6B7280' : '#9CA3AF'} size={32} />
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          className="absolute -bottom-12 left-6 border-4 border-white dark:border-zinc-950 rounded-full"
          onPress={() => pickImage('avatar')}
        >
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} className="w-24 h-24 rounded-full" resizeMode="cover" />
          ) : (
            <View className="w-24 h-24 bg-gray-200 dark:bg-gray-700 rounded-full items-center justify-center">
               <Image source={{ uri: 'https://cdn-icons-png.flaticon.com/512/149/149071.png' }} className="w-full h-full rounded-full" />
            </View>
          )}
          <View className="absolute bottom-0 right-0 bg-[#39FF14] p-2 rounded-full border-2 border-white dark:border-zinc-950">
            <Edit2 color="black" size={12} />
          </View>
        </TouchableOpacity>
      </View>

      <View className="px-6 space-y-6 gap-y-6">
        {/* Infos Personnelles */}
        <View className={`p-6 rounded-[40px] shadow-lg ${isDark ? 'bg-zinc-900 shadow-[#39FF14]/5' : 'bg-white shadow-[#39FF14]/10'}`}>
          <Text className={`text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-black'}`}>Infos Personnelles</Text>

          <View className="space-y-4 gap-y-4">
            <View>
              <Text className={`text-sm mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Nom complet</Text>
              <TextInput
                value={fullName}
                onChangeText={setFullName}
                className={`p-4 rounded-2xl border ${isDark ? 'border-gray-800 bg-zinc-950 text-white' : 'border-gray-200 bg-gray-50 text-black'}`}
                placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
              />
            </View>
            <View>
              <Text className={`text-sm mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Bio</Text>
              <TextInput
                value={bio}
                onChangeText={setBio}
                multiline
                numberOfLines={3}
                className={`p-4 rounded-2xl border ${isDark ? 'border-gray-800 bg-zinc-950 text-white' : 'border-gray-200 bg-gray-50 text-black'}`}
                placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
                textAlignVertical="top"
              />
            </View>
          </View>
        </View>

        {/* Santé & IMC */}
        <View className={`p-6 rounded-[40px] shadow-lg ${isDark ? 'bg-zinc-900 shadow-[#39FF14]/5' : 'bg-white shadow-[#39FF14]/10'}`}>
          <View className="flex-row justify-between items-center mb-4">
            <Text className={`text-xl font-bold ${isDark ? 'text-white' : 'text-black'}`}>Santé & Mensurations</Text>
            <View className="bg-[#39FF14]/20 px-3 py-1 rounded-full">
              <Text className="text-[#39FF14] font-bold">IMC: {imc}</Text>
            </View>
          </View>

          <View className="flex-row gap-4">
            <View className="flex-1">
              <Text className={`text-sm mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Poids (kg)</Text>
              <TextInput
                value={poids}
                onChangeText={setPoids}
                keyboardType="numeric"
                className={`p-4 rounded-2xl border ${isDark ? 'border-gray-800 bg-zinc-950 text-white' : 'border-gray-200 bg-gray-50 text-black'}`}
                placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
              />
            </View>
            <View className="flex-1">
              <Text className={`text-sm mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Taille (cm)</Text>
              <TextInput
                value={taille}
                onChangeText={setTaille}
                keyboardType="numeric"
                className={`p-4 rounded-2xl border ${isDark ? 'border-gray-800 bg-zinc-950 text-white' : 'border-gray-200 bg-gray-50 text-black'}`}
                placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
              />
            </View>
          </View>
        </View>

        {/* Réseaux Sociaux */}
        <View className={`p-6 rounded-[40px] shadow-lg ${isDark ? 'bg-zinc-900 shadow-[#39FF14]/5' : 'bg-white shadow-[#39FF14]/10'}`}>
          <Text className={`text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-black'}`}>Réseaux Sociaux</Text>
          <View className="space-y-4 gap-y-4">
            <TextInput
              value={instagram}
              onChangeText={setInstagram}
              placeholder="Instagram (@username)"
              className={`p-4 rounded-2xl border ${isDark ? 'border-gray-800 bg-zinc-950 text-white' : 'border-gray-200 bg-gray-50 text-black'}`}
              placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
            />
            <TextInput
              value={facebook}
              onChangeText={setFacebook}
              placeholder="Facebook URL"
              className={`p-4 rounded-2xl border ${isDark ? 'border-gray-800 bg-zinc-950 text-white' : 'border-gray-200 bg-gray-50 text-black'}`}
              placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
            />
            <TextInput
              value={twitter}
              onChangeText={setTwitter}
              placeholder="Twitter (@username)"
              className={`p-4 rounded-2xl border ${isDark ? 'border-gray-800 bg-zinc-950 text-white' : 'border-gray-200 bg-gray-50 text-black'}`}
              placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
            />
          </View>
        </View>

        {/* Badges Jongoma */}
        <View className={`p-6 rounded-[40px] shadow-lg ${isDark ? 'bg-zinc-900 shadow-[#39FF14]/5' : 'bg-white shadow-[#39FF14]/10'}`}>
          <View className="flex-row justify-between items-center mb-4">
            <Text className={`text-xl font-bold ${isDark ? 'text-white' : 'text-black'}`}>Badges Jongoma</Text>
            <Text className="text-[#39FF14] font-bold">{currentXP} XP</Text>
          </View>
          <View className="flex-row flex-wrap justify-between gap-y-4">
            {BADGES.map((badge, index) => {
              const unlocked = currentXP >= badge.xpReq;
              return (
                <View key={index} className="w-[48%] items-center p-3 rounded-2xl" style={{ backgroundColor: unlocked ? 'rgba(255, 215, 0, 0.1)' : 'transparent' }}>
                  <View className="relative">
                    <Image
                      source={{ uri: badge.uri }}
                      className="w-16 h-16"
                      style={{ opacity: unlocked ? 1 : 0.3 }}
                      resizeMode="contain"
                    />
                    {!unlocked && (
                      <View className="absolute inset-0 items-center justify-center">
                        <Lock color={isDark ? 'white' : 'black'} size={24} />
                      </View>
                    )}
                  </View>
                  <Text className={`text-center mt-2 text-xs font-bold ${unlocked ? (isDark ? 'text-white' : 'text-black') : 'text-gray-400'}`}>
                    {badge.name}
                  </Text>
                  {!unlocked && (
                    <Text className="text-[10px] text-gray-500">{badge.xpReq} XP requis</Text>
                  )}
                </View>
              );
            })}
          </View>
        </View>

        {/* Bouton Sauvegarder */}
        <TouchableOpacity
          onPress={handleSave}
          disabled={saving}
          className={`p-4 rounded-full flex-row items-center justify-center gap-2 ${saving ? 'bg-gray-500' : 'bg-[#39FF14]'}`}
        >
          {saving ? (
            <ActivityIndicator color="white" />
          ) : (
            <>
              <CheckCircle color="black" size={24} />
              <Text className="text-black font-bold text-lg">Sauvegarder le profil</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
