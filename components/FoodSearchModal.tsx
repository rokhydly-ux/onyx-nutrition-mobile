import React, { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, TextInput, FlatList, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X, Search } from 'lucide-react-native';

interface FoodSearchModalProps {
  visible: boolean;
  onClose: () => void;
  onAddFood: (food: any, quantity: number) => void;
}

// Temporary mocked database
const MOCK_FOOD_DATABASE = [
  { id: '1', name: 'Riz brisé', caloriesPer100g: 130, proteins: 2.7, carbs: 28, fats: 0.3 },
  { id: '2', name: 'Poulet rôti', caloriesPer100g: 239, proteins: 27, carbs: 0, fats: 14 },
  { id: '3', name: 'Pâte d\'arachide', caloriesPer100g: 588, proteins: 25, carbs: 20, fats: 50 },
  { id: '4', name: 'Manioc', caloriesPer100g: 160, proteins: 1.4, carbs: 38, fats: 0.3 },
  { id: '5', name: 'Poisson frais', caloriesPer100g: 206, proteins: 22, carbs: 0, fats: 12 },
];

export default function FoodSearchModal({ visible, onClose, onAddFood }: FoodSearchModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFood, setSelectedFood] = useState<any>(null);
  const [quantityStr, setQuantityStr] = useState('');

  const filteredFoods = MOCK_FOOD_DATABASE.filter(food =>
    food.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAdd = () => {
    const qty = parseFloat(quantityStr);
    if (selectedFood && !isNaN(qty) && qty > 0) {
      onAddFood(selectedFood, qty);
      // Reset
      setSelectedFood(null);
      setQuantityStr('');
      setSearchQuery('');
    }
  };

  const closeModal = () => {
    setSelectedFood(null);
    setQuantityStr('');
    setSearchQuery('');
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={closeModal}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1 bg-[#F4F4F5]">
        <SafeAreaView className="flex-1" edges={['top']}>
          {/* Header */}
          <View className="flex-row justify-between items-center p-6 bg-white border-b border-gray-200">
            <Text className="text-xl font-bold text-black" style={{ fontFamily: 'Poppins_700Bold' }}>
              Ajouter un aliment
            </Text>
            <TouchableOpacity onPress={closeModal} className="bg-gray-100 p-2 rounded-full">
              <X size={24} color="#000" />
            </TouchableOpacity>
          </View>

          {!selectedFood ? (
            <View className="flex-1 px-6 pt-6">
              <View className="flex-row items-center bg-white px-4 py-3 rounded-[16px] mb-6 shadow-sm border border-gray-100">
                <Search size={20} color="#9CA3AF" />
                <TextInput
                  className="flex-1 ml-3 text-black text-base"
                  style={{ fontFamily: 'Poppins_400Regular' }}
                  placeholder="Rechercher un aliment..."
                  placeholderTextColor="#9CA3AF"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
              </View>

              <FlatList
                data={filteredFoods}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    className="bg-white p-4 rounded-[16px] mb-3 border border-gray-100 shadow-sm flex-row justify-between items-center"
                    onPress={() => setSelectedFood(item)}
                  >
                    <View>
                      <Text className="text-black font-bold text-lg" style={{ fontFamily: 'Poppins_700Bold' }}>{item.name}</Text>
                      <Text className="text-gray-500 text-sm" style={{ fontFamily: 'Poppins_400Regular' }}>
                        {item.caloriesPer100g} kcal / 100g
                      </Text>
                    </View>
                    <View className="bg-gray-100 px-3 py-1 rounded-full">
                      <Text className="text-black font-bold text-xs" style={{ fontFamily: 'Poppins_700Bold' }}>Choisir</Text>
                    </View>
                  </TouchableOpacity>
                )}
                ListEmptyComponent={
                  <Text className="text-center text-gray-500 mt-10" style={{ fontFamily: 'Poppins_400Regular' }}>
                    Aucun résultat trouvé.
                  </Text>
                }
              />
            </View>
          ) : (
            <View className="flex-1 justify-center px-6">
               <View className="bg-white p-6 rounded-[24px] shadow-sm border border-gray-100">
                  <View className="flex-row justify-between items-start mb-6">
                     <View>
                       <Text className="text-2xl font-bold text-black" style={{ fontFamily: 'Poppins_700Bold' }}>{selectedFood.name}</Text>
                       <Text className="text-gray-500" style={{ fontFamily: 'Poppins_400Regular' }}>
                         {selectedFood.caloriesPer100g} kcal pour 100g
                       </Text>
                     </View>
                     <TouchableOpacity onPress={() => setSelectedFood(null)} className="bg-gray-100 p-2 rounded-full">
                       <X size={20} color="#000" />
                     </TouchableOpacity>
                  </View>

                  <Text className="text-black font-bold mb-2" style={{ fontFamily: 'Poppins_700Bold' }}>Quantité (en grammes)</Text>
                  <TextInput
                    className="bg-gray-50 border border-gray-200 px-4 py-4 rounded-[16px] text-xl font-bold text-center mb-8"
                    style={{ fontFamily: 'Poppins_700Bold' }}
                    keyboardType="numeric"
                    placeholder="ex: 150"
                    placeholderTextColor="#9CA3AF"
                    value={quantityStr}
                    onChangeText={setQuantityStr}
                  />

                  <TouchableOpacity
                    className={`w-full py-4 rounded-full flex-row justify-center items-center ${
                      parseFloat(quantityStr) > 0 ? 'bg-[#39FF14] shadow-[0_0_15px_rgba(57,255,20,0.4)]' : 'bg-gray-200'
                    }`}
                    onPress={handleAdd}
                    disabled={isNaN(parseFloat(quantityStr)) || parseFloat(quantityStr) <= 0}
                  >
                    <Text className={`font-bold text-lg ${parseFloat(quantityStr) > 0 ? 'text-black' : 'text-gray-400'}`} style={{ fontFamily: 'Poppins_700Bold' }}>
                      Valider et Ajouter
                    </Text>
                  </TouchableOpacity>
               </View>
            </View>
          )}
        </SafeAreaView>
      </KeyboardAvoidingView>
    </Modal>
  );
}