import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Image, ImageBackground, TouchableOpacity, TextInput, LayoutAnimation, UIManager, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, Heart } from 'lucide-react-native';
import { supabase } from '../../lib/supabase';
import { useColorScheme } from 'nativewind';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const FILTERS = ['Tous', '✨ Ventre Plat & Détox', '🔥 Énergie', '🍳 Cuisine Saine', '🥨 Snacks', '❤️ Sauvegardés'];

export default function ShopScreen() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [products, setProducts] = useState<any[]>([]);
  const [savedProductIds, setSavedProductIds] = useState<string[]>([]);
  const [activeFilter, setActiveFilter] = useState('Tous');

  const [scratchCount, setScratchCount] = useState(0);
  const [scratched, setScratched] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;

    if (userId) {
      const { data: profile } = await supabase
        .from('nutrition_profiles')
        .select('saved_shop_products')
        .eq('client_id', userId)
        .maybeSingle();
      if (profile && profile.saved_shop_products) {
        setSavedProductIds(profile.saved_shop_products);
      }
    }

    const { data: prods } = await supabase.from('nutrition_products').select('*');
    if (prods) {
      setProducts(prods);
    }
  };

  const toggleSaveProduct = async (productId: string) => {
    const isSaved = savedProductIds.includes(productId);
    const newSaved = isSaved
      ? savedProductIds.filter(id => id !== productId)
      : [...savedProductIds, productId];

    setSavedProductIds(newSaved);

    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;
    if (userId) {
      await supabase
        .from('nutrition_profiles')
        .update({ saved_shop_products: newSaved })
        .eq('client_id', userId);
    }
  };

  const handleScratch = () => {
    if (scratched) return;
    const newCount = scratchCount + 1;
    setScratchCount(newCount);
    if (newCount >= 3) {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);
      setScratched(true);
    }
  };

  // Mock Products if empty
  const displayProducts = products.length > 0 ? products : [
    { id: '1', name: 'Thé Détox Minceur 14 Jours', image_url: 'https://res.cloudinary.com/dtr2wtoty/image/upload/v1781224243/logo_dore_um5fsr.png', price: 15000, old_price: 18000, rating: 4.8, isNew: true },
    { id: '2', name: 'Graines de Chia Bio', image_url: 'https://res.cloudinary.com/dtr2wtoty/image/upload/v1781224243/logo_dore_um5fsr.png', price: 8000, stock: 5 },
    { id: '3', name: 'Infusion Sommeil Profond', image_url: 'https://res.cloudinary.com/dtr2wtoty/image/upload/v1781224243/logo_dore_um5fsr.png', price: 12000, rating: 4.5 },
    { id: '4', name: 'Farine de Fonio', image_url: 'https://res.cloudinary.com/dtr2wtoty/image/upload/v1781224243/logo_dore_um5fsr.png', price: 4000 },
  ];

  const filteredProducts = activeFilter === '❤️ Sauvegardés'
    ? displayProducts.filter(p => savedProductIds.includes(p.id))
    : displayProducts;

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-zinc-950 font-sans">
      <ScrollView className="flex-1 px-4 pt-4 pb-28" showsVerticalScrollIndicator={false}>

        {/* A. Hero Section */}
        <View className="h-52 rounded-[2.5rem] p-6 mb-6 overflow-hidden bg-zinc-900 justify-between">
          <ImageBackground
            source={{ uri: 'https://res.cloudinary.com/dtr2wtoty/image/upload/v1783002400/A_high-end__photorealistic_commercial_shot_202607021426_vutjqi.jpg' }}
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
            imageStyle={{ opacity: 0.4 }}
          />
          <View className="flex-row justify-between items-start">
            <View>
              <Text className="text-white text-3xl font-black">Essentiels{'\n'}Nutrition</Text>
              <Text className="text-[#39FF14] text-sm font-bold mt-1">Atteignez vos objectifs plus vite.</Text>
            </View>
            <TouchableOpacity className="w-10 h-10 bg-white/20 rounded-full items-center justify-center relative backdrop-blur-md">
              <ShoppingBagIcon color="white" size={20} />
              <View className="absolute -top-1 -right-1 bg-[#39FF14] w-4 h-4 rounded-full items-center justify-center">
                <Text className="text-black text-[9px] font-black">2</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* B. Ticket à Gratter */}
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={handleScratch}
          className="rounded-3xl p-5 border-2 border-[#39FF14] mb-8 bg-zinc-900 items-center justify-center min-h-[120px]"
        >
          {!scratched ? (
            <View className="items-center">
               <View className="w-full h-full absolute bg-zinc-800/80 rounded-2xl" />
               <Text className="text-white font-bold text-center">Appuyez {3 - scratchCount} fois pour gratter et révéler votre cadeau !</Text>
            </View>
          ) : (
            <View className="items-center">
              <Text className="text-white text-sm font-bold mb-1">Félicitations !</Text>
              <Text className="text-[#39FF14] text-3xl font-black tracking-widest">CODE10</Text>
              <Text className="text-gray-400 text-xs mt-1">-10% de réduction immédiate</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* C. Nouveautés */}
        <View className="mb-8">
          <Text className="text-black dark:text-white text-lg font-bold mb-4">Nouveautés de la semaine</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
            {displayProducts.slice(0, 3).map(prod => (
              <View key={prod.id} className="w-32 mr-4">
                <View className="w-32 h-32 bg-zinc-100 dark:bg-zinc-900 rounded-2xl mb-2 p-2 relative">
                  <Image source={{ uri: prod.image_url }} className="w-full h-full" resizeMode="contain" />
                  {prod.isNew && (
                    <View className="absolute top-2 left-2 bg-black rounded-md px-1.5 py-0.5 border border-[#39FF14]">
                      <Text className="text-[#39FF14] text-[8px] font-bold uppercase">NEW</Text>
                    </View>
                  )}
                  {prod.stock <= 10 && (
                    <View className="absolute top-2 right-2 bg-red-500 rounded-md px-1.5 py-0.5">
                      <Text className="text-white text-[8px] font-bold uppercase">STOCK FAIBLE</Text>
                    </View>
                  )}
                </View>
                <Text className="text-black dark:text-white text-xs font-bold" numberOfLines={1}>{prod.name}</Text>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* D. Filtres & Recherche */}
        <View className="flex-row items-center bg-zinc-100 dark:bg-zinc-900 rounded-2xl p-3 mb-4">
          <Search color={isDark ? '#9CA3AF' : '#6B7280'} size={20} />
          <TextInput
            placeholder="Rechercher un produit..."
            placeholderTextColor={isDark ? '#9CA3AF' : '#6B7280'}
            className="flex-1 ml-2 text-black dark:text-white font-sans"
          />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row mb-6">
          {FILTERS.map(filter => {
            const isActive = activeFilter === filter;
            return (
              <TouchableOpacity
                key={filter}
                onPress={() => setActiveFilter(filter)}
                className={`px-4 py-2 rounded-full mr-2 border ${isActive ? 'bg-[#39FF14] border-[#39FF14]' : 'bg-transparent border-zinc-200 dark:border-zinc-800'}`}
              >
                <Text className={`text-xs font-bold ${isActive ? 'text-black' : 'text-gray-600 dark:text-gray-300'}`}>{filter}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* E. Grille Principale */}
        <View className="flex-row flex-wrap justify-between gap-y-6 mb-8">
          {filteredProducts.map(prod => {
            const isSaved = savedProductIds.includes(prod.id);
            return (
              <View key={prod.id} className="w-[48%]">
                <View className="w-full aspect-square bg-zinc-100 dark:bg-zinc-900 rounded-3xl p-3 mb-3 relative">
                  <Image source={{ uri: prod.image_url }} className="w-full h-full" resizeMode="contain" />
                  <TouchableOpacity
                    onPress={() => toggleSaveProduct(prod.id)}
                    className="absolute top-3 right-3 w-8 h-8 bg-white dark:bg-black rounded-full items-center justify-center shadow-sm"
                  >
                    <Heart size={16} color={isSaved ? '#EF4444' : (isDark ? '#FFF' : '#000')} fill={isSaved ? '#EF4444' : 'transparent'} />
                  </TouchableOpacity>
                </View>
                <Text className="text-black dark:text-white text-sm font-bold mb-1" numberOfLines={2}>{prod.name}</Text>

                {prod.rating && (
                  <View className="flex-row items-center mb-1">
                    <Text className="text-yellow-500 text-[10px]">★</Text>
                    <Text className="text-gray-500 text-[10px] ml-1">{prod.rating}</Text>
                  </View>
                )}

                <View className="flex-row items-end flex-wrap">
                  <Text className="text-[#39FF14] text-base font-black mr-2">
                    {Number(prod?.prix || prod?.price || prod?.prix_standard || 0).toLocaleString('fr-FR')} FCFA
                  </Text>
                  {prod.old_price && (
                    <Text className="text-gray-400 text-xs line-through mb-0.5">
                      {Number(prod.old_price).toLocaleString('fr-FR')} FCFA
                    </Text>
                  )}
                </View>
              </View>
            );
          })}
        </View>

        {/* F. Footer Blog */}
        <View className="bg-zinc-900 rounded-3xl p-5 mb-6 border border-zinc-800">
          <Text className="text-[#39FF14] text-xs font-bold uppercase mb-2">Conseil Bien-être</Text>
          <Text className="text-white text-base font-bold mb-4">Pourquoi le Fonio est indispensable à votre régime ?</Text>
          <TouchableOpacity className="bg-white/10 self-start px-4 py-2 rounded-xl">
             <Text className="text-white text-xs font-bold">Lire l'article</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

// Inline Icon to fix missing import
const ShoppingBagIcon = ({ color, size }: { color: string, size: number }) => (
  <View style={{ width: size, height: size, borderRadius: size/2, borderWidth: 2, borderColor: color, borderTopWidth: 0, marginTop: size/4 }}>
    <View style={{ position: 'absolute', top: -size/4, left: '20%', width: '60%', height: size/2, borderTopLeftRadius: size/4, borderTopRightRadius: size/4, borderWidth: 2, borderColor: color, borderBottomWidth: 0 }} />
  </View>
);
