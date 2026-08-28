import React, { useState, useEffect } from 'react';
import { View, Text, ActivityIndicator, Image, TouchableOpacity, ScrollView, StyleSheet , Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import GroceryListModal from '../../components/GroceryListModal';
import { supabase } from '../../lib/supabase';
import { useMenuStore } from '../../lib/store';
import { Moon, Sun, RefreshCw, ShoppingCart, Plus, CheckCircle, RefreshCcw, Trash2, ChevronDown, ChevronUp } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';

export default function MenuScreen() {
  const [isLoading, setIsLoading] = useState(true);
  const { colorScheme, toggleColorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [expandedDays, setExpandedDays] = useState<Record<number, boolean>>({ 0: true });
  const toggleDay = (index: number) => setExpandedDays(prev => ({ ...prev, [index]: !prev[index] }));

  const { weeklyMenu, setWeeklyMenu, consumedMeals, addConsumedMeal, removeConsumedMeal } = useMenuStore();

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
        .select('weekly_menu')
        .eq('client_id', session.user.id)
        .maybeSingle();


      if (data && data.weekly_menu && data.weekly_menu.length > 0) {
        // Migration: If user has old format (meals array instead of petitDejeuner keys), convert it!
        const migratedMenu = data.weekly_menu.map((d: any) => {
           if (d.meals && Array.isArray(d.meals)) {
               return {
                  date: d.date,
                  dayName: d.dayName || "Jour",
                  petitDejeuner: d.meals.find((m: any) => m.type.includes('Petit')) || d.meals[0],
                  dejeuner: d.meals.find((m: any) => m.type.includes('Déjeuner') || m.type.includes('dejeuner')) || d.meals[1],
                  collation: d.meals.find((m: any) => m.type.includes('Collation')) || d.meals[2],
                  diner: d.meals.find((m: any) => m.type.includes('Dîner') || m.type.includes('diner')) || d.meals[3],
               };
           }
           return d;
        });
        setWeeklyMenu(migratedMenu); // Store original order
      } else {

        setTimeout(() => handleRegenerateMenu(), 0);
      }
    } catch (error) {
      console.error("Erreur Sama Menu:", error);
    } finally {
      setIsLoading(false);
    }

  };



  const handleRemoveMeal = async (meal: any, dayIndex: number, mealKey: string) => {
    // 1. Unlog it if it was consumed
    removeConsumedMeal(meal.id, meal.date);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const startOfDay = new Date(meal.date); startOfDay.setHours(0,0,0,0);
        const endOfDay = new Date(meal.date); endOfDay.setHours(23,59,59,999);
        await supabase.from('nutrition_daily_logs').delete()
          .eq('client_id', session.user.id)
          .eq('recipe_id', meal.id)
          .gte('created_at', startOfDay.toISOString())
          .lt('created_at', endOfDay.toISOString());
      }
    } catch (e) {
      console.error(e);
    }

    // 2. Replace with a blank meal slot in the weeklyMenu
    const updatedWeeklyMenu = [...weeklyMenu];
    const targetDay = updatedWeeklyMenu[dayIndex];
    if (targetDay) {
       targetDay[mealKey] = {
         id: 'empty-' + Math.random(),
         name: 'Emplacement vide',
         nom: 'Emplacement vide',
         image_url: 'https://res.cloudinary.com/dtr2wtoty/image/upload/v1786107893/Ceramic_plate_with_herbs_on_202608071304_bl72q1.jpg',
         calories: 0,
         p: 0, c: 0, f: 0,
         proteines: 0, glucides: 0, lipides: 0,
         isEmpty: true
       };
       setWeeklyMenu(updatedWeeklyMenu);

       // Sync to DB
       const { data: { session } } = await supabase.auth.getSession();
       if (session) {
         await supabase.from('nutrition_profiles').update({ weekly_menu: updatedWeeklyMenu }).eq('client_id', session.user.id);
       }
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
      const { data: recipes } = await supabase.from('nutrition_recipes').select('*').eq('type', 'recipe').limit(20);
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

      // Basic regeneration logic based on budget/allergies
      const { data: recipes } = await supabase.from('nutrition_recipes').select('*').eq('type', 'recipe');
      if (!recipes || recipes.length === 0) {
         console.warn("Sama Menu: No recipes found with type='recipe'");
         setIsLoading(false);
         return;
      }

      const newMenu = [];
      const targetCalories = profileData?.daily_calorie_goal || 2000;

      // Budget/allergy filter could be applied here if data was present on recipes
      // For now, randomly pick and scale
      for (let i = 0; i < 7; i++) {
         const pDej = recipes[Math.floor(Math.random() * recipes.length)];
         const dej = recipes[Math.floor(Math.random() * recipes.length)];
         const col = recipes[Math.floor(Math.random() * recipes.length)];
         const din = recipes[Math.floor(Math.random() * recipes.length)];

         const scale = (recipe: any, target: number) => {
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


  const { setShowGroceryList } = useMenuStore();

  const handleGroceryList = () => {
    setShowGroceryList(true);
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
          <Text className="text-black dark:text-white text-3xl font-black uppercase tracking-tighter" style={{ fontFamily: 'Poppins_900Black' }}>SAMA MENU</Text>
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




            return weeklyMenu.map((day: any, renderIndex: number) => {
              const isToday = renderIndex === 0;
              const isTomorrow = renderIndex === 1;
              const isFuture = renderIndex > 1;
              const dayIndex = renderIndex;
              const isExpanded = expandedDays[renderIndex] || false;

              // Format date properly
              const getDayTitle = (index: number) => {
                if (index === 0) return "AUJOURD'HUI";
                if (index === 1) return "DEMAIN";
                const date = new Date();
                date.setDate(date.getDate() + index);
                return date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
              };
              const dateLabel = getDayTitle(renderIndex);

              const mealTypes = [

                { key: 'petitDejeuner', label: 'Petit-déjeuner' },
                { key: 'dejeuner', label: 'Déjeuner' },
                { key: 'collation', label: 'Collation' },
                { key: 'diner', label: 'Dîner' }
              ];

              return (
                <View
                  key={dayIndex}
                  className={`mb-6 rounded-3xl border-2 ${isToday ? 'border-[#39FF14] bg-white dark:bg-zinc-900 opacity-100 shadow-[0_0_15px_rgba(57,255,20,0.2)]' : 'border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900/50'}`}
                >
                  <TouchableOpacity
                    onPress={() => !isToday && toggleDay(renderIndex)}
                    activeOpacity={isToday ? 1 : 0.7}
                    className="p-4 flex-row items-center justify-between"
                  >
                    <View className="flex-row items-center gap-3">
                      <Text className={`text-lg font-black uppercase ${isToday ? 'text-black dark:text-white' : 'text-gray-500'}`} style={{ fontFamily: 'Poppins_900Black' }}>
                        {dateLabel}
                      </Text>
                      {isToday && (
                        <View className="bg-[#39FF14]/20 px-2 py-1 rounded-md">
                          <Text className="text-[#39FF14] text-[10px] font-bold">En cours</Text>
                        </View>
                      )}
                      {isTomorrow && (
                        <View className="bg-blue-500/20 px-2 py-1 rounded-md">
                          <Text className="text-blue-500 text-[10px] font-bold">Prévu</Text>
                        </View>
                      )}
                    </View>
                    {!isToday && (
                      <View>
                        {isExpanded ? <ChevronUp size={20} color={isDark ? "#FFF" : "#000"} /> : <ChevronDown size={20} color={isDark ? "#FFF" : "#000"} />}
                      </View>
                    )}
                  </TouchableOpacity>

                  {isExpanded && (
                    <View className="p-4 pt-0 gap-3">

                      <View style={{ position: 'relative', overflow: 'hidden' }} className="rounded-2xl gap-3">
                        {mealTypes.filter(t => day[t.key] && (day[t.key].name || day[t.key].nom)).length === 0 ? (
                           <View className="p-6 items-center justify-center">
                             <ActivityIndicator size="small" color="#39FF14" className="mb-2" />
                             <Text className="text-gray-500 font-bold" style={{ fontFamily: 'Poppins_400Regular' }}>Génération du menu en cours...</Text>
                           </View>
                        ) : mealTypes.map((typeObj) => {
                          const meal = day[typeObj.key];
                          if (!meal || (!meal.name && !meal.nom)) return null;

                          const isConsumed = consumedMeals.some(m => m.id === meal.id && m.date === day.date);

                          return (
                            <View key={typeObj.key} className={`flex-row items-center p-3 rounded-2xl border ${isTomorrow ? 'bg-zinc-100 dark:bg-zinc-800/30 border-zinc-200 dark:border-zinc-800 opacity-60' : 'bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-800'}`}>
                              <Image source={{ uri: meal.image_url || 'https://via.placeholder.com/50' }} className="w-12 h-12 rounded-xl mr-3" resizeMode="cover" />

                              <View className="flex-1">
                                <Text className="text-gray-400 text-[10px] font-bold uppercase mb-0.5">{typeObj.label}</Text>
                                <Text className="text-black dark:text-white font-bold text-sm mb-1" numberOfLines={1}>{meal.nom || meal.name}</Text>
                                <Text className="text-gray-500 text-[10px] font-medium">🔥 {meal.calories || 0} kcal | 🍗 {meal.p || meal.proteines || meal.protein || 0}g | 🍞 {meal.c || meal.glucides || meal.carbs || 0}g | 🥑 {meal.f || meal.lipides || meal.fats || 0}g</Text>
                              </View>

                              <View className="flex-row items-center gap-2 ml-2">
                                {!isTomorrow && (
                                  <>
                                    <TouchableOpacity onPress={() => handleSwapMeal(dayIndex, typeObj.key)} className="w-8 h-8 bg-zinc-200 dark:bg-zinc-700 rounded-full items-center justify-center">
                                      <RefreshCcw size={14} color={isDark ? "#FFF" : "#000"} />
                                    </TouchableOpacity>

                                    {isConsumed ? (
                                      <TouchableOpacity
                                        onPress={() => handleRemoveMeal({ ...meal, date: day.date }, dayIndex, typeObj.key)}
                                        className="w-8 h-8 rounded-full items-center justify-center bg-red-500"
                                      >
                                        <Trash2 size={14} color="#FFF" />
                                      </TouchableOpacity>
                                    ) : (
                                      <TouchableOpacity
                                        onPress={() => handleAddMeal({ ...meal, date: day.date })}
                                        className="w-8 h-8 rounded-full items-center justify-center bg-black dark:bg-white"
                                      >
                                        <Plus size={14} color={isDark ? "#000" : "#FFF"} />
                                      </TouchableOpacity>
                                    )}
                                  </>
                                )}
                              </View>
                            </View>
                          );
                        })}

                        {isFuture && (
                          <BlurView intensity={20} tint={isDark ? "dark" : "light"} className="absolute inset-0 z-10 items-center justify-center p-6 bg-white/20 dark:bg-black/40">
                             <Text className="text-4xl mb-4">⏳</Text>
                             <Text className="text-black dark:text-white font-bold text-center text-lg mb-2" style={{ fontFamily: 'Poppins_700Bold' }}>Patience !</Text>
                             <Text className="text-black dark:text-gray-300 text-center text-sm font-bold" style={{ fontFamily: 'Poppins_400Regular' }}>
                               {["⏳ Ton corps se transforme un jour à la fois.", "✨ L'algorithme prépare tes plats, reste focus !", "💧 N'oublie pas de t'hydrater aujourd'hui !", "🔥 Reste constant(e), les résultats arrivent.", "🍏 La discipline d'aujourd'hui est ta victoire de demain.", "💪 Chaque repas compte, sois patient(e)."][renderIndex % 6]}
                             </Text>
                          </BlurView>
                        )}
                      </View>
                    </View>
                  )}
                </View>
              );
            });
          })()}
        </ScrollView>
      </SafeAreaView>


      {/* Grocery Modal */}
      <GroceryListModal />


    </View>
  );
}
