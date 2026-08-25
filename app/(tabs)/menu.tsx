import React, { useState, useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { supabase } from '../../lib/supabase';
import { Lock, RefreshCw, ShoppingCart, Plus, Check } from 'lucide-react-native';
import { useMenuStore } from '../../store/useMenuStore';

const FALLBACK_IMAGE = "https://res.cloudinary.com/dtr2wtoty/image/upload/v1786107893/Ceramic_plate_with_herbs_on_202608071304_bl72q1.jpg";

export default function MenuScreen() {
  const [isLoading, setIsLoading] = useState(true);
  const [menu, setMenu] = useState<any>(null);
  const [trialEndsAt, setTrialEndsAt] = useState<Date | null>(null);

  const { consumedMeals, setConsumedMeal, setWeeklyMenu } = useMenuStore();
  const [todayString, setTodayString] = useState(
    new Date(new Date().getTime() - (new Date().getTimezoneOffset() * 60000)).toISOString().split('T')[0]
  );

  useEffect(() => {
    fetchWeeklyMenu();
    fetchTodayLogs(); // Pour la synchronisation
  }, []);

  const fetchTodayLogs = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const date = new Date();
      const today = new Date(date.getTime() - (date.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
      setTodayString(today);

      const { data: logData } = await supabase
        .from('nutrition_daily_logs')
        .select('meals_logged')
        .eq('client_id', session.user.id)
        .eq('log_date', today)
        .maybeSingle();

      if (logData && logData.meals_logged) {
        logData.meals_logged.forEach((loggedMeal: any) => {
          if (loggedMeal.id) {
            setConsumedMeal(today, loggedMeal.id, true);
          }
        });
      }
    } catch (e) {
      console.error(e);
    }
  };

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
        setWeeklyMenu(data.weekly_menu);
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

  const handleAddMeal = async (meal: any) => {
    if (consumedMeals[`${todayString}-${meal.id}`]) return;

    // Simulate UI update instantly via Zustand
    setConsumedMeal(todayString, meal.id, true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setConsumedMeal(todayString, meal.id, false);
        return;
      }
      const userId = session.user.id;

      const todayDateString = todayString;

      // Get current log
      const { data: existingLog } = await supabase
        .from('nutrition_daily_logs')
        .select('id, calories_consumed, protein_consumed, carbs_consumed, fats_consumed, meals_logged')
        .eq('client_id', userId)
        .eq('log_date', todayDateString)
        .maybeSingle();

      const mealCals = meal.calories || 500;
      const mealPro = meal.protein || 30;
      const mealCarbs = meal.carbs || 45;
      const mealFats = meal.fats || 15;

      const updatedCalories = (existingLog?.calories_consumed || 0) + mealCals;
      const updatedProtein = (existingLog?.protein_consumed || 0) + mealPro;
      const updatedCarbs = (existingLog?.carbs_consumed || 0) + mealCarbs;
      const updatedFats = (existingLog?.fats_consumed || 0) + mealFats;

      const newMealLog = {
        id: meal.id,
        meal_type: meal.meal_type,
        recipe_name: meal.recipe_name,
        calories: mealCals
      };

      const currentMealsLogged = Array.isArray(existingLog?.meals_logged) ? existingLog.meals_logged : [];
      const updatedMealsLogged = [...currentMealsLogged, newMealLog];

      if (existingLog) {
        await supabase
          .from('nutrition_daily_logs')
          .update({
            calories_consumed: updatedCalories,
            protein_consumed: updatedProtein,
            carbs_consumed: updatedCarbs,
            fats_consumed: updatedFats,
            meals_logged: updatedMealsLogged
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
            meals_logged: updatedMealsLogged
          });
      }
    } catch (error) {
      console.error("Error logging meal from Sama Menu:", error);
      // Revert UI if needed on failure
      setConsumedMeal(todayString, meal.id, false);
    }
  };

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-zinc-950">
        <ActivityIndicator size="large" color="#39FF14" />
        <Text className="text-gray-500 mt-4" style={{ fontFamily: 'Poppins_400Regular' }}>Chargement du menu...</Text>
      </View>
    );
  }

  const now = new Date();
  const isPremium = trialEndsAt ? now <= trialEndsAt : false;

  const mockMenu = [
    {
      week: 1,
      title: 'Semaine 1',
      days: [
        {
          day_name: 'Lundi',
          meals: [
            {
              id: 'lundi-petit-dej',
              meal_type: 'Petit-déjeuner',
              recipe_name: 'Bouillie de mil (Lakh)',
              portion: '1 bol (300g)',
              image_url: null,
            },
            {
              id: 'lundi-dej',
              meal_type: 'Déjeuner',
              recipe_name: 'Thieboudienne Diététique',
              portion: '1 assiette (450g)',
              image_url: "https://res.cloudinary.com/dtr2wtoty/image/upload/v1781221768/Thiebou_dieune_1_hftdhm.jpg",
            },
            {
              id: 'lundi-diner',
              meal_type: 'Dîner',
              recipe_name: 'Salade de Fonio',
              portion: '1 bol (350g)',
              image_url: null,
            }
          ]
        },
        {
          day_name: 'Mardi',
          meals: [
            {
              id: 'mardi-dej',
              meal_type: 'Déjeuner',
              recipe_name: 'Yassa Poulet allégé',
              portion: '1 assiette (400g)',
              image_url: null,
            }
          ]
        }
      ]
    },
    {
      week: 2,
      title: 'Semaine 2',
      days: []
    },
    {
      week: 3,
      title: 'Semaine 3',
      days: []
    },
    {
      week: 4,
      title: 'Semaine 4',
      days: []
    }
  ];

  const weeklyStructure = menu && menu.length > 0 ? menu : mockMenu;

  return (
    <SafeAreaView className="flex-1 bg-zinc-950">
      {/* Container principal avec padding horizontal pour éviter de toucher les bords */}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100, paddingHorizontal: 16 }}>

        {/* Titre */}
        <Text className="text-white text-3xl mb-4 mt-4 font-bold" style={{ fontFamily: 'Poppins_700Bold' }}>
          Sama Menu
        </Text>

        {/* Boutons Globaux d'Action */}
        <View className="flex-row justify-between mb-8 space-x-4">
          <TouchableOpacity className="flex-1 bg-zinc-900 border border-zinc-800 py-3 rounded-2xl flex-row items-center justify-center">
            <RefreshCw color="#39FF14" size={20} className="mr-2" />
            <Text className="text-white font-bold" style={{ fontFamily: 'Poppins_700Bold' }}>Regénérer</Text>
          </TouchableOpacity>
          <TouchableOpacity className="flex-1 bg-zinc-900 border border-zinc-800 py-3 rounded-2xl flex-row items-center justify-center ml-2">
            <ShoppingCart color="#39FF14" size={20} className="mr-2" />
            <Text className="text-white font-bold" style={{ fontFamily: 'Poppins_700Bold' }}>Courses</Text>
          </TouchableOpacity>
        </View>

        {weeklyStructure.map((weekData: any, weekIndex: number) => {
          const isLocked = !isPremium && (weekIndex === 2 || weekIndex === 3);
          // Si la semaine n'a pas de jours définis, on met un mockup rapide pour la démo UI
          const daysToRender = weekData.days && weekData.days.length > 0 ? weekData.days : [
            { day_name: 'Lundi', meals: [{ id: `w${weekIndex}-d1-m1`, meal_type: 'Déjeuner', recipe_name: 'Repas non défini', portion: 'Standard', image_url: null }] }
          ];

          return (
            <View key={weekIndex} className="mb-10">
              <Text className="text-zinc-400 text-lg mb-4 font-bold uppercase tracking-wider ml-2" style={{ fontFamily: 'Poppins_700Bold' }}>
                {weekData.title || `Semaine ${weekIndex + 1}`}
              </Text>

              {daysToRender.map((dayData: any, dayIndex: number) => (
                <View
                  key={dayIndex}
                  className={`rounded-[2rem] bg-zinc-900/80 border border-zinc-800/80 p-6 mb-6 relative overflow-hidden`}
                  style={[
                    styles.bentoCard,
                    isLocked && { opacity: 0.5 }
                  ]}
                >
                  <Text className="text-[#39FF14] text-xl font-bold mb-4" style={{ fontFamily: 'Poppins_700Bold' }}>
                    {dayData.day_name}
                  </Text>

                  {dayData.meals?.map((meal: any, mealIndex: number) => {
                    const isAdded = consumedMeals[`${todayString}-${meal.id}`] || false;

                    return (
                      <View key={mealIndex} className="flex-row items-center mb-6 last:mb-0">
                        {/* Image du repas ou Fallback */}
                        <Image
                          source={{ uri: meal.image_url || FALLBACK_IMAGE }}
                          className="w-20 h-20 rounded-[1.25rem] mr-4"
                        />

                        <View className="flex-1 justify-center">
                          <Text className="text-zinc-400 text-xs uppercase mb-1" style={{ fontFamily: "Poppins_700Bold" }}>
                            {meal.meal_type}
                          </Text>
                          <Text className="text-white font-bold text-base mb-1 leading-tight" style={{ fontFamily: "Poppins_700Bold" }} numberOfLines={2}>
                            {meal.recipe_name}
                          </Text>
                          <Text className="text-zinc-500 text-xs mb-2" style={{ fontFamily: "Poppins_400Regular" }}>
                            Portion: {meal.portion || '1 standard'}
                          </Text>

                          {/* Bouton Ajouter */}
                          <TouchableOpacity
                            onPress={() => !isAdded && !isLocked && handleAddMeal(meal)}
                            disabled={isAdded || isLocked}
                            className={`flex-row items-center justify-center py-2 px-3 rounded-full self-start ${isAdded ? 'bg-zinc-800' : 'bg-[#39FF14]'}`}
                          >
                            {isAdded ? (
                              <>
                                <Check color="#39FF14" size={14} className="mr-1" />
                                <Text className="text-[#39FF14] font-bold text-xs" style={{ fontFamily: "Poppins_700Bold" }}>Ajouté</Text>
                              </>
                            ) : (
                              <>
                                <Plus color="#000" size={14} className="mr-1" />
                                <Text className="text-black font-bold text-xs" style={{ fontFamily: "Poppins_700Bold" }}>Ajouter</Text>
                              </>
                            )}
                          </TouchableOpacity>
                        </View>
                      </View>
                    );
                  })}

                  {/* Paywall Overlay for specific weeks */}
                  {isLocked && (
                    <View className="absolute inset-0 z-10 items-center justify-center">
                      <BlurView intensity={20} tint="dark" className="absolute inset-0" />
                      <View className="items-center bg-zinc-900/90 p-6 rounded-[2rem] w-full max-w-[280px] border border-zinc-800">
                        <View className="w-16 h-16 rounded-full bg-zinc-800 items-center justify-center mb-4">
                          <Lock color="#39FF14" size={32} />
                        </View>
                        <Text className="text-white text-center text-lg font-bold mb-4" style={{ fontFamily: "Poppins_700Bold" }}>Contenu Verrouillé</Text>
                        <Text className="text-gray-400 text-center text-xs mb-6" style={{ fontFamily: "Poppins_400Regular" }}>Votre période d'essai de 14 jours est terminée.</Text>
                        <TouchableOpacity className="bg-[#39FF14] w-full py-3 rounded-full items-center shadow-[0_0_15px_rgba(57,255,20,0.5)]">
                          <Text className="text-black font-bold text-xs uppercase text-center px-2" style={{ fontFamily: "Poppins_700Bold" }}>Débloquez - 2 900 F</Text>
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

const styles = StyleSheet.create({
  bentoCard: {
    shadowColor: '#39FF14',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 5,
  }
});
