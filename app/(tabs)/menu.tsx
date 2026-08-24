import React, { useState, useEffect } from 'react';
import { View, Text, ActivityIndicator, ScrollView, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { supabase } from '../../lib/supabase';
import { Lock, FileText, RefreshCw, Plus } from 'lucide-react-native';

export default function MenuScreen() {
  const [isLoading, setIsLoading] = useState(true);
  const [menu, setMenu] = useState<any>(null);
  const [trialEndsAt, setTrialEndsAt] = useState<Date | null>(null);
  const [coachBubble, setCoachBubble] = useState<{visible: boolean, message: string}>({ visible: false, message: '' });

  useEffect(() => {
    fetchWeeklyMenu();
  }, []);

  const fetchWeeklyMenu = async () => {
    try {
      setIsLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

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
      setIsLoading(false);
    }
  };

  const triggerCoachBubble = (message: string) => {
    setCoachBubble({ visible: true, message });
    setTimeout(() => setCoachBubble({ visible: false, message: '' }), 4000);
  };

  const handleAddMeal = async (meal: any) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const userId = session.user.id;
      const todayDateString = new Date().toISOString().split('T')[0];

      const { data: existingLog } = await supabase
        .from('nutrition_daily_logs')
        .select('id, calories_consumed, protein_consumed, carbs_consumed, fats_consumed')
        .eq('client_id', userId)
        .eq('log_date', todayDateString)
        .maybeSingle();

      const updatedCalories = (existingLog?.calories_consumed || 0) + (meal.calories || 0);
      const updatedProtein = (existingLog?.protein_consumed || 0) + (meal.p || 0);
      const updatedCarbs = (existingLog?.carbs_consumed || 0) + (meal.c || 0);
      const updatedFats = (existingLog?.fats_consumed || 0) + (meal.f || 0);

      if (existingLog) {
        await supabase
          .from('nutrition_daily_logs')
          .update({
            calories_consumed: updatedCalories,
            protein_consumed: updatedProtein,
            carbs_consumed: updatedCarbs,
            fats_consumed: updatedFats,
          })
          .eq('id', existingLog.id);
      } else {
        await supabase
          .from('nutrition_daily_logs')
          .insert({
            client_id: userId,
            log_date: todayDateString,
            calories_consumed: updatedCalories,
            protein_consumed: updatedProtein,
            carbs_consumed: updatedCarbs,
            fats_consumed: updatedFats,
          });
      }
      triggerCoachBubble(`Repas ajouté à MON JOUR !`);
    } catch (e) {
      console.error("Error adding meal from Sama Menu:", e);
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

  const now = new Date();
  const isPremium = trialEndsAt ? now <= trialEndsAt : false;

  // Use mock weekly structure if no weekly menu is generated.
  const weeklyStructure = menu || [
    {
      week: 1,
      title: 'Semaine 1',
      days: [
        { day_name: 'Lundi', meals: [
          { meal_type: 'Petit-déjeuner', recipe_name: 'Bouillie de mil', calories: 250, p: 8, c: 45, f: 5, image_url: 'https://res.cloudinary.com/dtr2wtoty/image/upload/v1781222471/Bouillie_de_mil_r2zihq.jpg' },
          { meal_type: 'Déjeuner', recipe_name: 'Thieboudienne Diététique', calories: 480, p: 58, c: 0, f: 25, image_url: 'https://res.cloudinary.com/dtr2wtoty/image/upload/v1781221768/Thiebou_dieune_1_hftdhm.jpg' },
          { meal_type: 'Dîner', recipe_name: 'Salade de Fonio', calories: 320, p: 12, c: 35, f: 10, image_url: 'https://res.cloudinary.com/dtr2wtoty/image/upload/v1786107893/Ceramic_plate_with_herbs_on_202608071304_bl72q1.jpg' }
        ]},
        { day_name: 'Mardi', meals: [
          { meal_type: 'Petit-déjeuner', recipe_name: 'Omelette aux légumes', calories: 280, p: 15, c: 5, f: 20, image_url: 'https://res.cloudinary.com/dtr2wtoty/image/upload/v1786107893/Ceramic_plate_with_herbs_on_202608071304_bl72q1.jpg' },
          { meal_type: 'Déjeuner', recipe_name: 'Yassa Poulet', calories: 500, p: 40, c: 45, f: 15, image_url: 'https://res.cloudinary.com/dtr2wtoty/image/upload/v1786107893/Ceramic_plate_with_herbs_on_202608071304_bl72q1.jpg' },
          { meal_type: 'Dîner', recipe_name: 'Soupe de poisson', calories: 250, p: 25, c: 10, f: 8, image_url: 'https://res.cloudinary.com/dtr2wtoty/image/upload/v1786107893/Ceramic_plate_with_herbs_on_202608071304_bl72q1.jpg' }
        ]}
      ]
    },
    { week: 2, title: 'Semaine 2' },
    { week: 3, title: 'Semaine 3' },
    { week: 4, title: 'Semaine 4' },
  ];

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-zinc-950">

      {coachBubble.visible && (
        <View className="absolute top-20 left-4 right-4 bg-zinc-900 rounded-3xl p-4 flex-row items-center shadow-lg border border-[#39FF14]/30 z-50">
          <Image source={{ uri: "https://res.cloudinary.com/dtr2wtoty/image/upload/v1784209735/557516971_10235324002253110_1070574324835198049_n_ch9we7.jpg" }} className="w-12 h-12 rounded-full border-2 border-[#39FF14] mr-3" />
          <Text className="flex-1 text-white text-xs" style={{ fontFamily: 'Poppins_500Medium' }}>{coachBubble.message}</Text>
        </View>
      )}

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }} className="px-4">
        <View className="flex-row justify-between items-center mb-6 mt-4">
          <Text className="text-black dark:text-white text-3xl font-bold" style={{ fontFamily: 'Poppins_700Bold' }}>Sama Menu</Text>
        </View>

        {/* Global Action Buttons */}
        <View className="flex-row space-x-4 mb-6">
          <TouchableOpacity className="flex-1 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 rounded-[1.5rem] flex-row items-center justify-center shadow-sm mr-2">
            <RefreshCw color="#39FF14" size={20} className="mr-2" />
            <Text className="text-black dark:text-white font-bold ml-2" style={{ fontFamily: 'Poppins_700Bold' }}>Regénérer</Text>
          </TouchableOpacity>
          <TouchableOpacity className="flex-1 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 rounded-[1.5rem] flex-row items-center justify-center shadow-sm ml-2">
            <FileText color="#39FF14" size={20} className="mr-2" />
            <Text className="text-black dark:text-white font-bold ml-2" style={{ fontFamily: 'Poppins_700Bold' }}>Courses / PDF</Text>
          </TouchableOpacity>
        </View>

        {weeklyStructure.map((weekData: any, index: number) => {
          const isLocked = !isPremium && (index === 2 || index === 3);
          const days = weekData.days || [{ day_name: 'Lundi', meals: [] }];

          return (
            <View key={index} className="mb-8">
              <Text className="text-gray-600 dark:text-gray-400 text-xl mb-4 font-bold ml-2" style={{ fontFamily: 'Poppins_700Bold' }}>{weekData.title || `Semaine ${index + 1}`}</Text>

              {days.map((day: any, dayIndex: number) => (
                <View key={dayIndex} className={`mb-6 rounded-[2rem] bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-5 relative overflow-hidden shadow-sm ${isLocked ? 'opacity-30' : ''}`}>
                  <Text className="text-black dark:text-white text-lg font-bold mb-4" style={{ fontFamily: 'Poppins_700Bold' }}>{day.day_name}</Text>

                  {day.meals && day.meals.length > 0 ? day.meals.map((meal: any, mealIndex: number) => (
                    <View key={mealIndex} className="flex-row items-center mb-5 bg-white dark:bg-black p-3 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                      <Image source={{ uri: meal.image_url || "https://res.cloudinary.com/dtr2wtoty/image/upload/v1786107893/Ceramic_plate_with_herbs_on_202608071304_bl72q1.jpg" }} className="w-20 h-20 rounded-[1rem] mr-4" />
                      <View className="flex-1">
                        <Text className="text-[#39FF14] text-xs font-bold uppercase mb-1" style={{ fontFamily: "Poppins_700Bold" }}>{meal.meal_type}</Text>
                        <Text className="text-black dark:text-white font-bold text-sm mb-1" style={{ fontFamily: "Poppins_700Bold" }}>{meal.recipe_name}</Text>
                        <Text className="text-gray-500 text-xs mb-2">{meal.calories || 0} kcal</Text>

                        <TouchableOpacity
                          className="bg-[#39FF14]/10 border border-[#39FF14] px-3 py-2 rounded-xl flex-row items-center self-start"
                          onPress={() => !isLocked && handleAddMeal(meal)}
                        >
                          <Plus color="#39FF14" size={14} className="mr-1" />
                          <Text className="text-[#39FF14] text-xs font-bold" style={{ fontFamily: "Poppins_700Bold" }}>Ajouter</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )) : (
                    <Text className="text-gray-500 italic">Aucun repas généré pour ce jour.</Text>
                  )}

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
                          <Text className="text-black font-bold text-sm uppercase text-center px-2" style={{ fontFamily: "Poppins_700Bold" }}>Débloquez la suite</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}

                </View>
              ))}
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}
