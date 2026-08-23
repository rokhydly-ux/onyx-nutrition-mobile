import React, { useState, useEffect } from 'react';

import { View, Text, ActivityIndicator, Dimensions, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { supabase } from '../../lib/supabase';
import { Lock } from 'lucide-react-native';

export default function MenuScreen() {
  const [isLoading, setIsLoading] = useState(true);
  const [menu, setMenu] = useState<any>(null);
  const [trialEndsAt, setTrialEndsAt] = useState<Date | null>(null);

  useEffect(() => {
    fetchWeeklyMenu();
  }, []);

  const fetchWeeklyMenu = async () => {
    try {
      setIsLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;


      // Attempt to fetch menu
      const { data } = await supabase
        .from('nutrition_profiles')
        .select('weekly_menu, trial_ends_at')
        .eq('client_id', session.user.id)
        .maybeSingle();

      if (data && data.weekly_menu) {
        setMenu(data.weekly_menu);
      }
      if (data && data.trial_ends_at) {
        setTrialEndsAt(new Date(data.trial_ends_at));
      }
    } catch (error) {
      console.error("Erreur Sama Menu:", error);
    } finally {
      setIsLoading(false); // DOIT ABSOLUMENT ÊTRE EXÉCUTÉ
    }
  };

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white dark:bg-zinc-950">
        <ActivityIndicator size="large" color="#39FF14" />
        <Text className="text-gray-500 mt-4" style={{ fontFamily: 'Poppins_400Regular' }}>Chargement du menu...</Text>
      </View>
    );
  }

  // Calculate if the user has active trial logic
  const now = new Date();
  const isPremium = trialEndsAt ? now <= trialEndsAt : false;

  // Use mock weekly structure if no weekly menu is generated.
  const weeklyStructure = menu || [
    { week: 1, title: 'Semaine 1' },
    { week: 2, title: 'Semaine 2' },
    { week: 3, title: 'Semaine 3' },
    { week: 4, title: 'Semaine 4' },
  ];

  return (

    <SafeAreaView className="flex-1 bg-white dark:bg-zinc-950 px-4">
      <Text className="text-black dark:text-white text-3xl mb-6 mt-4 font-bold" style={{ fontFamily: 'Poppins_700Bold' }}>Sama Menu</Text>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        {weeklyStructure.map((weekData: any, index: number) => {
          const isLocked = !isPremium && (index === 2 || index === 3);

          return (
            <View key={index} className="mb-6">
              <Text className="text-gray-600 dark:text-gray-400 text-lg mb-4 font-bold" style={{ fontFamily: 'Poppins_700Bold' }}>{weekData.title || `Semaine ${index + 1}`}</Text>

              <View className={`rounded-[2rem] bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 relative overflow-hidden`}>

                <View className={`flex-row items-center mb-4 ${isLocked ? 'opacity-30' : ''}`}>
                   <Image source={{ uri: "https://res.cloudinary.com/dtr2wtoty/image/upload/v1781221768/Thiebou_dieune_1_hftdhm.jpg" }} className="w-16 h-16 rounded-2xl mr-4" />
                   <View>
                     <Text className="text-black dark:text-white font-bold text-lg" style={{ fontFamily: "Poppins_700Bold" }}>Lundi - Déjeuner</Text>
                     <Text className="text-gray-500">Thieboudienne Diététique</Text>
                   </View>
                </View>

                <View className={`flex-row items-center mb-4 ${isLocked ? 'opacity-30' : ''}`}>
                   <Image source={{ uri: "https://res.cloudinary.com/dtr2wtoty/image/upload/v1781222471/Bouillie_de_mil_r2zihq.jpg" }} className="w-16 h-16 rounded-2xl mr-4" />
                   <View>
                     <Text className="text-black dark:text-white font-bold text-lg" style={{ fontFamily: "Poppins_700Bold" }}>Mardi - Petit-déjeuner</Text>
                     <Text className="text-gray-500">Bouillie de mil</Text>
                   </View>
                </View>

                {isLocked && (
                  <View className="absolute inset-0 z-10 items-center justify-center bg-black/40">
                    <BlurView intensity={20} tint="dark" className="absolute inset-0" />
                    <View className="items-center bg-black/70 p-6 rounded-[2rem] w-[80%] border border-zinc-800">
                      <View className="w-16 h-16 rounded-full bg-zinc-800 items-center justify-center mb-4">
                        <Lock color="#39FF14" size={32} />
                      </View>
                      <Text className="text-white text-center text-lg font-bold mb-4" style={{ fontFamily: "Poppins_700Bold" }}>Contenu Verrouillé</Text>
                      <Text className="text-gray-300 text-center mb-6" style={{ fontFamily: "Poppins_400Regular" }}>Votre période d'essai de 14 jours est terminée.</Text>
                      <TouchableOpacity className="bg-[#39FF14] w-full py-4 rounded-full items-center shadow-[0_0_15px_rgba(57,255,20,0.5)]">
                        <Text className="text-black font-bold text-sm uppercase text-center px-2" style={{ fontFamily: "Poppins_700Bold" }}>Débloquez la suite de votre programme pour 2 900 F</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

              </View>
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}
