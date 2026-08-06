import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Plus } from 'lucide-react-native';

interface FreeModeMenuProps {
  onOpenSearch: () => void;
  consumedMeals: Record<string, boolean>; // You could optionally pass more details about consumed free foods here
}

export default function FreeModeMenu({ onOpenSearch, consumedMeals }: FreeModeMenuProps) {
  const mealSlots = [
    { id: 'breakfast', name: 'Petit-déjeuner' },
    { id: 'lunch', name: 'Déjeuner' },
    { id: 'snack', name: 'Collation' },
    { id: 'dinner', name: 'Dîner' },
  ];

  return (
    <ScrollView className="flex-1 px-6" contentContainerStyle={{ paddingBottom: 100, gap: 16 }}>
      <View className="mb-4 mt-2">
        <Text className="text-gray-500 text-center" style={{ fontFamily: 'Poppins_400Regular' }}>
          Mode Libre Actif : Composez vous-même vos repas en ajoutant des aliments.
        </Text>
      </View>

      {mealSlots.map((slot) => (
        <View key={slot.id} className="bg-white p-5 rounded-[24px] shadow-sm border border-gray-100 mb-4">
          <Text className="text-black font-bold text-lg mb-4" style={{ fontFamily: 'Poppins_700Bold' }}>{slot.name}</Text>

          <TouchableOpacity
            className="flex-row justify-center items-center py-4 bg-gray-50 rounded-[16px] border border-dashed border-gray-300"
            onPress={onOpenSearch}
          >
            <Plus size={20} color="#9CA3AF" className="mr-2" />
            <Text className="text-gray-500 font-bold" style={{ fontFamily: 'Poppins_700Bold' }}>+ Ajouter un aliment</Text>
          </TouchableOpacity>
        </View>
      ))}
    </ScrollView>
  );
}