import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Image, ImageBackground, TouchableOpacity, TextInput, LayoutAnimation, UIManager, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, Heart } from 'lucide-react-native';
import GlobalHeader from '../../components/GlobalHeader';
import { supabase } from '../../lib/supabase';
import { useColorScheme } from 'nativewind';
import { Modal, Vibration, Alert, Linking, Pressable, Share, FlatList } from 'react-native';
import { useShopStore } from '../../lib/store';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const FILTERS = ['Tous', '✨ Ventre Plat & Détox', '🔥 Énergie', '🍳 Cuisine Saine', '🥨 Snacks', '❤️ Sauvegardés'];
const PRICE_FILTERS = ['Tous', '- 3000 F', '3000 - 5000 F', '+ 5000 F'];

const DAKAR_ZONES = [
  { name: 'Plateau', zone: 1, fee: 1500 },
  { name: 'Médina', zone: 1, fee: 1500 },
  { name: 'Fann', zone: 1, fee: 1500 },
  { name: 'Point E', zone: 1, fee: 1500 },
  { name: 'Amitié', zone: 1, fee: 1500 },
  { name: 'Liberté', zone: 1, fee: 1500 },
  { name: 'Mermoz', zone: 1, fee: 1500 },
  { name: 'Sacré-Cœur', zone: 1, fee: 1500 },
  { name: 'Keur Gorgui', zone: 1, fee: 1500 },

  { name: 'Ouakam', zone: 2, fee: 2000 },
  { name: 'Mamelles', zone: 2, fee: 2000 },
  { name: 'Almadies', zone: 2, fee: 2000 },
  { name: 'Ngor', zone: 2, fee: 2000 },
  { name: 'Yoff', zone: 2, fee: 2000 },
  { name: 'Foires', zone: 2, fee: 2000 },
  { name: 'Grand Yoff', zone: 2, fee: 2000 },
  { name: 'Maristes', zone: 2, fee: 2000 },
  { name: 'Parcelles', zone: 2, fee: 2000 },

  { name: 'Cambérène', zone: 3, fee: 2500 },
  { name: 'Pikine', zone: 3, fee: 2500 },
  { name: 'Guédiawaye', zone: 3, fee: 2500 },
  { name: 'Dalifort', zone: 3, fee: 2500 },
  { name: 'Thiaroye', zone: 3, fee: 2500 },

  { name: 'Keur Massar', zone: 4, fee: 3500 },
  { name: 'Yeumbeul', zone: 4, fee: 3500 },
  { name: 'Malika', zone: 4, fee: 3500 },
  { name: 'Mbao', zone: 4, fee: 3500 },
  { name: 'Rufisque', zone: 4, fee: 3500 },

  { name: 'Diamniadio', zone: 5, fee: 5000 },
  { name: 'Sangalkam', zone: 5, fee: 5000 },
  { name: 'Lac Rose', zone: 5, fee: 5000 },
];

export default function ShopScreen() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';


  const [products, setProducts] = useState<any[]>([]);
  const [savedProductIds, setSavedProductIds] = useState<string[]>([]);
  const [activeFilter, setActiveFilter] = useState('Tous');
  const [activePriceFilter, setActivePriceFilter] = useState('Tous');

  const [scratchCount, setScratchCount] = useState(0);
  const [scratched, setScratched] = useState(false);

  // Cart & Modal State
  const { shopCart, addToCart, removeFromCart, updateQuantity, clearCart } = useShopStore();
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [appliedPromo, setAppliedPromo] = useState('');
  const [isPremium, setIsPremium] = useState(false);

  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("Produit ajouté avec succès ✅");
  const [showCheckoutOptions, setShowCheckoutOptions] = useState(false);
  const [showExitIntent, setShowExitIntent] = useState(false);
  const [hasSeenExitIntent, setHasSeenExitIntent] = useState(false);
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [showZoneAutocomplete, setShowZoneAutocomplete] = useState(false);
  const [deliveryFee, setDeliveryFee] = useState(0);

  const filteredZones = DAKAR_ZONES.filter(z => z.name.toLowerCase().includes(deliveryAddress.toLowerCase()));

  useEffect(() => {
    checkPremiumStatus();
  }, []);

  const checkPremiumStatus = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      const { data } = await supabase.from('clients').select('plan_type').eq('id', session.user.id).maybeSingle();
      if (data && data.plan_type === 'Premium') setIsPremium(true);
    }
  };

  const handleOpenProduct = async (prod: any) => {
    setSelectedProduct(prod);
    setIsModalVisible(true);
    if (prod.id) {
      try {
        const newViews = (prod.views || 0) + 1;
        await supabase.from('nutrition_products').update({ views: newViews }).eq('id', prod.id);
      } catch (e) {
        console.error("View count update failed", e);
      }
    }
  };


  const cartItemCount = shopCart.reduce((acc, item) => acc + item.quantity, 0);
  const calculatedTotal = shopCart.reduce((acc, item) => acc + (item.price * item.quantity), 0);


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
      Vibration.vibrate();
      LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);
      setScratched(true);
      setAppliedPromo('CODE10');
    }
  };

  // Mock Products if empty
  const displayProducts = products.length > 0 ? products : [
    { id: '1', name: 'Thé Détox Minceur 14 Jours', image_url: 'https://res.cloudinary.com/dtr2wtoty/image/upload/v1781224243/logo_dore_um5fsr.png', price: 15000, old_price: 18000, rating: 4.8, isNew: true },
    { id: '2', name: 'Graines de Chia Bio', image_url: 'https://res.cloudinary.com/dtr2wtoty/image/upload/v1781224243/logo_dore_um5fsr.png', price: 8000, stock: 5 },
    { id: '3', name: 'Infusion Sommeil Profond', image_url: 'https://res.cloudinary.com/dtr2wtoty/image/upload/v1781224243/logo_dore_um5fsr.png', price: 12000, rating: 4.5 },
    { id: '4', name: 'Farine de Fonio', image_url: 'https://res.cloudinary.com/dtr2wtoty/image/upload/v1781224243/logo_dore_um5fsr.png', price: 4000 },
  ];


  let filteredProducts = activeFilter === '❤️ Sauvegardés'
    ? displayProducts.filter(p => savedProductIds.includes(p.id))
    : displayProducts;

  if (activeFilter !== 'Tous' && activeFilter !== '❤️ Sauvegardés') {
    // Simple mock category filtering. We can enhance if we have actual categories in DB.
    // For now, if the user explicitly wants category filtering to work, and we don't have tags on products,
    // we can filter based on product name/description matching the filter loosely, or assume products have 'categorie' property.
    filteredProducts = filteredProducts.filter(p => p.categorie?.includes(activeFilter) || p.nom?.includes(activeFilter.replace(/✨|🔥|🍳|🥨|❤️/g, '').trim()) || p.name?.includes(activeFilter.replace(/✨|🔥|🍳|🥨|❤️/g, '').trim()));
  }

  if (activePriceFilter !== 'Tous') {
    filteredProducts = filteredProducts.filter(p => {
      const price = Number(p.prix_standard || p.prix || p.price || 0);
      if (activePriceFilter === '- 3000 F') return price < 3000;
      if (activePriceFilter === '3000 - 5000 F') return price >= 3000 && price <= 5000;
      if (activePriceFilter === '+ 5000 F') return price > 5000;
      return true;
    });
  }


  const handleCheckout = async () => {
    if (shopCart.length === 0) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const userId = session.user.id;

      const { data: profile } = await supabase
        .from('clients')
        .select('full_name, phone')
        .eq('id', userId)
        .maybeSingle();

      const finalTotal = appliedPromo ? calculatedTotal * 0.9 : calculatedTotal;

      let cartText = `Nouvelle Commande :\n`;
      shopCart.forEach(item => {
        cartText += `- ${item.quantity}x ${item.name}\n`;
      });
      cartText += `\nTotal: ${finalTotal.toLocaleString('fr-FR')} FCFA`;
      if (appliedPromo) cartText += ` (Code ${appliedPromo} appliqué)`;

      setShowCheckoutOptions(true);

    } catch(err) {
      console.error(err);
      Alert.alert("Erreur", "Impossible de valider la commande.");
    }
  };

  const handleShare = async () => {
    const message = `Découvre ${selectedProduct?.nom || selectedProduct?.name} sur l'application Onyx Nutrition !`;
    if (Platform.OS === 'web') {
      if (navigator.share) {
        try {
          await navigator.share({
            title: 'Onyx Nutrition',
            text: message,
          });
        } catch (error) {
          console.error(error);
        }
      } else {
        navigator.clipboard.writeText(message);
        setToastMessage("Lien copié !");
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
      }
    } else {
      try {
        await Share.share({
          message,
        });
      } catch (error: any) {
        console.error(error.message);
      }
    }
  };


  const executeClassicCheckout = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const userId = session.user.id;
      const { data: profile } = await supabase.from('clients').select('full_name, phone').eq('id', userId).maybeSingle();
      const baseTotal = appliedPromo ? calculatedTotal * 0.9 : calculatedTotal;
      const finalTotal = baseTotal + deliveryFee;

      await supabase.from('clients').update({ address: deliveryAddress }).eq('id', userId);
      await supabase.from('nutrition_orders').insert([{
        client_id: userId,
        client_name: profile?.full_name || 'Inconnu',
        phone: profile?.phone || '',
        items: shopCart,
        total: finalTotal,
        status: 'Nouveau',
        promo_code: appliedPromo,
        delivery_address: deliveryAddress,
        delivery_fee: deliveryFee,
        total_amount: finalTotal
      }]);

      clearCart();
      setDeliveryAddress('');
      setDeliveryFee(0);
      setIsModalVisible(false);
      setSelectedProduct(null);
      setShowCheckoutOptions(false);
      Alert.alert("Succès", "Votre commande a été enregistrée.");
    } catch (e) {
      console.error(e);
    }
  };

  const executeWhatsappCheckout = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const userId = session.user.id;
      const { data: profile } = await supabase.from('clients').select('full_name, phone').eq('id', userId).maybeSingle();
      const baseTotal = appliedPromo ? calculatedTotal * 0.9 : calculatedTotal;
      const finalTotal = baseTotal + deliveryFee;

      let cartText = `Nouvelle Commande :\n`;
      shopCart.forEach(item => {
        cartText += `- ${item.quantity}x ${item.name}\n`;
      });
      cartText += `\nAdresse de livraison: ${deliveryAddress}`;
      cartText += `\nFrais de livraison: ${deliveryFee} FCFA`;
      cartText += `\nTotal: ${finalTotal.toLocaleString('fr-FR')} FCFA`;
      if (appliedPromo) cartText += ` (Code ${appliedPromo} appliqué)`;

      await supabase.from('leads').insert([{
        full_name: profile?.full_name || 'Inconnu',
        phone: profile?.phone || '',
        intent: 'Sauvegarde Panier WhatsApp',
        status: 'Nouveau',
        message: cartText,
        saas: "Nutrition à l'Africaine"
      }]);

      const waURL = `whatsapp://send?phone=+221770000000&text=${encodeURIComponent(cartText)}`;
      Linking.openURL(waURL).catch(() => {
        Alert.alert("Erreur", "WhatsApp n'est pas installé sur cet appareil.");
      });

      clearCart();
      setDeliveryAddress('');
      setDeliveryFee(0);
      setIsModalVisible(false);
      setSelectedProduct(null);
      setShowCheckoutOptions(false);
    } catch (e) {
      console.error(e);
    }
  };

  const similarProducts = selectedProduct
    ? products
        .filter(p => p.categorie_nom === selectedProduct.categorie_nom && p.id !== selectedProduct.id && (p.stock === undefined || p.stock > 0))
        .sort(() => 0.5 - Math.random())
        .slice(0, 3)
    : [];

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-zinc-950 font-sans relative">
      <GlobalHeader />
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
              <Text className="text-white text-3xl" style={{ fontFamily: "Poppins_900Black" }}>Essentiels{'\n'}Nutrition</Text>
              <Text className="text-[#39FF14] text-sm font-bold mt-1">Atteignez vos objectifs plus vite.</Text>
            </View>
            <TouchableOpacity onPress={() => { setSelectedProduct(null); setIsModalVisible(true); }} className="w-10 h-10 bg-white/20 rounded-full items-center justify-center relative backdrop-blur-md">
              <ShoppingBagIcon color="white" size={20} />
              {cartItemCount > 0 && (
              <View className="absolute -top-1 -right-1 bg-[#39FF14] w-4 h-4 rounded-full items-center justify-center">
                <Text className="text-black text-[9px] font-black">{cartItemCount}</Text>
              </View>
            )}
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
               <Text className="text-white text-center" style={{ fontFamily: "Poppins_700Bold" }}>Appuyez {3 - scratchCount} fois pour gratter et révéler votre cadeau !</Text>
            </View>
          ) : (
            <View className="items-center">
              <Text className="text-white text-sm mb-1" style={{ fontFamily: "Poppins_700Bold" }}>Félicitations !</Text>
              <Text className="text-[#39FF14] text-3xl font-black tracking-widest">CODE10</Text>
              <Text className="text-gray-400 text-xs mt-1">-10% de réduction immédiate</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* C. Nouveautés */}
        <View className="mb-8">
          <Text className="text-black dark:text-white text-lg mb-4" style={{ fontFamily: "Poppins_700Bold" }}>Nouveautés de la semaine</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
            {displayProducts.slice(0, 3).map(prod => (
              <TouchableOpacity key={prod.id} activeOpacity={0.8} onPress={() => handleOpenProduct(prod)} className="w-32 mr-4">
                <View className="w-32 h-32 bg-zinc-100 dark:bg-zinc-900 rounded-2xl mb-2 p-2 relative">
                  <Image source={{ uri: prod.image_url }} className="w-full h-full" resizeMode="contain" />
                  {prod.isNew && (
                    <View className="absolute top-2 left-2 bg-black rounded-md px-1.5 py-0.5 border border-[#39FF14]">
                      <Text className="text-[#39FF14] text-[8px] font-bold uppercase">NEW</Text>
                    </View>
                  )}
                  {prod.stock <= 10 && (
                    <View className="absolute top-2 right-2 bg-red-500 rounded-md px-1.5 py-0.5">
                      <Text className="text-white text-[8px] font-bold uppercase">Quantité Limitée</Text>
                    </View>
                  )}
                </View>
                <Text className="text-black dark:text-white text-xs" style={{ fontFamily: "Poppins_700Bold" }} numberOfLines={1}>{prod.name}</Text>
              </TouchableOpacity>
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

        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row mb-4">
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

        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row mb-6">
          {PRICE_FILTERS.map(filter => {
            const isActive = activePriceFilter === filter;
            return (
              <TouchableOpacity
                key={filter}
                onPress={() => setActivePriceFilter(filter)}
                className={`px-3 py-1 rounded-full mr-2 border ${isActive ? 'bg-black dark:bg-white border-black dark:border-white' : 'bg-transparent border-zinc-300 dark:border-zinc-700'}`}
              >
                <Text className={`text-[10px] font-bold ${isActive ? 'text-white dark:text-black' : 'text-gray-500'}`}>{filter}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* E. Grille Principale */}
        <View className="flex-row flex-wrap justify-between gap-y-6 mb-8">
          {filteredProducts.map(prod => {
            const isSaved = savedProductIds.includes(prod.id);
            return (
              <TouchableOpacity key={prod.id} activeOpacity={0.8} onPress={() => handleOpenProduct(prod)} className="w-[48%]">
                <View className="w-full aspect-square bg-zinc-100 dark:bg-zinc-900 rounded-3xl p-3 mb-3 relative">
                  <Image source={{ uri: prod.image_url }} className="w-full h-full" resizeMode="contain" />
                  {prod.stock <= 10 && (
                    <View className="absolute top-3 left-3 bg-red-500 rounded-md px-2 py-1">
                      <Text className="text-white text-[8px] font-bold uppercase">Quantité Limitée</Text>
                    </View>
                  )}

                  <TouchableOpacity
                    onPress={() => toggleSaveProduct(prod.id)}
                    className="absolute top-3 right-3 w-8 h-8 bg-white dark:bg-black rounded-full items-center justify-center shadow-sm"
                  >
                    <Heart size={16} color={isSaved ? '#EF4444' : (isDark ? '#FFF' : '#000')} fill={isSaved ? '#EF4444' : 'transparent'} />
                  </TouchableOpacity>
                </View>
                <Text className="text-black dark:text-white text-sm mb-1" style={{ fontFamily: "Poppins_700Bold" }} numberOfLines={2}>{prod.name}</Text>


                {prod.rating && (
                  <View className="flex-row items-center mb-1">
                    <Text className="text-yellow-500 text-[10px]">★</Text>
                    <Text className="text-gray-500 text-[10px] ml-1">{prod.rating}</Text>
                  </View>
                )}

                <View className="flex-row items-end flex-wrap">
                  <Text className="text-[#39FF14] text-base font-black mr-2">
                    {Number(prod?.prix_standard || prod?.prix_premium || prod?.prix || prod?.price || 0).toLocaleString('fr-FR')} FCFA
                  </Text>
                  {prod.old_price && (
                    <Text className="text-gray-400 text-xs line-through mb-0.5">
                      {Number(prod.old_price).toLocaleString('fr-FR')} FCFA
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* F. Footer Blog */}
        <View className="bg-zinc-900 rounded-3xl p-5 mb-6 border border-zinc-800">
          <Text className="text-[#39FF14] text-xs font-bold uppercase mb-2">Conseil Bien-être</Text>
          <Text className="text-white text-base mb-4" style={{ fontFamily: "Poppins_700Bold" }}>Pourquoi le Fonio est indispensable à votre régime ?</Text>
          <TouchableOpacity className="bg-white/10 self-start px-4 py-2 rounded-xl">
             <Text className="text-white text-xs" style={{ fontFamily: "Poppins_700Bold" }}>Lire l'article</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>

      {/* Dynamic Modal for Product Details & Cart */}
      <Modal visible={isModalVisible} animationType="slide" transparent>
        <View className="flex-1 bg-black/80 justify-end">
          <View className="bg-white dark:bg-zinc-950 rounded-t-[2.5rem] p-6 h-[80%]">

            <TouchableOpacity onPress={() => {
                if (!selectedProduct && shopCart.length > 0 && !hasSeenExitIntent && !appliedPromo) {
                  setShowExitIntent(true);
                  setHasSeenExitIntent(true);
                } else {
                  setIsModalVisible(false);
                  setSelectedProduct(null);
                }
              }}
              className="w-10 h-10 bg-zinc-100 dark:bg-zinc-800 rounded-full items-center justify-center self-end mb-4">
               <Text className="text-black dark:text-white text-lg" style={{ fontFamily: "Poppins_700Bold" }}>✕</Text>
            </TouchableOpacity>

            {selectedProduct ? (
              <ScrollView showsVerticalScrollIndicator={false}>
                <Image source={{ uri: selectedProduct.image_url }} className="w-full h-48 resize-contain mb-6" />
                <Text className="text-black dark:text-white text-2xl mb-1" style={{ fontFamily: "Poppins_900Black" }}>{selectedProduct.nom || selectedProduct.name}</Text>
                {selectedProduct.description_courte && <Text className="text-gray-400 mb-2 italic">{selectedProduct.description_courte}</Text>}
                {(selectedProduct.description) && <Text className="text-black dark:text-white mb-4 leading-relaxed" style={{ fontFamily: 'Poppins_400Regular' }}>{selectedProduct.description}</Text>}
                <View className="flex-row items-center mb-6">
                  <Text className="text-[#39FF14] text-2xl font-black mr-3">{Number(selectedProduct?.prix_standard || selectedProduct?.prix || selectedProduct?.price || 0).toLocaleString('fr-FR')} FCFA</Text>
                  {selectedProduct.prix_premium && <Text className="text-black dark:text-white font-bold text-sm bg-yellow-400 px-2 py-1 rounded-lg">Premium: {Number(selectedProduct.prix_premium).toLocaleString('fr-FR')} FCFA</Text>}
                </View>


                                <View className="flex-row items-center justify-between mb-8 space-x-2">
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => {
                      addToCart({ ...selectedProduct, _isPremiumUser: isPremium });
                      setIsModalVisible(false);
                      setSelectedProduct(null);
                      setToastMessage("Produit ajouté avec succès ✅");
                      setShowToast(true);
                      setTimeout(() => setShowToast(false), 3000);
                    }}
                    className="bg-[#39FF14] flex-1 py-4 rounded-2xl items-center shadow-lg shadow-[#39FF14]/30 mr-2"
                  >
                    <Text className="text-black text-lg" style={{ fontFamily: "Poppins_900Black" }}>AJOUTER AU PANIER</Text>
                  </TouchableOpacity>

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
                  <View>
                    <Text className="text-gray-500 dark:text-gray-400 mb-4 uppercase" style={{ fontFamily: "Poppins_700Bold" }}>Souvent acheté ensemble</Text>
                    <FlatList
                      data={similarProducts}
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      keyExtractor={item => item.id}
                      renderItem={({ item: p }) => (
                        <TouchableOpacity className="w-24 mr-4" onPress={() => setSelectedProduct(p)}>
                          <View className="w-24 h-24 bg-zinc-100 dark:bg-zinc-900 rounded-2xl p-2 mb-2">
                             <Image source={{ uri: p.image_url }} className="w-full h-full resize-contain" />
                          </View>
                          <Text className="text-black dark:text-white text-[10px]" style={{ fontFamily: "Poppins_700Bold" }} numberOfLines={2}>{p.nom || p.name}</Text>
                        </TouchableOpacity>
                      )}
                    />
                  </View>
                )}
              </ScrollView>
            ) : (
              <View className="flex-1">
                <Text className="text-black dark:text-white text-2xl mb-6" style={{ fontFamily: "Poppins_900Black" }}>Mon Panier</Text>
                {shopCart.length > 0 ? (
                  <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
                    {shopCart.map(item => (
                      <View key={item.id} className="flex-row items-center justify-between mb-4 bg-zinc-100 dark:bg-zinc-900 p-3 rounded-2xl">
                         <View className="flex-1 pr-2">
                           <Text className="text-black dark:text-white" style={{ fontFamily: "Poppins_700Bold" }} numberOfLines={1}>{item.name}</Text>
                           <Text className="text-[#39FF14] font-bold">{item.price.toLocaleString('fr-FR')} FCFA</Text>
                         </View>
                         <View className="flex-row items-center bg-black dark:bg-white rounded-full px-2 py-1 ml-2">
                           <TouchableOpacity onPress={() => item.quantity > 1 ? updateQuantity(item.id, item.quantity - 1) : removeFromCart(item.id)}>
                             <Text className="text-white dark:text-black px-2">-</Text>
                           </TouchableOpacity>
                           <Text className="text-white dark:text-black px-2" style={{ fontFamily: "Poppins_700Bold" }}>{item.quantity}</Text>
                           <TouchableOpacity onPress={() => updateQuantity(item.id, item.quantity + 1)}>
                             <Text className="text-white dark:text-black px-2">+</Text>
                           </TouchableOpacity>
                         </View>
                      </View>
                    ))}
                  </ScrollView>
                ) : (
                  <View className="flex-1 items-center justify-center">
                    <Text className="text-gray-500">Votre panier est vide.</Text>
                  </View>
                )}


                {shopCart.length > 0 && (
                  <View className="pt-4 border-t border-zinc-200 dark:border-zinc-800">

                    <View className="mb-4 relative z-50">
                      <TextInput
                        placeholder="Recherchez votre quartier (ex: Mermoz)"
                        placeholderTextColor="gray"
                        value={deliveryAddress}
                        onChangeText={(text) => {
                          setDeliveryAddress(text);
                          setShowZoneAutocomplete(true);
                          if (!text) setDeliveryFee(0);
                        }}
                        onFocus={() => setShowZoneAutocomplete(true)}
                        className="bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 rounded-2xl text-black dark:text-white"
                        style={{ fontFamily: 'Poppins_400Regular' }}
                      />
                      {showZoneAutocomplete && deliveryAddress.length > 0 && (
                        <View className="absolute top-[100%] left-0 right-0 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl mt-1 max-h-48 z-[100]" style={{ elevation: 5 }}>
                          <ScrollView keyboardShouldPersistTaps="handled">
                            {filteredZones.map((z, idx) => (
                              <TouchableOpacity
                                key={idx}
                                className="p-4 border-b border-zinc-100 dark:border-zinc-800"
                                onPress={() => {
                                  setDeliveryAddress(`${z.name} (Zone ${z.zone})`);
                                  setDeliveryFee(z.fee);
                                  setShowZoneAutocomplete(false);
                                }}
                              >
                                <Text className="text-black dark:text-white font-bold">{z.name} <Text className="text-gray-400 font-normal">- Zone {z.zone} ({z.fee} F)</Text></Text>
                              </TouchableOpacity>
                            ))}
                            {filteredZones.length === 0 && (
                              <View className="p-4"><Text className="text-gray-500">Quartier introuvable. Veuillez saisir manuellement.</Text></View>
                            )}
                          </ScrollView>
                        </View>
                      )}
                    </View>
                    <View className="flex-row justify-between items-center mb-2">
                      <Text className="text-gray-500">Sous-total :</Text>
                      <Text className="text-black dark:text-white">{calculatedTotal.toLocaleString('fr-FR')} FCFA</Text>
                    </View>
                    <View className="flex-row justify-between items-center mb-2">
                      <Text className="text-gray-500">Livraison :</Text>
                      <Text className="text-black dark:text-white">{deliveryFee > 0 ? `${deliveryFee.toLocaleString('fr-FR')} FCFA` : '--'}</Text>
                    </View>
                    <View className="flex-row justify-between items-center mb-4">
                      <Text className="text-gray-500">Total :</Text>
                      <Text className="text-black dark:text-white text-2xl" style={{ fontFamily: "Poppins_900Black" }}>{(calculatedTotal + deliveryFee).toLocaleString('fr-FR')} FCFA</Text>
                    </View>

                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={handleCheckout}
                      className="bg-black dark:bg-[#39FF14] w-full py-4 rounded-2xl items-center"
                    >
                      <Text className="text-white dark:text-black text-lg" style={{ fontFamily: "Poppins_900Black" }}>VALIDER LA COMMANDE</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* Custom Green Toast */}
      {showToast && (
        <View className="absolute bottom-24 self-center bg-[#39FF14] rounded-full px-6 py-3 z-[100] shadow-lg flex-row items-center" style={{ elevation: 100 }}>
           <Text className="text-black text-center" style={{ fontFamily: "Poppins_700Bold" }}>{toastMessage}</Text>
        </View>
      )}


      {/* Exit Intent Modal */}
      {showExitIntent && (
        <View className="absolute inset-0 bg-black/80 flex items-center justify-center p-6 z-[100]" style={{ elevation: 100 }}>
          <View className="bg-[#39FF14] rounded-3xl p-8 w-full items-center">
             <Text className="text-black text-2xl text-center mb-2" style={{ fontFamily: "Poppins_900Black" }}>ATTENDEZ !</Text>
             <Text className="text-black text-center mb-6" style={{ fontFamily: "Poppins_500Medium" }}>Ne partez pas les mains vides. Profitez de 10% de réduction immédiate sur votre panier.</Text>

             <View className="bg-black rounded-xl py-3 px-6 mb-6">
                <Text className="text-[#39FF14] text-3xl tracking-widest" style={{ fontFamily: "Poppins_900Black" }}>CODE10</Text>
             </View>

             <TouchableOpacity
               onPress={() => { setAppliedPromo('CODE10'); setShowExitIntent(false); }}
               className="bg-black w-full py-4 rounded-xl mb-4 items-center"
             >
               <Text className="text-white" style={{ fontFamily: "Poppins_700Bold" }}>Appliquer le code</Text>
             </TouchableOpacity>
             <TouchableOpacity
               onPress={() => { setShowExitIntent(false); setIsModalVisible(false); setSelectedProduct(null); }}
               className="w-full py-4 rounded-xl items-center"
             >
               <Text className="text-black/60 underline" style={{ fontFamily: "Poppins_700Bold" }}>Non merci, je quitte le panier</Text>
             </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Custom Checkout Options Modal */}
      {showCheckoutOptions && (
        <View className="absolute inset-0 bg-black/80 flex items-center justify-center p-6 z-[100]" style={{ elevation: 100 }}>
          <View className="bg-white dark:bg-zinc-900 rounded-3xl p-6 w-full items-center">
             <Text className="text-black dark:text-white text-xl text-center mb-6" style={{ fontFamily: "Poppins_700Bold" }}>Validation du Panier</Text>
             <TouchableOpacity
               onPress={executeClassicCheckout}
               className="bg-black dark:bg-[#39FF14] w-full py-4 rounded-xl mb-4 items-center"
             >
               <Text className="text-white dark:text-black" style={{ fontFamily: "Poppins_700Bold" }}>Commander Classiquement</Text>
             </TouchableOpacity>
             <TouchableOpacity
               onPress={executeWhatsappCheckout}
               className="bg-[#25D366] w-full py-4 rounded-xl mb-4 items-center"
             >
               <Text className="text-white" style={{ fontFamily: "Poppins_700Bold" }}>M'envoyer mon panier (WhatsApp)</Text>
             </TouchableOpacity>
             <TouchableOpacity
               onPress={() => setShowCheckoutOptions(false)}
               className="bg-zinc-200 dark:bg-zinc-800 w-full py-4 rounded-xl items-center"
             >
               <Text className="text-black dark:text-white" style={{ fontFamily: "Poppins_700Bold" }}>Annuler</Text>
             </TouchableOpacity>
          </View>
        </View>
      )}

    </SafeAreaView>
  );
}

// Inline Icon to fix missing import
const ShoppingBagIcon = ({ color, size }: { color: string, size: number }) => (
  <View style={{ width: size, height: size, borderRadius: size/2, borderWidth: 2, borderColor: color, borderTopWidth: 0, marginTop: size/4 }}>
    <View style={{ position: 'absolute', top: -size/4, left: '20%', width: '60%', height: size/2, borderTopLeftRadius: size/4, borderTopRightRadius: size/4, borderWidth: 2, borderColor: color, borderBottomWidth: 0 }} />
  </View>
);
