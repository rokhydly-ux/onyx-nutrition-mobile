import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Image, ImageBackground, TouchableOpacity, TextInput, LayoutAnimation, UIManager, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, Heart } from 'lucide-react-native';
import GlobalHeader from '../../components/GlobalHeader';
import { supabase } from '../../lib/supabase';
import { useColorScheme } from 'nativewind';
import { Modal, Vibration, Alert, Linking, Pressable, Share } from 'react-native';
import { useShopStore } from '../../lib/store';

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

  // Cart & Modal State
  const { shopCart, addToCart, removeFromCart, updateQuantity, clearCart } = useShopStore();
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [appliedPromo, setAppliedPromo] = useState('');
  const [isPremium, setIsPremium] = useState(false);

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


  const filteredProducts = activeFilter === '❤️ Sauvegardés'
    ? displayProducts.filter(p => savedProductIds.includes(p.id))
    : displayProducts;


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

      Alert.alert(
        "Validation du Panier",
        "Comment souhaitez-vous procéder ?",
        [
          {
            text: "Commander Classiquement",
            onPress: async () => {
               // Update client address if collected (stub since UI isn't asking yet)
               await supabase.from('clients').update({ address: 'A configurer' }).eq('id', userId);

               await supabase.from('nutrition_orders').insert([{
                 client_id: userId,
                 client_name: profile?.full_name || 'Inconnu',
                 phone: profile?.phone || '',
                 items: shopCart,
                 total: finalTotal,
                 status: 'Nouveau',
                 promo_code: appliedPromo
               }]);
               clearCart();
               setIsModalVisible(false);
               setSelectedProduct(null);
               Alert.alert("Succès", "Votre commande a été enregistrée.");
            }
          },
          {
            text: "M'envoyer mon panier (WhatsApp)",
            onPress: async () => {
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
               setIsModalVisible(false);
               setSelectedProduct(null);
            }
          },
          { text: "Annuler", style: "cancel" }
        ]
      );

    } catch(err) {
      console.error(err);
      Alert.alert("Erreur", "Impossible de valider la commande.");
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Découvre ${selectedProduct?.nom || selectedProduct?.name} sur l'application Onyx Nutrition !`,
      });
    } catch (error: any) {
      console.error(error.message);
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
              <TouchableOpacity key={prod.id} activeOpacity={0.8} onPress={() => handleOpenProduct(prod)} className="w-[48%]">
                <View className="w-full aspect-square bg-zinc-100 dark:bg-zinc-900 rounded-3xl p-3 mb-3 relative">
                  <Image source={{ uri: prod.image_url }} className="w-full h-full" resizeMode="contain" />

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
            <TouchableOpacity onPress={() => { setIsModalVisible(false); setSelectedProduct(null); }} className="w-10 h-10 bg-zinc-100 dark:bg-zinc-800 rounded-full items-center justify-center self-end mb-4">
               <Text className="text-black dark:text-white text-lg" style={{ fontFamily: "Poppins_700Bold" }}>✕</Text>
            </TouchableOpacity>

            {selectedProduct ? (
              <ScrollView showsVerticalScrollIndicator={false}>
                <Image source={{ uri: selectedProduct.image_url }} className="w-full h-48 resize-contain mb-6" />
                <Text className="text-black dark:text-white text-2xl mb-1" style={{ fontFamily: "Poppins_900Black" }}>{selectedProduct.nom || selectedProduct.name}</Text>
                {selectedProduct.description && <Text className="text-gray-500 mb-4">{selectedProduct.description}</Text>}
                <View className="flex-row items-center mb-6">
                  <Text className="text-[#39FF14] text-2xl font-black mr-3">{Number(selectedProduct?.prix_standard || selectedProduct?.prix_premium || selectedProduct?.prix || selectedProduct?.price || 0).toLocaleString('fr-FR')} FCFA</Text>
                  {selectedProduct.old_price && <Text className="text-gray-400 line-through text-sm">{Number(selectedProduct.old_price).toLocaleString('fr-FR')} FCFA</Text>}
                </View>


                                <View className="flex-row items-center justify-between mb-8 space-x-2">
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => {
                      addToCart({ ...selectedProduct, _isPremiumUser: isPremium });
                      Alert.alert(
                        "Produit ajouté !",
                        "Que souhaitez-vous faire ?",
                        [
                          { text: "Continuer mes achats", style: "cancel", onPress: () => setIsModalVisible(false) },
                          { text: "🛒 Voir mon panier", onPress: () => setSelectedProduct(null) } // Setting product null shows the cart view
                        ]
                      );
                    }}
                    className="bg-[#39FF14] flex-1 py-4 rounded-2xl items-center shadow-lg shadow-[#39FF14]/30 mr-2"
                  >
                    <Text className="text-black text-lg" style={{ fontFamily: "Poppins_900Black" }}>AJOUTER AU PANIER</Text>
                  </TouchableOpacity>

                  {/* Bouton Partage */}

                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={handleShare}
                    className="bg-zinc-200 dark:bg-zinc-800 w-14 h-14 rounded-2xl items-center justify-center"
                  >
                    <Text className="text-xl">↗️</Text>
                  </TouchableOpacity>
                </View>

                {similarProducts.length > 0 && (
                  <View>
                    <Text className="text-gray-500 dark:text-gray-400 mb-4 uppercase" style={{ fontFamily: "Poppins_700Bold" }}>Souvent acheté ensemble</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
                      {similarProducts.map(p => (
                        <TouchableOpacity key={p.id} className="w-24 mr-4" onPress={() => setSelectedProduct(p)}>
                          <View className="w-24 h-24 bg-zinc-100 dark:bg-zinc-900 rounded-2xl p-2 mb-2">
                             <Image source={{ uri: p.image_url }} className="w-full h-full resize-contain" />
                          </View>
                          <Text className="text-black dark:text-white text-[10px]" style={{ fontFamily: "Poppins_700Bold" }} numberOfLines={2}>{p.nom || p.name}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
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
                    <View className="flex-row justify-between items-center mb-4">
                      <Text className="text-gray-500">Total :</Text>
                      <Text className="text-black dark:text-white text-2xl" style={{ fontFamily: "Poppins_900Black" }}>{calculatedTotal.toLocaleString('fr-FR')} FCFA</Text>
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
    </SafeAreaView>
  );
}

// Inline Icon to fix missing import
const ShoppingBagIcon = ({ color, size }: { color: string, size: number }) => (
  <View style={{ width: size, height: size, borderRadius: size/2, borderWidth: 2, borderColor: color, borderTopWidth: 0, marginTop: size/4 }}>
    <View style={{ position: 'absolute', top: -size/4, left: '20%', width: '60%', height: size/2, borderTopLeftRadius: size/4, borderTopRightRadius: size/4, borderWidth: 2, borderColor: color, borderBottomWidth: 0 }} />
  </View>
);
