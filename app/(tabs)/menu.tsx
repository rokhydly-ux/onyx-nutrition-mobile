import React, { useState, useRef, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, FlatList, ActivityIndicator, Dimensions, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CheckCircle, Lock, Plus, RefreshCw, ShoppingCart, Trash2 } from 'lucide-react-native';
import { useMenuData } from '../../hooks/useMenuData';
import { useMenuStore } from '../../store/useMenuStore';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { supabase } from '../../lib/supabase';
import GroceryListModal from '../../components/GroceryListModal';
import FoodSearchModal from '../../components/FoodSearchModal';
import GuidedModeMenu from '../../components/GuidedModeMenu';
import FreeModeMenu from '../../components/FreeModeMenu';

const { width } = Dimensions.get('window');

export default function MenuScreen() {
  const { loading, generating, profile, menu, generateMenu, swapMeal, removeMealLog, consumedMeals } = useMenuData();
  const { setShowGroceryList } = useMenuStore();

  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [showFoodSearch, setShowFoodSearch] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    if (menu.length > 0) {
      const today = new Date().toISOString().split('T')[0];
      const todayIndex = menu.findIndex(d => d.date === today);
      if (todayIndex !== -1) {
        setSelectedDayIndex(todayIndex);
      }
    }
  }, [menu]);

  if (loading || !profile) {
    return (
      <SafeAreaView className="flex-1 bg-[#F4F4F5] items-center justify-center">
        <ActivityIndicator size="large" color="#39FF14" />
        <Text className="mt-4 text-gray-500" style={{ fontFamily: 'Poppins_400Regular' }}>Chargement du menu...</Text>
      </SafeAreaView>
    );
  }

  const hasAccess = profile.plan_type === 'premium' || (typeof profile.daysLeft === 'number' && profile.daysLeft > 0);

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
              onPress={() => Linking.openURL('https://wa.me/1234567890')}
            >
              <Text className="text-black font-bold text-lg mr-2" style={{ fontFamily: 'Poppins_700Bold' }}>Contacter sur WhatsApp</Text>
            </TouchableOpacity>
         </View>
      </SafeAreaView>
    );
  }

  const [localUserMode, setLocalUserMode] = useState<'strict' | 'free' | null>(null);

  useEffect(() => {
    if (profile && !localUserMode) {
      const mode = profile.diagnostic_data?.diet_mode || profile.diagnostic_data?.userMode || 'strict';
      setLocalUserMode(mode);
    }
  }, [profile, localUserMode]);

  const userMode = localUserMode || 'strict';

  const toggleUserMode = () => {
    setLocalUserMode(prev => prev === 'strict' ? 'free' : 'strict');
  };

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

      const { error } = await supabase.from('nutrition_daily_logs').insert({
        client_id: session.session.user.id,
        recipe_id: food.id,
        calories,
        proteins,
        carbs,
        fats,
      });

      if (error) console.error("Error logging free food:", error);
      else setShowFoodSearch(false);
    } catch (e) {
      console.error(e);
    }
  };

  const logMeal = async (meal: any, date: string) => {
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
        created_at: new Date(`${date}T12:00:00Z`).toISOString(),
      });

      if (error) console.error("Error logging meal:", error);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#F4F4F5]" edges={['top']}>
      <View className="px-6 py-4 flex-row justify-between items-center">
        <Text className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Poppins_700Bold' }}>Sama Menu</Text>
        <View className="flex-row gap-3">
          <TouchableOpacity
            className="bg-gray-100 px-4 py-3 rounded-full shadow-sm"
            onPress={toggleUserMode}
          >
            <Text className="text-xs font-bold text-black" style={{ fontFamily: 'Poppins_700Bold' }}>
              {userMode === 'strict' ? 'Passer en Libre' : 'Passer en Guidé'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="bg-white p-3 rounded-full shadow-sm"
            onPress={() => setShowGroceryList(true)}
          >
            <ShoppingCart size={24} color="#000" />
          </TouchableOpacity>
        </View>
      </View>

      {userMode === 'strict' && (
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
      )}

      {userMode === 'strict' ? (
        <GuidedModeMenu
          selectedDay={selectedDay}
          consumedMeals={consumedMeals}
          profile={profile}
          onSwapMeal={swapMeal}
          onRemoveMeal={removeMealLog}
          onLogMeal={logMeal}
          onAddExtra={() => setShowFoodSearch(true)}
        />
      ) : (
        <FreeModeMenu
          onOpenSearch={() => setShowFoodSearch(true)}
          consumedMeals={consumedMeals}
        />
      )}

      <GroceryListModal />
      <FoodSearchModal visible={showFoodSearch} onClose={() => setShowFoodSearch(false)} onAddFood={handleAddFreeFood} />
    </SafeAreaView>
  );
}