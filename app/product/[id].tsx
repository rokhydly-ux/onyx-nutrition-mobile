import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Plus } from 'lucide-react-native';
import { supabase } from '../../lib/supabase';
import { useShopStore } from '../../lib/store';
import { useColorScheme } from 'nativewind';

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isPremium, setIsPremium] = useState(false);
  const { addToCart } = useShopStore();
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    checkPremiumStatus();
    if (id) {
      fetchProduct();
    }
  }, [id]);

  const checkPremiumStatus = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      const { data } = await supabase.from('clients').select('plan_type').eq('id', session.user.id).maybeSingle();
      if (data && data.plan_type === 'Premium') setIsPremium(true);
    }
  };

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('nutrition_products')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      setProduct(data);

      if (data) {
        // Increment views
        try {
          const newViews = (data.views || 0) + 1;
          await supabase.from('nutrition_products').update({ views: newViews }).eq('id', data.id);
        } catch (e) {
          console.error("View count update failed", e);
        }
      }
    } catch (error) {
      console.error('Error fetching product:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = () => {
    if (!product) return;
    addToCart({ ...product, _isPremiumUser: isPremium });
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2000);
  };

  if (loading) {
    return (
      <View className="flex-1 bg-[#FAFAFA] dark:bg-[#0A0A0A] justify-center items-center">
        <ActivityIndicator size="large" color="#39FF14" />
      </View>
    );
  }

  if (!product) {
    return (
      <SafeAreaView className="flex-1 bg-[#FAFAFA] dark:bg-[#0A0A0A] items-center justify-center">
        <Text className="text-black dark:text-white mb-4">Produit introuvable.</Text>
        <TouchableOpacity onPress={() => router.back()} className="bg-[#39FF14] px-6 py-3 rounded-full">
          <Text className="text-black font-bold">Retour</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const images = (product.gallery && product.gallery.length > 0)
    ? product.gallery
    : [product.image_url || 'https://res.cloudinary.com/dtr2wtoty/image/upload/v1786107893/Ceramic_plate_with_herbs_on_202608071304_bl72q1.jpg'];

  const finalPrice = isPremium && product.prix_premium ? product.prix_premium : (product.prix_standard || product.prix || product.price || 0);

  return (
    <SafeAreaView className="flex-1 bg-[#FAFAFA] dark:bg-[#0A0A0A] relative" edges={['top', 'bottom']}>
      {/* Absolute Back Button (Top Left) */}
      <View className="absolute top-12 left-5 z-50">
        <TouchableOpacity onPress={() => router.back()} className="p-3 bg-black/40 rounded-full backdrop-blur-md">
          <ArrowLeft size={20} color="#FFF" />
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Product Image */}
        <View className="w-full h-80 relative bg-gray-100 dark:bg-[#151515]">
          <Image source={{ uri: images[0] }} className="w-full h-full" resizeMode="cover" />
        </View>

        {/* Content */}
        <View className="px-5 pt-6 pb-24">
           <View className="flex-row justify-between items-start mb-2">
             <View className="flex-1 pr-4">
               <Text className="text-black dark:text-white text-2xl font-bold" style={{ fontFamily: 'Poppins_700Bold' }}>
                 {product.nom}
               </Text>
               <Text className="text-[#39FF14] font-bold text-sm uppercase tracking-wider mt-1" style={{ fontFamily: 'Poppins_700Bold' }}>
                 {product.categorie_nom || 'Nutrition'}
               </Text>
             </View>

             {/* Pricing */}
             <View className="items-end">
               <Text className="text-black dark:text-white text-2xl font-bold" style={{ fontFamily: 'Poppins_700Bold' }}>
                 {finalPrice} F
               </Text>
               {isPremium && product.prix_premium && (product.prix_standard > product.prix_premium) && (
                 <Text className="text-gray-400 text-xs line-through" style={{ fontFamily: 'Poppins_400Regular' }}>
                   {product.prix_standard} F
                 </Text>
               )}
             </View>
           </View>

           {/* Details */}
           <View className="mt-6 bg-white dark:bg-[#151515] p-5 rounded-3xl border border-gray-200 dark:border-white/10 shadow-sm">
             <Text className="text-black dark:text-white font-bold mb-2 text-lg" style={{ fontFamily: 'Poppins_700Bold' }}>
               Description
             </Text>
             <Text className="text-gray-600 dark:text-gray-300 leading-relaxed text-sm" style={{ fontFamily: 'Poppins_400Regular' }}>
               {product.description_longue || product.description_courte || "Aucune description disponible pour ce produit."}
             </Text>
           </View>

           {/* Nutritional Info (if available, mocked here based on context) */}
           {product.calories && (
             <View className="mt-4 flex-row space-x-3">
               <View className="flex-1 bg-white dark:bg-[#151515] p-4 rounded-3xl items-center border border-gray-200 dark:border-white/10">
                 <Text className="text-gray-400 text-xs font-bold uppercase mb-1">Calories</Text>
                 <Text className="text-black dark:text-white font-bold">{product.calories} kcal</Text>
               </View>
             </View>
           )}

        </View>
      </ScrollView>

      {/* Add to Cart Footer */}
      <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }} className="bg-white dark:bg-[#111] px-5 py-4 pb-6 border-t border-gray-200 dark:border-white/10 shadow-lg z-50">
        <TouchableOpacity
          onPress={handleAddToCart}
          className="bg-[#39FF14] flex-row items-center justify-center py-4 rounded-2xl w-full shadow-[0_0_15px_rgba(57,255,20,0.3)]"
        >
          <Plus size={20} color="#000" />
          <Text className="text-black text-lg font-bold ml-2" style={{ fontFamily: 'Poppins_700Bold' }}>
            Ajouter au panier
          </Text>
        </TouchableOpacity>
      </View>

      {/* Toast Notification */}
      {showToast && (
        <View className="absolute top-14 self-center bg-black/80 px-6 py-3 rounded-full z-50">
          <Text className="text-white text-sm font-bold" style={{ fontFamily: 'Poppins_700Bold' }}>
            Produit ajouté avec succès ✅
          </Text>
        </View>
      )}

    </SafeAreaView>
  );
}
