import React, { useState, useRef, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, FlatList, ActivityIndicator, Dimensions, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { CheckCircle, Lock, Plus, RefreshCw, ShoppingCart, Trash2 } from 'lucide-react-native';
import { useMenuData } from '../../hooks/useMenuData';
import { useMenuStore } from '../../store/useMenuStore';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { supabase } from '../../lib/supabase';
import GroceryListModal from '../../components/GroceryListModal';
import FoodSearchModal from '../../components/FoodSearchModal';

const { width } = Dimensions.get('window');

export default function MenuScreen() {
  const { loading, generating, profile, menu, generateMenu, swapMeal, removeMealLog, consumedMeals } = useMenuData();
  const { setShowGroceryList } = useMenuStore();

  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [showFoodSearch, setShowFoodSearch] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  // Focus today by default
  useEffect(() => {
    if (menu.length > 0) {
      const today = new Date().toISOString().split('T')[0];
      const todayIndex = menu.findIndex(d => d.date === today);
      if (todayIndex !== -1) {
        setSelectedDayIndex(todayIndex);
      }
    }
  }, [menu]);

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-[#F4F4F5] items-center justify-center">
        <ActivityIndicator size="large" color="#39FF14" />
        <Text className="mt-4 text-gray-500" style={{ fontFamily: 'Poppins_400Regular' }}>Chargement du menu...</Text>
      </SafeAreaView>
    );
  }

  // Paywall Logic
  const hasAccess = profile?.plan_type === 'premium' || (profile?.daysLeft && profile.daysLeft > 0);

  if (!hasAccess) {
    return (
      <SafeAreaView className="flex-1 bg-[#F4F4F5] p-6 justify-center items-center">
         <View className="bg-white p-8 rounded-[30px] border border-dashed border-gray-300 items-center w-full shadow-sm">
            <View className="bg-gray-100 p-4 rounded-full mb-6">
              <Lock size={32} color="#9CA3AF" />
            </View>
            <Text className="text-2xl font-bold text-center text-gray-900 mb-4" style={{ fontFamily: 'Poppins_700Bold' }}>
              Sama Menu
            </Text>
            <Text className="text-center text-gray-500 mb-8" style={{ fontFamily: 'Poppins_400Regular' }}>
              Passez en mode Premium pour débloquer votre planificateur de repas intelligent 100% personnalisé et générer vos listes de courses.
            </Text>

            <TouchableOpacity
              className="bg-[#39FF14] w-full py-4 rounded-full flex-row justify-center items-center shadow-[0_0_15px_rgba(57,255,20,0.4)]"
              onPress={() => Linking.openURL('https://wa.me/1234567890')} // Replace with actual WhatsApp link
            >
              <Text className="text-black font-bold text-lg mr-2" style={{ fontFamily: 'Poppins_700Bold' }}>Contacter sur WhatsApp</Text>
            </TouchableOpacity>
         </View>
      </SafeAreaView>
    );
  }

  // Determine Mode
  const userMode = profile?.diagnostic_data?.userMode || 'strict';

  if (userMode === 'strict' && menu.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-[#F4F4F5] p-6 justify-center items-center">
        <Text className="text-3xl font-bold text-center text-gray-900 mb-4" style={{ fontFamily: 'Poppins_700Bold' }}>
          Votre semaine, planifiée.
        </Text>
        <Text className="text-center text-gray-500 mb-8" style={{ fontFamily: 'Poppins_400Regular' }}>
          Générez un menu sur-mesure pour les 7 prochains jours, adapté à vos objectifs et allergies.
        </Text>
        <TouchableOpacity
          className="bg-[#39FF14] w-full py-4 rounded-full items-center shadow-[0_0_15px_rgba(57,255,20,0.4)] flex-row justify-center"
          onPress={generateMenu}
          disabled={generating}
        >
          {generating ? (
             <ActivityIndicator color="#000" />
          ) : (
            <Text className="text-black font-bold text-lg" style={{ fontFamily: 'Poppins_700Bold' }}>Générer mon menu</Text>
          )}
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const selectedDay = menu[selectedDayIndex];

  const handleAddFreeFood = async (food: any, quantity: number) => {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) return;

      const ratio = quantity / 100;
      const calories = Math.round(food.caloriesPer100g * ratio);
      const proteins = Math.round(food.proteins * ratio);
      const carbs = Math.round(food.carbs * ratio);
      const fats = Math.round(food.fats * ratio);

      // We log it directly for today
      const { error } = await supabase.from('nutrition_daily_logs').insert({
        client_id: session.session.user.id,
        recipe_id: food.id, // using mock ID for now
        calories,
        proteins,
        carbs,
        fats,
      });

      if (error) console.error("Error logging free food:", error);
      else {
        // Ideally trigger a refresh of the dashboard here
        setShowFoodSearch(false);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const logMeal = async (meal: any, date: string) => {
    // Add to daily logs
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) return;

      const { error } = await supabase.from('nutrition_daily_logs').insert({
        client_id: session.session.user.id,
        recipe_id: meal.recipe_id,
        calories: meal.calories,
        proteins: meal.proteins,
        carbs: meal.carbs,
        fats: meal.fats,
        // using the date of the meal plan, setting time to noon approx
        created_at: new Date(`${date}T12:00:00Z`).toISOString(),
      });

      if (error) console.error("Error logging meal:", error);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#F4F4F5]" edges={['top']}>
      {/* Header */}
      <View className="px-6 py-4 flex-row justify-between items-center">
        <Text className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Poppins_700Bold' }}>Sama Menu</Text>
        <TouchableOpacity
          className="bg-white p-3 rounded-full shadow-sm"
          onPress={() => setShowGroceryList(true)}
        >
          <ShoppingCart size={24} color="#000" />
        </TouchableOpacity>
      </View>

      {/* Days Carousel */}
      <View className="mb-6">
        <FlatList
          ref={flatListRef}
          data={menu}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 24, gap: 12 }}
          keyExtractor={(item) => item.date}
          renderItem={({ item, index }) => {
            const dateObj = parseISO(item.date);
            const dayName = format(dateObj, 'EEE', { locale: fr });
            const dayNumber = format(dateObj, 'd');
            const isActive = index === selectedDayIndex;
            const isToday = item.date === new Date().toISOString().split('T')[0];

            return (
              <TouchableOpacity
                onPress={() => setSelectedDayIndex(index)}
                className={`items-center justify-center w-16 h-20 rounded-[20px] transition-all bg-white shadow-sm border ${
                  isActive ? 'border-[#39FF14] border-2' : 'border-transparent'
                }`}
              >
                <Text className={`text-xs uppercase mb-1 ${isActive ? 'text-black font-bold' : 'text-gray-400'}`} style={{ fontFamily: 'Poppins_700Bold' }}>
                  {dayName}
                </Text>
                <Text className={`text-xl ${isActive ? 'text-black font-bold' : 'text-gray-900'}`} style={{ fontFamily: 'Poppins_700Bold' }}>
                  {dayNumber}
                </Text>
                {isToday && <View className="w-2 h-2 rounded-full bg-[#39FF14] mt-1" />}
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* Dynamic Content based on Mode */}
      {userMode === 'strict' ? (
        <ScrollView className="flex-1 px-6" contentContainerStyle={{ paddingBottom: 100, gap: 16 }}>
          {selectedDay?.meals.map((meal) => {
            // Check if consumed (using either recipe_id or meal id based on how it's stored in consumedMeals)
            const isConsumed = consumedMeals[`${selectedDay.date}-${meal.recipe_id}`] || false;

            return (
              <View key={meal.id} className="bg-white rounded-[24px] overflow-hidden shadow-sm">
                <View className="h-40 relative">
                  {meal.image_url ? (
                    <Image source={{ uri: meal.image_url }} className="w-full h-full" resizeMode="cover" />
                  ) : (
                    <View className="w-full h-full bg-gray-200" />
                  )}
                  {/* Dark Gradient Overlay */}
                  <View className="absolute inset-0 bg-black/40" />

                  {/* Content over image */}
                  <View className="absolute inset-0 p-4 justify-between">
                    <View className="flex-row justify-between items-start">
                      <View className="bg-white/20 px-3 py-1 rounded-full backdrop-blur-md">
                        <Text className="text-white text-xs font-bold uppercase tracking-wider" style={{ fontFamily: 'Poppins_700Bold' }}>{meal.type}</Text>
                      </View>
                      {isConsumed && (
                        <View className="bg-[#39FF14] px-2 py-1 rounded-full flex-row items-center">
                          <CheckCircle size={12} color="#000" className="mr-1" />
                          <Text className="text-black text-xs font-bold uppercase" style={{ fontFamily: 'Poppins_700Bold' }}>Validé</Text>
                        </View>
                      )}
                    </View>

                    <View>
                      <Text className="text-white text-xl font-bold mb-1 shadow-sm" style={{ fontFamily: 'Poppins_700Bold' }} numberOfLines={2}>
                        {meal.name}
                      </Text>
                      {profile?.expert_mode ? (
                         <Text className="text-white/90 text-xs shadow-sm" style={{ fontFamily: 'Poppins_400Regular' }}>
                           {meal.calories} kcal • P: {meal.proteins}g • G: {meal.carbs}g • L: {meal.fats}g
                         </Text>
                      ) : (
                         <Text className="text-white/90 text-xs shadow-sm" style={{ fontFamily: 'Poppins_400Regular' }}>
                           1 portion optimisée
                         </Text>
                      )}
                    </View>
                  </View>
                </View>

                {/* Actions */}
                <View className="p-4 bg-white border-b border-gray-100">
                  <View className="flex-row gap-3 mb-3">
                    <TouchableOpacity
                      className={`flex-1 flex-row justify-center items-center py-3 rounded-[16px] ${
                        isConsumed ? 'bg-gray-100 opacity-50' : 'bg-gray-100'
                      }`}
                      disabled={isConsumed}
                      onPress={() => swapMeal(meal.id, meal.type, selectedDay.date)}
                    >
                      <RefreshCw size={18} color="#4B5563" className="mr-2" />
                      <Text className="text-gray-700 font-bold" style={{ fontFamily: 'Poppins_700Bold' }}>Changer</Text>
                    </TouchableOpacity>

                    {isConsumed ? (
                      <TouchableOpacity
                        className="flex-1 flex-row justify-center items-center py-3 rounded-[16px] bg-red-100"
                        onPress={() => removeMealLog(meal.recipe_id, selectedDay.date)}
                      >
                        <Trash2 size={18} color="#EF4444" className="mr-2" />
                        <Text className="text-red-500 font-bold" style={{ fontFamily: 'Poppins_700Bold' }}>Supprimer</Text>
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity
                        className="flex-1 flex-row justify-center items-center py-3 rounded-[16px] bg-black"
                        onPress={() => logMeal(meal, selectedDay.date)}
                      >
                        <Plus size={18} color="#39FF14" className="mr-2" />
                        <Text className="text-[#39FF14] font-bold" style={{ fontFamily: 'Poppins_700Bold' }}>Ajouter</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </View>
            );
          })}

          <TouchableOpacity
            className="flex-row justify-center items-center py-4 bg-white rounded-[24px] border border-dashed border-gray-300 shadow-sm"
            onPress={() => setShowFoodSearch(true)}
          >
            <Plus size={20} color="#9CA3AF" className="mr-2" />
            <Text className="text-gray-500 font-bold" style={{ fontFamily: 'Poppins_700Bold' }}>+ Ajouter un Extra</Text>
          </TouchableOpacity>
        </ScrollView>
      ) : (
        /* Render Free Mode Menu */
        <ScrollView className="flex-1 px-6" contentContainerStyle={{ paddingBottom: 100, gap: 16 }}>
          <View className="bg-white p-6 rounded-[24px] shadow-sm items-center border border-dashed border-gray-300 mt-4">
             <View className="w-16 h-16 bg-gray-100 rounded-full items-center justify-center mb-4">
                <Plus size={32} color="#9CA3AF" />
             </View>
             <Text className="text-black font-bold text-lg mb-2" style={{ fontFamily: 'Poppins_700Bold' }}>Mode Libre Actif</Text>
             <Text className="text-gray-500 text-center mb-6" style={{ fontFamily: 'Poppins_400Regular' }}>
               Vous avez le contrôle total sur votre alimentation. Ajoutez les aliments que vous consommez pour suivre vos macros.
             </Text>
             <TouchableOpacity
                className="bg-[#39FF14] w-full py-4 rounded-full flex-row justify-center items-center shadow-[0_0_15px_rgba(57,255,20,0.4)]"
                onPress={() => setShowFoodSearch(true)}
             >
                <Plus size={20} color="#000" className="mr-2" />
                <Text className="text-black font-bold text-lg" style={{ fontFamily: 'Poppins_700Bold' }}>Ajouter un aliment</Text>
             </TouchableOpacity>
          </View>
        </ScrollView>
      )}

      {/* Grocery List Modal */}
      <GroceryListModal />

      {/* Food Search Modal for Free Mode / Extras */}
      <FoodSearchModal
        visible={showFoodSearch}
        onClose={() => setShowFoodSearch(false)}
        onAddFood={handleAddFreeFood}
      />
    </SafeAreaView>
  );
}
