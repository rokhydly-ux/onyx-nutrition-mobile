import React, { useState, useEffect } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';
import GroceryListModal from '../../components/GroceryListModal';
import FoodSearchModal from '../../components/FoodSearchModal';
import GuidedModeMenu from '../../components/GuidedModeMenu';
import FreeModeMenu from '../../components/FreeModeMenu';

const { width } = Dimensions.get('window');

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
    </SafeAreaView>
  );
}
