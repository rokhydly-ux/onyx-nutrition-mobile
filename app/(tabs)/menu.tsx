import React, { useState, useEffect } from 'react';
import { View, Text, ActivityIndicator, Image, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Modal } from 'react-native';
import { supabase } from '../../lib/supabase';
import { useMenuStore } from '../../lib/store';
import { Moon, Sun, RefreshCw, ShoppingCart, Plus, CheckCircle, RefreshCcw } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';

export default function MenuScreen() {
  const [isLoading, setIsLoading] = useState(true);
  const { colorScheme, toggleColorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  const { weeklyMenu, setWeeklyMenu, consumedMeals, addConsumedMeal } = useMenuStore();

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
        setWeeklyMenu(data.weekly_menu); // Store original order
      }
    } catch (error) {
      console.error("Erreur Sama Menu:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddMeal = async (meal: any) => {
    // 1. Optimistic UI update via Zustand
    addConsumedMeal(meal);

    // 2. Background UPSERT to supabase
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const userId = session.user.id;
      const todayDateString = new Date().toISOString().split('T')[0];

      const { data: existingLog } = await supabase
        .from('nutrition_daily_logs')
        .select('*')
        .eq('client_id', userId)
        .eq('log_date', todayDateString)
        .maybeSingle();

      const updatedCalories = (existingLog?.calories_consumed || 0) + (meal.calories || 0);
      const updatedProtein = (existingLog?.protein_consumed || 0) + (meal.p || meal.proteines || 0);
      const updatedCarbs = (existingLog?.carbs_consumed || 0) + (meal.c || meal.glucides || 0);
      const updatedFats = (existingLog?.fats_consumed || 0) + (meal.f || meal.lipides || 0);

      const payload = {
        client_id: userId,
        log_date: todayDateString,
        calories_consumed: updatedCalories,
        protein_consumed: updatedProtein,
        carbs_consumed: updatedCarbs,
        fats_consumed: updatedFats,
      };

      if (existingLog) {
         await supabase.from('nutrition_daily_logs').update(payload).eq('id', existingLog.id);
      } else {
         await supabase.from('nutrition_daily_logs').insert([payload]);
      }
    } catch(e) {
      console.error(e);
    }
  };

  const handleSwapMeal = async (dayIndex: number, mealType: string) => {
    // Basic scaling logic using nutrition_recipes
    try {
      const { data: recipes } = await supabase.from('nutrition_recipes').select('*').limit(10);
      if (recipes && recipes.length > 0) {
        const randomRecipe = recipes[Math.floor(Math.random() * recipes.length)];

        // Use Zustand action
        const dayMenu = { ...weeklyMenu[dayIndex] };
        const oldMeal = dayMenu[mealType];

        // Basic scale: match calories
        const ratio = (oldMeal?.calories || randomRecipe.calories) / (randomRecipe.calories || 1);

        const newMeal = {
          ...randomRecipe,
          calories: Math.round(randomRecipe.calories * ratio),
          p: Math.round(randomRecipe.proteines * ratio),
          c: Math.round(randomRecipe.glucides * ratio),
          f: Math.round(randomRecipe.lipides * ratio)
        };

        dayMenu[mealType] = newMeal;

        // This should theoretically update zustand, but we don't have updateWeeklyMenuDay in this component's destruction
        // Wait, I can destructure it. Let's add it.
        // Actually, we'll just reconstruct the weekly menu and use setWeeklyMenu

        const newWeeklyMenu = [...weeklyMenu];
        newWeeklyMenu[dayIndex] = dayMenu;
        setWeeklyMenu(newWeeklyMenu);

        // Background sync to supabase
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
           // We need to reverse the shift done during mapping
           // Since dayIndex 0 is "Today", which corresponds to currentDayIndex in DB
           // ...
           // For simplicity, we just save the newly sorted menu back, but the DB expects Monday=0.
           // Actually, it's safer to not persist sorting changes to DB format right away if complex,
           // but the prompt says: "remplace l'ancien plat par le nouveau dans weeklyMenu et fait un .update() de la colonne weekly_menu dans la table nutrition_profiles."
           // Let's assume the order in DB doesn't strictly matter as long as it's an array of 7.
           await supabase.from('nutrition_profiles').update({ weekly_menu: newWeeklyMenu }).eq('client_id', session.user.id);
        }
      }
    } catch (e) {
      console.error("Erreur Swap:", e);
    }
  };

  const handleRegenerateMenu = async () => {
    try {
      setIsLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data: profileData } = await supabase
        .from('nutrition_profiles')
        .select('*')
        .eq('client_id', session.user.id)
        .maybeSingle();

      if (!profileData) return;

      // Basic regeneration logic based on budget/allergies
      const { data: recipes } = await supabase.from('nutrition_recipes').select('*');
      if (!recipes || recipes.length === 0) return;

      const daysOfWeekFr = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];
      const newMenu = [];
      const targetCalories = profileData.daily_calorie_goal || 2000;
      // Budget/allergy filter could be applied here if data was present on recipes
      // For now, randomly pick and scale
      for (let i = 0; i < 7; i++) {
         const pDej = recipes[Math.floor(Math.random() * recipes.length)];
         const dej = recipes[Math.floor(Math.random() * recipes.length)];
         const col = recipes[Math.floor(Math.random() * recipes.length)];
         const din = recipes[Math.floor(Math.random() * recipes.length)];

         const scale = (recipe, target) => {
            const ratio = target / (recipe.calories || 1);
            return {
               ...recipe,
               calories: Math.round(recipe.calories * ratio),
               p: Math.round(recipe.proteines * ratio),
               c: Math.round(recipe.glucides * ratio),
               f: Math.round(recipe.lipides * ratio),
            };
         };

         // Simple split: 25% Breakfast, 35% Lunch, 10% Collation, 30% Dinner
         newMenu.push({
            date: new Date(new Date().getTime() + i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            dayName: daysOfWeekFr[i],
            petitDejeuner: scale(pDej, targetCalories * 0.25),
            dejeuner: scale(dej, targetCalories * 0.35),
            collation: scale(col, targetCalories * 0.10),
            diner: scale(din, targetCalories * 0.30)
         });
      }

      await supabase.from('nutrition_profiles').update({ weekly_menu: newMenu }).eq('client_id', session.user.id);
      setWeeklyMenu(newMenu);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const [groceryModalVisible, setGroceryModalVisible] = useState(false);
  const [groceryList, setGroceryList] = useState<any[]>([]);

  const handleGroceryList = () => {
    // Generate grocery list from weeklyMenu
    let ingredientsMap: any = {};
    weeklyMenu.forEach(day => {
      ['petitDejeuner', 'dejeuner', 'collation', 'diner'].forEach(mealType => {
        if (day[mealType] && day[mealType].ingredients) {
          day[mealType].ingredients.forEach((ing: any) => {
             const key = ing.name || ing.nom;
             if (!key) return;
             if (ingredientsMap[key]) {
               ingredientsMap[key].quantity += (ing.quantite || ing.quantity || 1);
             } else {
               ingredientsMap[key] = { name: key, quantity: (ing.quantite || ing.quantity || 1), price: ing.price_cfa || 0 };
             }
          });
        }
      });
    });
    setGroceryList(Object.values(ingredientsMap));
    setGroceryModalVisible(true);
  };

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white dark:bg-zinc-950">
        <ActivityIndicator size="large" color="#39FF14" />
        <Text className="text-gray-500 mt-4" style={{ fontFamily: 'Poppins_400Regular' }}>Chargement du menu...</Text>
      </View>
    );
  }

  const daysOfWeekFr = ["LUNDI", "MARDI", "MERCREDI", "JEUDI", "VENDREDI", "SAMEDI", "DIMANCHE"];

  return (
    <View className="flex-1 bg-zinc-50 dark:bg-zinc-950 pt-4">
      <SafeAreaView className="flex-1 px-4 pb-20" edges={['top']}>

        {/* Header Sama Menu */}
        <View className="flex-row justify-between items-center mb-6">
          <Text className="text-black dark:text-white text-3xl font-black uppercase tracking-tighter" style={{ fontFamily: 'Poppins_900Black' }}>MON SAMA MENU</Text>
          <View className="flex-row items-center gap-3">
            <TouchableOpacity onPress={handleRegenerateMenu} className="w-10 h-10 bg-zinc-200 dark:bg-zinc-800 rounded-full items-center justify-center">
              <RefreshCw size={18} color={isDark ? "#FFF" : "#000"} />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleGroceryList} className="w-10 h-10 bg-zinc-200 dark:bg-zinc-800 rounded-full items-center justify-center">
              <ShoppingCart size={18} color={isDark ? "#FFF" : "#000"} />
            </TouchableOpacity>
            <TouchableOpacity onPress={toggleColorScheme} className="w-10 h-10 bg-zinc-200 dark:bg-zinc-800 rounded-full items-center justify-center">
              {isDark ? <Sun size={18} color="#FFF" /> : <Moon size={18} color="#000" />}
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
          {(() => {
            if (!weeklyMenu || weeklyMenu.length === 0) return null;
            const currentDayIndex = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1;
            const sortedMenu = [
              ...weeklyMenu.slice(currentDayIndex).map((d, i) => ({ ...d, originalIndex: currentDayIndex + i })),
              ...weeklyMenu.slice(0, currentDayIndex).map((d, i) => ({ ...d, originalIndex: i }))
            ];

            return sortedMenu.map((day: any, renderIndex: number) => {
              const isToday = renderIndex === 0; // The active displayed "today" day is at renderIndex 0
              const dayIndex = day.originalIndex; // Ensure we pass the REAL index to swap

              const mealTypes = [

              { key: 'petitDejeuner', label: 'Petit-déjeuner' },
              { key: 'dejeuner', label: 'Déjeuner' },
              { key: 'collation', label: 'Collation' },
              { key: 'diner', label: 'Dîner' }
            ];

            return (
              <View
                key={dayIndex}
                className={`mb-6 p-4 rounded-3xl border-2 ${isToday ? 'border-[#39FF14] bg-white dark:bg-zinc-900 opacity-100 shadow-[0_0_15px_rgba(57,255,20,0.2)]' : 'border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900/50 opacity-60'}`}
              >
                <View className="mb-4 flex-row items-center justify-between">
                  <Text className={`text-lg font-black uppercase ${isToday ? 'text-black dark:text-white' : 'text-gray-500'}`} style={{ fontFamily: 'Poppins_900Black' }}>
                    {isToday ? "AUJOURD'HUI" : day.dayName || `JOUR ${dayIndex + 1}`}
                  </Text>
                  {isToday && (
                    <View className="bg-[#39FF14]/20 px-2 py-1 rounded-md">
                      <Text className="text-[#39FF14] text-[10px] font-bold">En cours</Text>
                    </View>
                  )}
                </View>

                <View className="gap-3">
                  {mealTypes.map((typeObj) => {
                    const meal = day[typeObj.key];
                    if (!meal) return null;

                    const isConsumed = consumedMeals.some(m => m.id === meal.id && m.date === day.date);

                    return (
                      <View key={typeObj.key} className="flex-row items-center bg-zinc-50 dark:bg-zinc-800/50 p-3 rounded-2xl border border-zinc-200 dark:border-zinc-800">
                        <Image source={{ uri: meal.image_url || 'https://via.placeholder.com/50' }} className="w-12 h-12 rounded-xl mr-3" resizeMode="cover" />

                        <View className="flex-1">
                          <Text className="text-gray-400 text-[10px] font-bold uppercase mb-0.5">{typeObj.label}</Text>
                          <Text className="text-black dark:text-white font-bold text-sm mb-1" numberOfLines={1}>{meal.nom || meal.name}</Text>
                          <Text className="text-gray-500 text-[10px] font-medium">🔥 {meal.calories} kcal | 🍗 {meal.p || meal.proteines}g | 🍞 {meal.c || meal.glucides}g | 🥑 {meal.f || meal.lipides}g</Text>
                        </View>

                        <View className="flex-row items-center gap-2 ml-2">
                          <TouchableOpacity onPress={() => handleSwapMeal(dayIndex, typeObj.key)} className="w-8 h-8 bg-zinc-200 dark:bg-zinc-700 rounded-full items-center justify-center">
                            <RefreshCcw size={14} color={isDark ? "#FFF" : "#000"} />
                          </TouchableOpacity>

                          <TouchableOpacity
                            onPress={() => handleAddMeal({ ...meal, date: day.date })}
                            className={`w-8 h-8 rounded-full items-center justify-center ${isConsumed ? 'bg-[#39FF14]' : 'bg-black dark:bg-white'}`}
                          >
                            {isConsumed ? <CheckCircle size={14} color="#000" /> : <Plus size={14} color={isDark ? "#000" : "#FFF"} />}
                          </TouchableOpacity>
                        </View>
                      </View>
                    );
                  })}
                </View>
              </View>
            );
            });
          })()}
        </ScrollView>
      </SafeAreaView>

      {/* Grocery Modal */}
      <Modal visible={groceryModalVisible} animationType="slide" transparent>
        <View className="flex-1 bg-black/90 p-4 pt-12">
          <View className="flex-row justify-between items-center mb-6">
            <Text className="text-white text-2xl font-bold font-poppins-bold">Liste de Courses</Text>
            <TouchableOpacity onPress={() => setGroceryModalVisible(false)} className="w-10 h-10 bg-zinc-800 rounded-full items-center justify-center">
              <Text className="text-white font-bold">X</Text>
            </TouchableOpacity>
          </View>
          <ScrollView className="flex-1">
            {groceryList.length > 0 ? groceryList.map((item, idx) => (
              <View key={idx} className="bg-zinc-800 p-4 rounded-xl mb-3 flex-row justify-between">
                <Text className="text-white font-bold">{item.name}</Text>
                <Text className="text-gray-400">{item.quantity} - {item.price ? item.price + ' FCFA' : ''}</Text>
              </View>
            )) : (
              <Text className="text-gray-500 text-center mt-10">Aucun ingrédient trouvé dans le menu.</Text>
            )}
          </ScrollView>
        </View>
      </Modal>

    </View>
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
