import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image } from 'react-native';
import { CheckCircle, Plus, RefreshCw, Trash2 } from 'lucide-react-native';
import { DayMenu } from '../store/useMenuStore';
import { ProfileData } from '../utils/menuGenerator';

interface GuidedModeMenuProps {
  selectedDay: DayMenu | undefined;
  consumedMeals: Record<string, boolean>;
  profile: ProfileData & { expert_mode?: boolean } | null;
  onSwapMeal: (mealId: string, mealType: string, date: string) => void;
  onRemoveMeal: (recipeId: string, date: string) => void;
  onLogMeal: (meal: any, date: string) => void;
  onAddExtra: () => void;
}

export default function GuidedModeMenu({
  selectedDay,
  consumedMeals,
  profile,
  onSwapMeal,
  onRemoveMeal,
  onLogMeal,
  onAddExtra,
}: GuidedModeMenuProps) {
  if (!selectedDay) return null;

  return (
    <ScrollView className="flex-1 px-6" contentContainerStyle={{ paddingBottom: 100, gap: 16 }}>
      {selectedDay.meals.map((meal) => {
        const isConsumed = consumedMeals[`${selectedDay.date}-${meal.recipe_id}`] || false;

        return (
          <View key={meal.id} className="bg-white rounded-[24px] overflow-hidden shadow-sm">
            <View className="h-40 relative">
              {meal.image_url ? (
                <Image source={{ uri: meal.image_url }} className="w-full h-full" resizeMode="cover" />
              ) : (
                <View className="w-full h-full bg-gray-200" />
              )}
              <View className="absolute inset-0 bg-black/40" />

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

            <View className="p-4 bg-white border-b border-gray-100">
              <View className="flex-row gap-3">
                {/* 🔄 Changer: Ne s'affiche QUE si le plat n'est pas encore consommé */}
                {!isConsumed && (
                  <TouchableOpacity
                    className="flex-1 flex-row justify-center items-center py-3 rounded-[16px] bg-gray-100"
                    onPress={() => onSwapMeal(meal.id, meal.type, selectedDay.date)}
                  >
                    <RefreshCw size={18} color="#4B5563" className="mr-2" />
                    <Text className="text-gray-700 font-bold" style={{ fontFamily: 'Poppins_700Bold' }}>Changer</Text>
                  </TouchableOpacity>
                )}

                {/* 🗑️ Supprimer: Ne s'affiche QUE si le plat est DÉJÀ logué */}
                {isConsumed ? (
                  <TouchableOpacity
                    className="flex-1 flex-row justify-center items-center py-3 rounded-[16px] bg-red-100"
                    onPress={() => onRemoveMeal(meal.recipe_id, selectedDay.date)}
                  >
                    <Trash2 size={18} color="#EF4444" className="mr-2" />
                    <Text className="text-red-500 font-bold" style={{ fontFamily: 'Poppins_700Bold' }}>Supprimer</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    className="flex-1 flex-row justify-center items-center py-3 rounded-[16px] bg-black"
                    onPress={() => onLogMeal(meal, selectedDay.date)}
                  >
                    <Plus size={18} color="#39FF14" className="mr-2" />
                    <Text className="text-[#39FF14] font-bold" style={{ fontFamily: 'Poppins_700Bold' }}>Ajouter</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* ➕ Extra: Bouton en bas du repas pour rajouter un aliment */}
              {isConsumed && (
                <TouchableOpacity
                  className="mt-3 flex-row justify-center items-center py-2 bg-gray-50 rounded-[16px] border border-dashed border-gray-300"
                  onPress={onAddExtra}
                >
                  <Plus size={16} color="#9CA3AF" className="mr-2" />
                  <Text className="text-gray-500 font-bold text-xs" style={{ fontFamily: 'Poppins_700Bold' }}>+ Ajouter un Extra</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        );
      })}
    </ScrollView>
  );
}