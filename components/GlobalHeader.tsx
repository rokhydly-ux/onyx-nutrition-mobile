import React, { useState, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { Bell, LogOut } from 'lucide-react-native';
import { supabase } from '../lib/supabase';
import { useColorScheme } from 'nativewind';
import { useRouter } from 'expo-router';

export default function GlobalHeader() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();

  const [clientName, setClientName] = useState('Membre');
  const [avatar, setAvatar] = useState('https://res.cloudinary.com/dtr2wtoty/image/upload/v1781536233/A_cute__highly_detailed_3D_202606151510_uj9z5c.jpg');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: clientData, error } = await supabase
        .from('clients')
        .select('full_name, avatar_url')
        .eq('id', user.id)
        .single();

      if (clientData && clientData.full_name) {
        setClientName(clientData.full_name);
        if (clientData.avatar_url) setAvatar(clientData.avatar_url);
      } else {
        setClientName(user.user_metadata?.full_name || "Membre");
      }
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace('/login');
  };

  return (
    <View className="flex-row items-center justify-between px-5 pt-4 pb-2 bg-transparent z-50">
      <View className="flex-row items-center">
        <Image source={{ uri: avatar }} className="w-10 h-10 rounded-full border-2 border-[#39FF14] mr-3" />
        <Text className="text-black dark:text-white text-lg" style={{ fontFamily: 'Poppins_700Bold' }}>
          Hello {clientName && clientName !== "Membre" ? clientName.split(' ')[0] : "Membre"} <Text className="text-lg">⚡</Text>
        </Text>
      </View>
      <View className="flex-row items-center space-x-4">
        <TouchableOpacity className="relative mr-4">
          <Bell color={isDark ? '#FFF' : '#000'} size={24} />
          <View className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white dark:border-black" />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleLogout}>
          <LogOut color={isDark ? '#FFF' : '#000'} size={24} />
        </TouchableOpacity>
      </View>
    </View>
  );
}
