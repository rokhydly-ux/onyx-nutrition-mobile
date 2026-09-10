import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, ActivityIndicator, Share, FlatList } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, ShoppingBag } from 'lucide-react-native';
import { supabase } from '../../lib/supabase';
import { useShopStore } from '../../lib/store';
import { useColorScheme } from 'nativewind';
import GlobalHeader from '../../components/GlobalHeader';

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isPremium, setIsPremium] = useState(false);
  const [similarProducts, setSimilarProducts] = useState<any[]>([]);

  const { shopCart, addToCart, removeFromCart, updateQuantity } = useShopStore();
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const cartCount = shopCart.reduce((acc, item) => acc + item.quantity, 0);

  useEffect(() => {
    checkPremiumStatus();
    if (id) {
      fetchProductAndSimilar();
    }
  }, [id]);

  const checkPremiumStatus = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      const { data } = await supabase.from('clients').select('plan_type').eq('id', session.user.id).maybeSingle();
      if (data && data.plan_type === 'Premium') setIsPremium(true);
    }
  };

  const fetchProductAndSimilar = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('nutrition_products')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      setSelectedProduct(data);

      if (data) {
        try {
          const newViews = (data.views || 0) + 1;
          await supabase.from('nutrition_products').update({ views: newViews }).eq('id', data.id);
        } catch (e) { }

        // Fetch similar products
        const { data: similar } = await supabase
          .from('nutrition_products')
          .select('*')
          .eq('categorie_nom', data.categorie_nom || '')
          .neq('id', data.id)
          .limit(4);
        if (similar) setSimilarProducts(similar);
      }
    } catch (error) {
      console.error('Error fetching product:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    if (!selectedProduct) return;
    try {
      await Share.share({
        message: `Découvre ${selectedProduct.nom || selectedProduct.name} sur Onyx Nutrition !\n\n${selectedProduct.description_courte || ''}\n\nhttps://nutriafro.app/product/${selectedProduct.id}`,
      });
    } catch (error: any) {
      console.error(error.message);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 bg-[#FAFAFA] dark:bg-[#0A0A0A] justify-center items-center">
        <ActivityIndicator size="large" color="#39FF14" />
      </View>
    );
  }

  if (!selectedProduct) {
    return (
      <SafeAreaView className="flex-1 bg-[#FAFAFA] dark:bg-[#0A0A0A] items-center justify-center">
        <Text className="text-black dark:text-white mb-4">Produit introuvable.</Text>
        <TouchableOpacity onPress={() => router.back()} className="bg-[#39FF14] px-6 py-3 rounded-full">
          <Text className="text-black font-bold">Retour</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-[#FAFAFA] dark:bg-[#0A0A0A] relative" edges={['top', 'bottom']}>
      {/* 1. LA BARRE GLOBALE */}
      <GlobalHeader />

      {/* Cart Navigation Helper (Fixes Dead-End) */}
      <View className="px-5 py-3 flex-row justify-between items-center border-b border-gray-200 dark:border-white/10 bg-white dark:bg-[#151515]">
        <TouchableOpacity onPress={() => router.back()} className="flex-row items-center space-x-2">
          <ArrowLeft size={20} color={isDark ? "#FFF" : "#000"} />
          <Text className="text-black dark:text-white font-bold" style={{ fontFamily: 'Poppins_700Bold' }}>Retour</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push('/(tabs)/shop')} className="relative">
          <ShoppingBag color={isDark ? "#FFF" : "#000"} size={24} />
          {cartCount > 0 && (
            <View className="absolute -top-1 -right-2 bg-red-500 w-4 h-4 rounded-full flex items-center justify-center">
              <Text className="text-white text-[10px] font-bold">{cartCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="p-6">
          <Image source={{ uri: selectedProduct.image_url || selectedProduct.gallery?.[0] || 'https://res.cloudinary.com/dtr2wtoty/image/upload/v1786107893/Ceramic_plate_with_herbs_on_202608071304_bl72q1.jpg' }} className="w-full h-48 resize-contain mb-6" />
          <Text className="text-black dark:text-white text-2xl mb-1" style={{ fontFamily: "Poppins_900Black" }}>{selectedProduct.nom || selectedProduct.name}</Text>
          {selectedProduct.description_courte && <Text className="text-gray-400 mb-2 italic">{selectedProduct.description_courte}</Text>}
          {(selectedProduct.description) && <Text className="text-black dark:text-white mb-4 leading-relaxed" style={{ fontFamily: 'Poppins_400Regular' }}>{selectedProduct.description}</Text>}
          <View className="flex-row items-center mb-6">
            <Text className="text-[#39FF14] text-2xl font-black mr-3">{Number(selectedProduct?.prix_standard || selectedProduct?.prix || selectedProduct?.price || 0).toLocaleString('fr-FR')} FCFA</Text>
            {selectedProduct.prix_premium && <Text className="text-black dark:text-white font-bold text-sm bg-yellow-400 px-2 py-1 rounded-lg">Premium: {Number(selectedProduct.prix_premium).toLocaleString('fr-FR')} FCFA</Text>}
          </View>

          <View className="flex-row items-center justify-between mb-8 space-x-2">
            {(() => {
              const cartItem = shopCart.find(i => i.id === selectedProduct.id);
              if (cartItem) {
                return (
                  <View className="flex-1 flex-row items-center justify-between bg-zinc-100 dark:bg-zinc-800 py-3 px-6 rounded-2xl mr-2">
                    <TouchableOpacity onPress={() => cartItem.quantity > 1 ? updateQuantity(selectedProduct.id, cartItem.quantity - 1) : removeFromCart(selectedProduct.id)} className="p-2">
                      <Text className="text-black dark:text-white text-3xl font-bold">-</Text>
                    </TouchableOpacity>
                    <Text className="text-black dark:text-white text-2xl" style={{ fontFamily: "Poppins_900Black" }}>{cartItem.quantity}</Text>
                    <TouchableOpacity onPress={() => updateQuantity(selectedProduct.id, cartItem.quantity + 1)} className="p-2">
                      <Text className="text-black dark:text-white text-3xl font-bold">+</Text>
                    </TouchableOpacity>
                  </View>
                );
              }
              return (
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => {
                    addToCart({ ...selectedProduct, _isPremiumUser: isPremium });
                    setToastMessage("Produit ajouté avec succès ✅");
                    setShowToast(true);
                    setTimeout(() => setShowToast(false), 3000);
                  }}
                  className="bg-[#39FF14] flex-1 py-4 rounded-2xl items-center shadow-lg shadow-[#39FF14]/30 mr-2"
                >
                  <Text className="text-black text-lg" style={{ fontFamily: "Poppins_900Black" }}>AJOUTER AU PANIER</Text>
                </TouchableOpacity>
              );
            })()}

            {/* Bouton Partage */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleShare}
              className="bg-zinc-200 dark:bg-zinc-800 px-4 py-4 rounded-2xl items-center justify-center"
            >
              <Text className="text-black dark:text-white" style={{ fontFamily: "Poppins_700Bold" }}>Partager</Text>
            </TouchableOpacity>
          </View>

          {similarProducts.length > 0 && (
            <View className="pb-10">
              <Text className="text-gray-500 dark:text-gray-400 mb-4 uppercase" style={{ fontFamily: "Poppins_700Bold" }}>Souvent acheté ensemble</Text>
              <FlatList
                data={similarProducts}
                horizontal
                showsHorizontalScrollIndicator={false}
                keyExtractor={item => item.id}
                renderItem={({ item: p }) => (
                  <TouchableOpacity className="w-24 mr-4" onPress={() => router.replace(`/product/${p.id}` as any)}>
                    <View className="w-24 h-24 bg-zinc-100 dark:bg-zinc-900 rounded-2xl p-2 mb-2">
                       <Image source={{ uri: p.image_url || p.gallery?.[0] }} className="w-full h-full resize-contain" />
                    </View>
                    <Text className="text-black dark:text-white text-[10px]" style={{ fontFamily: "Poppins_700Bold" }} numberOfLines={2}>{p.nom || p.name}</Text>
                  </TouchableOpacity>
                )}
              />
            </View>
          )}
        </View>
      </ScrollView>

      {/* Toast Notification */}
      {showToast && (
        <View className="absolute top-32 self-center bg-black/80 px-6 py-3 rounded-full z-50">
          <Text className="text-white text-sm font-bold" style={{ fontFamily: 'Poppins_700Bold' }}>
            {toastMessage}
          </Text>
        </View>
      )}

    </SafeAreaView>
  );
}
