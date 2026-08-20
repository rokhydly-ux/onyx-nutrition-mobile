import React, { useState, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, Alert } from 'react-native';
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
    Alert.alert(
        'Mon Profil',
        'Que souhaitez-vous faire ?',
        [
          { text: 'Aller au profil', onPress: () => router.push('/profile') },
          { text: 'Se déconnecter', style: 'destructive', onPress: async () => {
              await supabase.auth.signOut();
              router.replace('/login');
            }
          },
          { text: 'Annuler', style: 'cancel' }        ]
      );
  };


  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'Bonjour';
    if (hour >= 12 && hour < 18) return 'Salam';
    return 'Bonsoir';
  };

  const [coachMessage, setCoachMessage] = useState("Prête à briller aujourd'hui ?");

  useEffect(() => {
    const generateCoachMessage = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        const todayDateString = new Date().toISOString().split('T')[0];
        const { data: todayLog } = await supabase
          .from('nutrition_daily_logs')
          .select('water_glasses, calories_consumed')
          .eq('client_id', session.user.id)
          .eq('log_date', todayDateString)
          .maybeSingle();

        const messages = [];
        const hour = new Date().getHours();

        if (hour > 12 && (!todayLog || !todayLog.water_glasses || todayLog.water_glasses < 4)) {
           messages.push("Il fait chaud à Dakar aujourd'hui, n'oublie pas tes verres d'eau ! 💧");
        } else if (todayLog && todayLog.calories_consumed > 1000) {
           messages.push("Objectif journalier presque atteint, encore un petit effort ! 💪");
        } else if (hour < 10) {
           messages.push("Un bon petit-déjeuner pour bien démarrer la journée ! ☀️");
        } else {
           messages.push("Prête à briller aujourd'hui ? Reste constante ! ✨");
        }

        setCoachMessage(messages[0]);
      } catch (e) {
        // Silently fallback if error
      }
    };
    generateCoachMessage();
  }, []);

  return (
    <View className="flex-row items-center justify-between px-5 pt-4 pb-2 bg-transparent z-50">
      <View className="flex-row items-center flex-1 pr-4">
        <TouchableOpacity onPress={() => router.push("/profile")}>
          <Image source={{ uri: avatar }} className="w-12 h-12 rounded-full border-2 border-[#39FF14] mr-3" />
        </TouchableOpacity>
        <View className="flex-col flex-1 justify-center relative">
           <Image source={{ uri: 'https://res.cloudinary.com/dtr2wtoty/image/upload/v1781535959/A_cute__highly_detailed_3D_202606151505_ytie6s.jpg' }} className="absolute -left-12 -top-1 w-6 h-6 rounded-full border border-white z-10" />
           <Text className="text-black dark:text-white text-xl leading-tight" style={{ fontFamily: 'Poppins_900Black' }}>
            {getGreeting()} {clientName && clientName !== "Membre" ? clientName.split(' ')[0] : "Membre"} <Text className="text-lg">⚡</Text>
           </Text>
           <Text className="text-gray-500 dark:text-gray-400 text-[10px] font-medium" numberOfLines={1}>{coachMessage}</Text>
        </View>
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
