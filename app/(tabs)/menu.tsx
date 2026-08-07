import React, { useState, useEffect } from 'react';

import { View, Text, ActivityIndicator, Dimensions, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';

export default function MenuScreen() {
  const [isLoading, setIsLoading] = useState(true);
  const [menu, setMenu] = useState<any>(null);

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
        .select('weekly_menu')
        .eq('client_id', session.user.id)
        .maybeSingle();

      if (data && data.weekly_menu) {
        setMenu(data.weekly_menu);
      }
    } catch (error) {
      console.error("Erreur Sama Menu:", error);
    } finally {
      setIsLoading(false); // DOIT ABSOLUMENT ÊTRE EXÉCUTÉ
    }
  };

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white dark:bg-black">
        <ActivityIndicator size="large" color="#39FF14" />
        <Text className="text-gray-500 mt-4" style={{ fontFamily: 'Poppins_400Regular' }}>Chargement du menu...</Text>
      </View>
    );
  }

  return (

    <SafeAreaView className="flex-1 bg-white dark:bg-black p-4">
      <Text className="text-black dark:text-white text-2xl mb-4" style={{ fontFamily: 'Poppins_700Bold' }}>Sama Menu</Text>
      {menu ? (
        <Text className="text-gray-500" style={{ fontFamily: 'Poppins_400Regular' }}>Votre menu est prêt.</Text>
      ) : (
        <Text className="text-gray-500" style={{ fontFamily: 'Poppins_400Regular' }}>Aucun menu généré pour le moment.</Text>
      )}
    </SafeAreaView>
  );
}
