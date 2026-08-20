import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, ImageBackground, ActivityIndicator, Pressable, Modal, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColorScheme } from 'nativewind';
import { ChevronLeft, CheckCircle } from 'lucide-react-native';
import CircularProgress from '../../components/CircularProgress';
import { supabase } from '../../lib/supabase';

// Helper component for the macros bars
const MacroBar = ({ label, current, max, color }: { label: string, current: number, max: number, color: string }) => {
  const percentage = max > 0 ? Math.min((current / max) * 100, 100) : 0;
  return (
    <View className="mb-3">
      <View className="flex-row justify-between mb-1">
        <Text className="text-gray-800 dark:text-gray-200 text-xs font-medium">{label}</Text>
        <Text className="text-gray-500 dark:text-gray-400 text-xs">{Math.round(current)} / {Math.round(max)}g</Text>
      </View>
      <View className="w-full h-2 rounded-full bg-gray-200 dark:bg-zinc-800 overflow-hidden">
        <View style={{ width: `${percentage}%`, backgroundColor: color }} className="h-full rounded-full" />
      </View>
    </View>
  );
};

export default function MyDayScreen() {
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [mode, setMode] = useState<'guided' | 'free'>('guided');
  const [isLoading, setIsLoading] = useState(true);

  const [profile, setProfile] = useState<any>({
    calories_goal: 1500,
    protein_goal: 80,
    carbs_goal: 150,
    fats_goal: 50,
    diagnostic_data: null
  });

  const [dailyStats, setDailyStats] = useState({
    calories_consumed: 0,
    protein_consumed: 0,
    carbs_consumed: 0,
    fats_consumed: 0,
    water_glasses: 0,
  });

  const [meals, setMeals] = useState<any[]>([]);
  const [isSearchModalVisible, setIsSearchModalVisible] = useState(false);
  const [foodSearchQuery, setFoodSearchQuery] = useState('');
  const [foodSearchResults, setFoodSearchResults] = useState<any[]>([]);
  const [isSearchingFood, setIsSearchingFood] = useState(false);
  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => {
    fetchMyDayData();

    let channel: any;

    const setupRealtime = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const userId = session.user.id;
      const todayDateString = new Date().toISOString().split('T')[0];

      channel = supabase.channel('daily_logs_sync')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'nutrition_daily_logs',
            filter: `client_id=eq.${userId}`,
          },
          (payload) => {
            const newLog = payload.new as any;
            if (newLog && newLog.log_date === todayDateString) {
              setDailyStats((prev: any) => ({
                ...prev,
                calories_consumed: newLog.calories_consumed || 0,
                protein_consumed: newLog.protein_consumed || 0,
                carbs_consumed: newLog.carbs_consumed || 0,
                fats_consumed: newLog.fats_consumed || 0,
                water_glasses: newLog.water_glasses || 0,
              }));
              // Also update XP in profile if needed?
              // The XP might be in nutrition_profiles, so we should listen to that as well!
            }
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'nutrition_profiles',
            filter: `client_id=eq.${userId}`,
          },
          (payload) => {
            const newProfile = payload.new as any;
            if (newProfile) {
               setProfile((prev: any) => ({
                 ...prev,
                 jongoma_xp: newProfile.jongoma_xp || 0
               }));
            }
          }
        )
        .subscribe();
    };

    setupRealtime();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  const fetchMyDayData = async () => {
    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const userId = session.user.id;
      const todayDateString = new Date().toISOString().split('T')[0];

      // Fetch goals
      const { data: nutritionData } = await supabase
        .from('nutrition_profiles')
        .select('*')
        .eq('client_id', userId)
        .maybeSingle();

      if (nutritionData) {
        setProfile({
          calories_goal: nutritionData.daily_calorie_goal || 1500,
          protein_goal: nutritionData.protein_goal || 80,
          carbs_goal: nutritionData.carbs_goal || 150,
          fats_goal: nutritionData.fats_goal || 50,
          diagnostic_data: nutritionData.diagnostic_data || null,
          jongoma_xp: nutritionData.jongoma_xp || 0,
        });
      }

      // Fetch day logs
      const { data: todayLog } = await supabase
        .from('nutrition_daily_logs')
        .select('*')
        .eq('client_id', userId)
        .eq('log_date', todayDateString)
        .maybeSingle();

      if (todayLog) {
        setDailyStats({
          calories_consumed: todayLog.calories_consumed || 0,
          protein_consumed: todayLog.protein_consumed || 0,
          carbs_consumed: todayLog.carbs_consumed || 0,
          fats_consumed: todayLog.fats_consumed || 0,
          water_glasses: todayLog.water_glasses || 0,
        });
      }

      // Fetch Boutique Onyx products
      const { data: prodData } = await supabase
        .from('nutrition_products')
        .select('*')
        .limit(3);
      if (prodData) {
        setProducts(prodData);
      }

      // Mock meals for now based on mockup structure
      setMeals([
        { id: '1', type: 'PETIT-DÉJEUNER', name: 'Bouillie de mil', calories: 250, p: 8, c: 45, f: 5, img: 'https://res.cloudinary.com/dtr2wtoty/image/upload/v1781222471/Bouillie_de_mil_r2zihq.jpg' },
        { id: '2', type: 'DÉJEUNER', name: 'Fonio aux Crevettes & Poivrons', calories: 480, p: 58, c: 0, f: 25, img: 'https://res.cloudinary.com/dtr2wtoty/image/upload/v1781221768/Thiebou_dieune_1_hftdhm.jpg' },
      ]);

    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateWater = async (glasses: number) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const userId = session.user.id;
      const todayDateString = new Date().toISOString().split('T')[0];

      const { data: existingLog } = await supabase
        .from('nutrition_daily_logs')
        .select('id')
        .eq('client_id', userId)
        .eq('log_date', todayDateString)
        .maybeSingle();

      if (existingLog) {
        await supabase
          .from('nutrition_daily_logs')
          .update({ water_glasses: glasses })
          .eq('id', existingLog.id);
      } else {
        await supabase
          .from('nutrition_daily_logs')
          .insert({
            client_id: userId,
            log_date: todayDateString,
            water_glasses: glasses
          });
      }

      setDailyStats((prev: any) => ({ ...prev, water_glasses: glasses }));
    } catch (e) {
      console.error("Error updating water:", e);
    }
  };

  const [coachBubble, setCoachBubble] = useState<{visible: boolean, message: string}>({ visible: false, message: '' });

  const triggerCoachBubble = (message: string) => {
    setCoachBubble({ visible: true, message });
    setTimeout(() => setCoachBubble({ visible: false, message: '' }), 4000);
  };

  const handleRemoveMeal = async (meal: any) => {
    // Logic to reverse the logged meal
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

      if (existingLog) {
        const updatedCalories = Math.max(0, (existingLog.calories_consumed || 0) - (meal.calories || 0));
        const updatedProtein = Math.max(0, (existingLog.protein_consumed || 0) - (meal.p || 0));
        const updatedCarbs = Math.max(0, (existingLog.carbs_consumed || 0) - (meal.c || 0));
        const updatedFats = Math.max(0, (existingLog.fats_consumed || 0) - (meal.f || 0));

        await supabase
          .from('nutrition_daily_logs')

          .update({
            calories_consumed: updatedCalories,
            protein_consumed: updatedProtein,
            carbs_consumed: updatedCarbs,
            fats_consumed: updatedFats,
          })
          .eq('id', existingLog.id);


        setDailyStats((prev: any) => ({
          ...prev,
          calories_consumed: updatedCalories,
          protein_consumed: updatedProtein,
          carbs_consumed: updatedCarbs,
          fats_consumed: updatedFats
        }));

        setMeals(prev => prev.map(m => m.id === meal.id ? { ...m, logged: false } : m));
      }
    } catch (e) {
      console.error("Error removing meal:", e);
    }
  };

    const handleFoodSearch = async () => {
    if (!foodSearchQuery) return;
    setIsSearchingFood(true);
    try {
      // 1. Search OpenFoodFacts
      const offRes = await fetch(`https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(foodSearchQuery)}&search_simple=1&action=process&json=1`);
      const offData = await offRes.json();

      const parsedResults = (offData.products || []).map((p: any) => ({
        id: p._id || p.id,
        name: p.product_name || p.product_name_fr || 'Aliment inconnu',
        calories: p.nutriments && p.nutriments['energy-kcal_100g'] ? p.nutriments['energy-kcal_100g'] : 0,
        p: p.nutriments && p.nutriments.proteins_100g ? p.nutriments.proteins_100g : 0,
        c: p.nutriments && p.nutriments.carbohydrates_100g ? p.nutriments.carbohydrates_100g : 0,
        f: p.nutriments && p.nutriments.fat_100g ? p.nutriments.fat_100g : 0,
        img: p.image_front_url || 'https://via.placeholder.com/150',
        type: '100g'
      })).filter((p: any) => p.calories > 0);

      setFoodSearchResults(parsedResults);
    } catch(e) {
      console.error(e);
    } finally {
      setIsSearchingFood(false);
    }
  };

  const handleLogMeal = async (meal: any) => {
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


      setDailyStats((prev: any) => ({
        ...prev,
        calories_consumed: updatedCalories,
        protein_consumed: updatedProtein,
        carbs_consumed: updatedCarbs,
        fats_consumed: updatedFats
      }));

      setMeals(prev => prev.map(m => m.id === meal.id ? { ...m, logged: true } : m));
      triggerCoachBubble("Super choix ! Repas validé, tu es sur la bonne voie !");

    } catch (e) {
      console.error("Error logging meal:", e);
    }
  };

  const caloriesProgress = profile.calories_goal > 0 ? (dailyStats.calories_consumed / profile.calories_goal) : 0;

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-white dark:bg-zinc-950 justify-center items-center">
        <ActivityIndicator size="large" color="#39FF14" />

    </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-zinc-950 font-sans relative">
      {/* Search Food Modal */}
      <Modal visible={isSearchModalVisible} animationType="slide" transparent>
        <View className="flex-1 bg-black/90 p-4 pt-12">
          <View className="flex-row justify-between items-center mb-6">
            <Text className="text-white text-2xl font-bold font-poppins-bold">Ajouter un aliment</Text>
            <TouchableOpacity onPress={() => setIsSearchModalVisible(false)} className="w-10 h-10 bg-zinc-800 rounded-full items-center justify-center">
              <Text className="text-white font-bold">✕</Text>
            </TouchableOpacity>
          </View>

          <View className="flex-row items-center bg-zinc-800 rounded-2xl p-2 mb-6 border border-zinc-700">
            <TextInput
              value={foodSearchQuery}
              onChangeText={setFoodSearchQuery}
              placeholder="Rechercher (ex: Pomme, Fonio...)"
              placeholderTextColor="#9CA3AF"
              className="flex-1 text-white px-4 py-2"
              onSubmitEditing={handleFoodSearch}
            />
            <TouchableOpacity onPress={handleFoodSearch} className="bg-[#39FF14] px-4 py-2 rounded-xl">
              <Text className="text-black font-bold">Chercher</Text>
            </TouchableOpacity>
          </View>

          {isSearchingFood ? (
            <ActivityIndicator size="large" color="#39FF14" className="mt-10" />
          ) : (
            <ScrollView className="flex-1">
              {foodSearchResults.map((food, idx) => (
                <View key={idx} className="bg-zinc-900 p-4 rounded-2xl mb-3 flex-row items-center justify-between border border-zinc-800">
                  <View className="flex-row items-center flex-1">
                    <Image source={{ uri: food.img }} className="w-12 h-12 rounded-lg mr-3 bg-zinc-800" />
                    <View className="flex-1">
                      <Text className="text-white font-bold" numberOfLines={1}>{food.name}</Text>
                      <Text className="text-gray-400 text-xs mt-1">{food.calories} kcal | {food.p}g P | {food.c}g G | {food.f}g L</Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    onPress={() => {
                      handleLogMeal(food);
                      setIsSearchModalVisible(false);
                      setFoodSearchQuery('');
                      setFoodSearchResults([]);
                    }}
                    className="bg-[#39FF14] w-10 h-10 rounded-full items-center justify-center ml-2"
                  >
                    <Text className="text-black font-bold text-lg">+</Text>
                  </TouchableOpacity>
                </View>
              ))}
              {foodSearchResults.length === 0 && foodSearchQuery !== '' && !isSearchingFood && (
                <Text className="text-gray-500 text-center mt-10">Aucun résultat trouvé pour "{foodSearchQuery}".</Text>
              )}
            </ScrollView>
          )}
        </View>
      </Modal>

      {coachBubble.visible && (
        <View className="absolute bottom-20 left-4 right-4 bg-zinc-900 rounded-3xl p-4 flex-row items-center shadow-lg border border-[#39FF14]/30 z-50">
          <Image source={{ uri: "https://res.cloudinary.com/dtr2wtoty/image/upload/v1784209735/557516971_10235324002253110_1070574324835198049_n_ch9we7.jpg" }} className="w-12 h-12 rounded-full border-2 border-[#39FF14] mr-3" />
          <Text className="flex-1 text-white text-xs" style={{ fontFamily: 'Poppins_500Medium' }}>{coachBubble.message}</Text>
        </View>
      )}
      <ScrollView className="flex-1 px-4 pt-12 pb-24" showsVerticalScrollIndicator={false}>


        {/* 1. EN-TÊTE DE PAGE */}
        <View className="mb-6">
          <TouchableOpacity onPress={() => router.back()} className="flex-row items-center mb-4">
            <ChevronLeft size={20} color={isDark ? '#FFF' : '#000'} />
            <Text className="text-black dark:text-white text-sm font-medium ml-1">Retour à l'accueil</Text>
          </TouchableOpacity>

          <View className="flex-col">
            <View className="flex-row items-center justify-between mb-4">
              <View className="flex-row items-center">
                <Image
                  source={{ uri: 'https://res.cloudinary.com/dtr2wtoty/image/upload/v1781535958/A_cute__highly_detailed_3D_202606151505_2_akqmx4.jpg' }}
                  className="w-10 h-10 rounded-xl mr-3"
                />
                <Text className="text-black dark:text-white text-3xl font-black tracking-tight font-poppins">MON JOUR</Text>
              </View>
              <TouchableOpacity
                onPress={() => router.push('/history' as any)}
                className="bg-[#39FF14] px-4 py-2 rounded-full border border-[#39FF14] shadow-[0_0_15px_rgba(57,255,20,0.5)]"
              >
                <Text className="text-black font-bold text-[10px] uppercase tracking-wider" style={{ fontFamily: 'Poppins_700Bold' }}>Historique</Text>
              </TouchableOpacity>
            </View>

            <View className="flex-row items-center justify-between mt-2">
              <Text className="flex-1 text-gray-500 dark:text-gray-400 text-xs pr-4 font-poppins leading-relaxed">
                Enregistrez vos repas, suivez votre eau et complétez votre bilan de la journée.
              </Text>

              <View className="bg-zinc-100 dark:bg-zinc-900 rounded-full p-1 flex-row">
                <TouchableOpacity
                  onPress={() => setMode('guided')}
                  className={`px-4 py-2 rounded-full ${mode === 'guided' ? 'bg-[#39FF14] shadow-[0_0_10px_rgba(57,255,20,0.4)] animate-pulse' : 'bg-transparent'}`}
                >
                  <Text className={`text-xs font-bold ${mode === 'guided' ? 'text-black' : 'text-gray-500 dark:text-gray-400'}`}>Mode Guidé</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setMode('free')}
                  className={`px-4 py-2 rounded-full ${mode === 'free' ? 'bg-[#39FF14] shadow-[0_0_10px_rgba(57,255,20,0.4)] animate-pulse' : 'bg-transparent'}`}
                >
                  <Text className={`text-xs font-bold ${mode === 'free' ? 'text-black' : 'text-gray-500 dark:text-gray-400'}`}>Mode Libre</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>

        {/* 2. WIDGET CALORIES & MACROS */}
        <View className="bg-white dark:bg-zinc-900 rounded-[2rem] p-6 mb-6 shadow-sm border border-zinc-100 dark:border-zinc-800">
          <View className="items-center justify-center mb-6 mt-2">
             <CircularProgress
                size={180}
                strokeWidth={14}
                progress={caloriesProgress}
                color="#39FF14"
                backgroundColor={isDark ? 'rgba(255,255,255,0.1)' : '#E5E7EB'}
              >
                <View className="items-center justify-center">
                  <Text className="text-black dark:text-white text-4xl font-black font-poppins">{Math.round(dailyStats.calories_consumed)}</Text>
                  <Text className="text-gray-400 text-xs font-bold uppercase mt-1">/ {profile.calories_goal} KCAL</Text>
                </View>
              </CircularProgress>
          </View>


          <View className="w-full">
            <MacroBar label="Protéines" current={dailyStats.protein_consumed} max={profile.protein_goal} color="#3B82F6" />
            <MacroBar label="Glucides" current={dailyStats.carbs_consumed} max={profile.carbs_goal} color="#EAB308" />
            <MacroBar label="Lipides" current={dailyStats.fats_consumed} max={profile.fats_goal} color="#EF4444" />
          </View>
        </View>

        {/* 3. FLUX DES REPAS DU JOUR */}
        <View className="mb-6">
            <Text className="text-black dark:text-white text-lg font-bold mb-4 font-poppins-bold">Repas du jour</Text>
            {mode === 'guided' && meals.map(meal => (
              <View key={meal.id} className="rounded-2xl overflow-hidden mb-4 bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800">
                <Image source={{ uri: meal.img }} className="w-full h-32 opacity-90" />
                <View className="p-4">
                  <Text className="text-gray-500 dark:text-gray-400 text-[10px] font-bold uppercase mb-1 font-poppins-bold">{meal.type}</Text>
                  <Text className="text-black dark:text-white text-base font-bold mb-2 font-poppins-bold">{meal.name}</Text>
                  <View className="flex-row items-center justify-between mt-2">
                    <Text className="text-gray-500 dark:text-gray-400 text-xs font-medium font-poppins-medium">
                      {meal.calories} kcal • {meal.p}g • {meal.c}g • {meal.f}g
                    </Text>

                    <TouchableOpacity
                      onPress={() => handleLogMeal(meal)}
                      activeOpacity={0.7}
                      className="bg-[#39FF14] px-4 py-2 rounded-xl"
                    >
                      <Text className="text-black text-xs font-bold font-poppins-bold">+ AJOUTER MON REPAS</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}


            {mode === 'free' && (
              <View>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => setIsSearchModalVisible(true)}
                  className="border-2 border-dashed border-[#39FF14] p-4 rounded-2xl items-center mt-4 mb-2 flex-row justify-center">
                  <Text className="text-[#39FF14] text-xs font-bold uppercase mr-2" style={{ fontFamily: 'Poppins_700Bold' }}>+ Ajouter un aliment</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.7}
                  className="bg-zinc-800 p-4 rounded-2xl items-center flex-row justify-center opacity-50">
                  <Text className="text-white text-xs font-bold uppercase mr-2" style={{ fontFamily: 'Poppins_700Bold' }}>📷 Scanner</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

        {/* 4. LES 3 WIDGETS DU BAS */}
        <View className="space-y-4 mb-24">


          {/* A. Widget Hydratation */}
          <TouchableOpacity activeOpacity={0.9} className="rounded-[2rem] overflow-hidden bg-zinc-900">
            <ImageBackground
              source={{ uri: 'https://res.cloudinary.com/dtr2wtoty/image/upload/v1783099524/Woman_drinking_clear_water_2K_202607031724_wuqqco.jpg' }}
              style={{ padding: 24 }}
              imageStyle={{ opacity: 0.5 }}
            >
              <View className="flex-row justify-between items-center mb-2">
                <Text className="text-white text-sm font-bold uppercase font-poppins-bold">Hydratation</Text>
                <Text className="text-white text-lg font-black font-poppins-bold">{dailyStats.water_glasses} <Text className="text-gray-300 text-sm">/ 8 verres</Text></Text>
              </View>
              <Text className="text-gray-300 text-xs mb-6 font-poppins">L'eau booste votre métabolisme de 30% en 10 min</Text>


              <View className="flex-row flex-wrap justify-between gap-y-4 px-2">
                 {Array(8).fill(0).map((_, idx) => (
                   <TouchableOpacity
                     key={idx}
                     hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                     onPress={() => handleUpdateWater(idx + 1)}
                   >
                     <Image
                       source={{ uri: 'https://res.cloudinary.com/dtr2wtoty/image/upload/v1782675042/2_maewiy.png' }}
                       style={{ width: 18, height: 24, opacity: (idx + 1) <= dailyStats.water_glasses ? 1 : 0.4 }}
                       resizeMode="contain"
                     />
                   </TouchableOpacity>
                 ))}
              </View>
            </ImageBackground>
          </TouchableOpacity>

          {/* B. Widget Refaire mon diagnostic */}

          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => router.push('/diagnostic')}
            className="rounded-[2rem] overflow-hidden mt-4 bg-zinc-900 h-32">
            <ImageBackground
              source={{ uri: 'https://res.cloudinary.com/dtr2wtoty/image/upload/v1783002400/A_high-end__photorealistic_commercial_shot_202607021426_vutjqi.jpg' }}
              style={{ flex: 1, padding: 24, justifyContent: 'center', alignItems: 'center' }}
              imageStyle={{ opacity: 0.4 }}
            >
              <View className="w-10 h-10 rounded-full bg-[#39FF14]/20 items-center justify-center mb-2 animate-pulse">
                <View className="w-4 h-4 rounded-full bg-[#39FF14]" />
              </View>
              <Text className="text-white text-sm font-bold uppercase tracking-widest font-poppins-bold">REFAIRE MON DIAGNOSTIC</Text>
              <Text className="text-gray-300 text-xs mt-1 font-poppins">Ajuster mes objectifs</Text>
            </ImageBackground>
          </TouchableOpacity>

          {/* C. Widget BILAN DU JOUR */}

          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => console.log('Open Daily Report Modal')}
            className="bg-[#39FF14] rounded-[2rem] p-6 items-center justify-center mt-4 shadow-lg shadow-[#39FF14]/20 mb-10">
            <CheckCircle size={32} color="black" className="mb-2" />
            <Text className="text-black text-xl font-black uppercase font-poppins-bold">BILAN DU JOUR</Text>
            <Text className="text-black/70 text-xs font-bold mt-1 font-poppins-bold">Clôturez pour gagner de l'XP</Text>
          </TouchableOpacity>


          {/* D. LA BOUTIQUE ONYX */}
          <View className="mt-8 mb-4">
            <View className="mb-4">
              <Text className="text-black dark:text-white text-lg uppercase tracking-wide" style={{ fontFamily: "Poppins_700Bold" }}>BOUTIQUE SUPER ALIMENTS AFRICAINS • VOS ALLIÉS MINCEUR ET ALIMENTATION SAINE</Text>
              <Text className="text-gray-500 dark:text-gray-400 text-xs mt-1">Sélection 100% naturelle personnalisée selon votre métabolisme</Text>
            </View>


            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 16 }}>
              {(products.length > 0 ? products : [
                { id: '1', name: 'Thé Détox Minceur', image_url: 'https://res.cloudinary.com/dtr2wtoty/image/upload/v1781224243/logo_dore_um5fsr.png', price: 15000 },
                { id: '2', name: 'Graines de Chia Bio', image_url: 'https://res.cloudinary.com/dtr2wtoty/image/upload/v1781224243/logo_dore_um5fsr.png', price: 8000 },
                { id: '3', name: 'Infusion Sommeil', image_url: 'https://res.cloudinary.com/dtr2wtoty/image/upload/v1781224243/logo_dore_um5fsr.png', price: 12000 }
              ]).map(product => (

                <Pressable
                  key={product.id}
                  className="w-44 bg-white dark:bg-zinc-900 rounded-3xl p-3 border border-zinc-100 dark:border-zinc-800 flex-col justify-between shadow-sm"
                >
                  <Image source={{ uri: product.image_url || product.image || product.img }} className="w-full h-32 resize-contain rounded-2xl mb-2" />

                  <Text className="text-sm text-zinc-900 dark:text-white mb-1" style={{ fontFamily: "Poppins_700Bold" }} numberOfLines={1}>
                    {product.nom || product.name}
                  </Text>

                  <View className="flex-row items-center justify-between mt-1">
                    <Text className="text-xs text-[#39FF14]" style={{ fontFamily: "Poppins_700Bold" }}>
                      {Number(product?.prix || product?.price || product?.prix_standard || 0).toLocaleString('fr-FR')} FCFA
                    </Text>
                    <TouchableOpacity className="bg-black dark:bg-[#39FF14] w-7 h-7 rounded-full items-center justify-center">
                      <Text className="text-white dark:text-black" style={{ fontFamily: "Poppins_700Bold" }}>+</Text>
                    </TouchableOpacity>
                  </View>
                </Pressable>
              ))}
            </ScrollView>
          </View>

          {/* E. BOUTON MON HISTORIQUE GLOBAL */}
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => router.push('/history' as any)}
            className="bg-zinc-900 rounded-[2rem] p-6 items-center justify-center mt-6 shadow-lg mb-10 border border-[#39FF14]/30">
            <Text className="text-white text-xl font-black uppercase font-poppins-bold">MON HISTORIQUE</Text>
            <Text className="text-[#39FF14] text-xs font-bold mt-1 font-poppins-bold">Voir mon évolution et mes badges</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}
