import React, { useState, useEffect } from 'react';
import { View, Text, Modal, TouchableOpacity, TextInput, FlatList, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X, Search } from 'lucide-react-native';
import { supabase } from '../lib/supabase';

interface FoodSearchModalProps {
  visible: boolean;
  onClose: () => void;
  onAddFood: (food: any, quantity: number) => void;
}

export default function FoodSearchModal({ visible, onClose, onAddFood }: FoodSearchModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [selectedFood, setSelectedFood] = useState<any>(null);
  const [quantityStr, setQuantityStr] = useState('');

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchQuery.trim().length > 2) {
        performSearch(searchQuery);
      } else {
        setSearchResults([]);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const performSearch = async (query: string) => {
    setLoadingSearch(true);
    let results: any[] = [];

    try {
      // 1. Search Supabase nutrition_recipes
      const { data: dbData, error } = await supabase
        .from('nutrition_recipes')
        .select('*')
        .ilike('name', `%${query}%`)
        .limit(10);

      if (!error && dbData) {
        // Map database recipes to standard format
        const dbMapped = dbData.map(item => ({
          id: item.id,
          name: item.name,
          caloriesPer100g: item.calories || 0,
          proteins: item.proteins || 0,
          carbs: item.carbs || 0,
          fats: item.fats || 0,
          source: 'Sama DB'
        }));
        results = [...results, ...dbMapped];
      }

      // 2. Search OpenFoodFacts
      const offResponse = await fetch(`https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1`);
      const offData = await offResponse.json();

      if (offData && offData.products) {
        const offMapped = offData.products
          .filter((p: any) => p.product_name && p.nutriments && p.nutriments['energy-kcal_100g'])
          .slice(0, 10)
          .map((p: any) => ({
            id: `off_${p.code}`,
            name: p.product_name,
            caloriesPer100g: p.nutriments['energy-kcal_100g'] || 0,
            proteins: p.nutriments.proteins_100g || 0,
            carbs: p.nutriments.carbohydrates_100g || 0,
            fats: p.nutriments.fat_100g || 0,
            source: 'OpenFoodFacts'
          }));
        results = [...results, ...offMapped];
      }

      setSearchResults(results);
    } catch (err) {
      console.error("Search failed:", err);
    } finally {
      setLoadingSearch(false);
    }
  };

  const handleAdd = () => {
    const qty = parseFloat(quantityStr);
    if (selectedFood && !isNaN(qty) && qty > 0) {
      onAddFood(selectedFood, qty);
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

              {loadingSearch ? (
                <View className="flex-1 justify-center items-center">
                  <ActivityIndicator size="large" color="#39FF14" />
                  <Text className="mt-4 text-gray-500" style={{ fontFamily: 'Poppins_400Regular' }}>Recherche en cours...</Text>
                </View>
              ) : (
                <FlatList
                  data={searchResults}
                  keyExtractor={(item) => item.id}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      className="bg-white p-4 rounded-[16px] mb-3 border border-gray-100 shadow-sm flex-row justify-between items-center"
                      onPress={() => setSelectedFood(item)}
                    >
                      <View className="flex-1 pr-4">
                        <Text className="text-black font-bold text-lg" style={{ fontFamily: 'Poppins_700Bold' }} numberOfLines={2}>{item.name}</Text>
                        <Text className="text-gray-500 text-sm" style={{ fontFamily: 'Poppins_400Regular' }}>
                          {Math.round(item.caloriesPer100g)} kcal / 100g • {item.source}
                        </Text>
                      </View>
                      <View className="bg-gray-100 px-3 py-1 rounded-full">
                        <Text className="text-black font-bold text-xs" style={{ fontFamily: 'Poppins_700Bold' }}>Choisir</Text>
                      </View>
                    </TouchableOpacity>
                  )}
                  ListEmptyComponent={
                    <Text className="text-center text-gray-500 mt-10" style={{ fontFamily: 'Poppins_400Regular' }}>
                      {searchQuery.length > 2 ? "Aucun résultat trouvé." : "Tapez au moins 3 caractères pour chercher."}
                    </Text>
                  }
                />
              )}
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