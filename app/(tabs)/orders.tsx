import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, Platform, Modal, Image, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import GlobalHeader from '../../components/GlobalHeader';
import { supabase } from '../../lib/supabase';
import { Package, Clock, CheckCircle, X, ChevronRight } from 'lucide-react-native';

export default function OrdersScreen() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  const fetchOrders = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.error('Missing session or failed query/RLS error');
        return;
      }
      console.log('Active session user ID:', session.user.id);
      const { data, error } = await supabase
        .from('nutrition_orders')
        .select('*')
        .eq('client_id', session.user.id)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setOrders(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchOrders();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchOrders();
  };

  const getStatusColor = (status: string) => {
    const s = status?.toLowerCase() || '';
    if (s.includes('livr')) return 'text-[#39FF14]';
    if (s.includes('préparation') || s.includes('cours')) return 'text-yellow-400';
    return 'text-blue-400';
  };

  const getStatusIcon = (status: string) => {
    const s = status?.toLowerCase() || '';
    if (s.includes('livr')) return <CheckCircle size={20} color="#39FF14" />;
    if (s.includes('préparation') || s.includes('cours')) return <Clock size={20} color="#facc15" />;
    return <Package size={20} color="#60a5fa" />;
  };

  return (
    <View className="flex-1 bg-white dark:bg-black">

      <View className="px-5 pb-4"><Text className="text-2xl text-black dark:text-white" style={{ fontFamily: 'Poppins_900Black' }}>Suivi Commandes</Text></View>

      {loading && !refreshing ? (
        <View className="flex-1 justify-center items-center">
          <Text className="text-gray-500 font-bold">Chargement de vos commandes...</Text>
        </View>
      ) : orders.length === 0 ? (
        <View className="flex-1 justify-center items-center p-6">
          <Package size={64} color="gray" />
          <Text className="text-gray-500 text-lg text-center mt-4" style={{ fontFamily: 'Poppins_700Bold' }}>Vous n'avez pas encore passé de commande.</Text>
        </View>
      ) : (
        <ScrollView
          className="flex-1 px-4 pt-4"
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {orders.map((order, idx) => {
            const itemsList = Array.isArray(order.items) ? order.items : [];
            const dateStr = new Date(order.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });

            return (
              <TouchableOpacity key={order.id || idx} onPress={() => setSelectedOrder(order)} activeOpacity={0.8} className="bg-zinc-100 dark:bg-zinc-900 rounded-2xl p-4 mb-4 border border-zinc-200 dark:border-zinc-800">
                <View className="flex-row justify-between items-center mb-4 border-b border-zinc-200 dark:border-zinc-800 pb-2">
                  <View>
                    <Text className="text-gray-500 text-xs font-bold uppercase">Commande N°{order.id?.toString().slice(0, 8)}</Text>
                    <Text className="text-black dark:text-white font-bold">{dateStr}</Text>
                  </View>
                  <View className="items-end">
                    <View className="flex-row items-center bg-zinc-200 dark:bg-black px-2 py-1 rounded-full mb-1">
                      {getStatusIcon(order.status)}
                      <Text className={`ml-1 text-xs font-black ${getStatusColor(order.status)}`}>{order.status || 'Nouveau'}</Text>
                    </View>
                  </View>
                </View>

                <View className="mb-4">
                  {itemsList.map((item: any, i: number) => (
                    <Text key={i} className="text-gray-600 dark:text-gray-400 text-sm mb-1">
                      • {item.quantity}x {item.name || item.product_name || item.title || "Produit inconnu"}
                    </Text>
                  ))}
                </View>

                <View className="flex-row justify-between items-center pt-2 border-t border-zinc-200 dark:border-zinc-800">
                   <Text className="text-gray-500 text-sm font-bold">Total (Livraison incl.)</Text>
                   <Text className="text-black dark:text-white text-lg" style={{ fontFamily: 'Poppins_900Black' }}>{Number(order.total_amount || order.total || 0).toLocaleString('fr-FR')} FCFA</Text>
                </View>
                {order.delivery_address && (
                  <View className="mt-2 bg-black/5 dark:bg-white/5 p-2 rounded-lg">
                    <Text className="text-gray-500 text-xs text-center">Livraison : {order.delivery_address}</Text>
                  </View>
                )}
                <View className="absolute top-1/2 right-2 -translate-y-1/2">
                   <ChevronRight size={20} color="gray" />
                </View>
              </TouchableOpacity>
            );
          })}
          <View className="h-20" />
        </ScrollView>
      )}

      {/* Order Details Modal */}
      <Modal visible={!!selectedOrder} animationType="slide" transparent={false}>
        <View className="flex-1 bg-zinc-50 dark:bg-zinc-950">
          <View className="flex-row items-center justify-between px-5 py-4 bg-white dark:bg-black border-b border-zinc-200 dark:border-zinc-800 shadow-sm">
            <Text className="text-black dark:text-white text-lg" style={{ fontFamily: 'Poppins_700Bold' }}>Détail de la commande</Text>
            <TouchableOpacity onPress={() => setSelectedOrder(null)} className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-full">
              <X size={20} color="gray" />
            </TouchableOpacity>
          </View>

          {selectedOrder && (
            <ScrollView className="flex-1 px-4 pt-6">

              <View className="bg-white dark:bg-zinc-900 rounded-2xl p-5 mb-4 shadow-sm border border-zinc-100 dark:border-zinc-800">
                <Text className="text-gray-500 text-xs font-bold uppercase mb-2">Statut de la commande</Text>
                <View className="flex-row items-center">
                  {getStatusIcon(selectedOrder.status)}
                  <Text className={`ml-2 text-lg font-black ${getStatusColor(selectedOrder.status)}`}>{selectedOrder.status || 'Nouveau'}</Text>
                </View>
                <Text className="text-gray-400 text-xs mt-2">Passée le {new Date(selectedOrder.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</Text>
              </View>

              <View className="bg-white dark:bg-zinc-900 rounded-2xl p-5 mb-4 shadow-sm border border-zinc-100 dark:border-zinc-800">
                <Text className="text-gray-500 text-xs font-bold uppercase mb-4">Articles ({Array.isArray(selectedOrder.items) ? selectedOrder.items.reduce((acc: number, item: any) => acc + item.quantity, 0) : 0})</Text>
                {Array.isArray(selectedOrder.items) && selectedOrder.items.map((item: any, idx: number) => (
                  <View key={idx} className="flex-row items-center justify-between py-3 border-b border-zinc-100 dark:border-zinc-800">
                    <View className="flex-row flex-1 items-center pr-4">
                      <View className="bg-zinc-100 dark:bg-black w-8 h-8 rounded-full items-center justify-center mr-3">
                        <Text className="text-black dark:text-white font-bold">{item.quantity}x</Text>
                      </View>
                      <Text className="text-black dark:text-white flex-1" style={{ fontFamily: 'Poppins_500Medium' }}>
                        {item.name || item.product_name || item.title || "Produit inconnu"}
                      </Text>
                    </View>
                    <Text className="text-black dark:text-white font-bold">{(item.price * item.quantity).toLocaleString('fr-FR')} FCFA</Text>
                  </View>
                ))}
              </View>

              <View className="bg-white dark:bg-zinc-900 rounded-2xl p-5 mb-20 shadow-sm border border-zinc-100 dark:border-zinc-800">
                <Text className="text-gray-500 text-xs font-bold uppercase mb-4">Paiement & Livraison</Text>
                <View className="flex-row justify-between items-center mb-2">
                  <Text className="text-gray-500">Sous-total</Text>
                  <Text className="text-black dark:text-white font-medium">{Number(selectedOrder.total_amount || selectedOrder.total || 0).toLocaleString('fr-FR')} FCFA</Text>
                </View>
                {selectedOrder.delivery_fee !== undefined && (
                  <View className="flex-row justify-between items-center mb-2">
                    <Text className="text-gray-500">Livraison</Text>
                    <Text className="text-black dark:text-white font-medium">{selectedOrder.delivery_fee > 0 ? `${selectedOrder.delivery_fee.toLocaleString('fr-FR')} FCFA` : 'Gratuite'}</Text>
                  </View>
                )}
                {selectedOrder.delivery_address && (
                  <View className="flex-row justify-between items-center mb-4">
                    <Text className="text-gray-500">Adresse</Text>
                    <Text className="text-black dark:text-white font-medium text-right flex-1 ml-4" numberOfLines={2}>{selectedOrder.delivery_address}</Text>
                  </View>
                )}
                <View className="flex-row justify-between items-center pt-4 border-t border-zinc-200 dark:border-zinc-800 mt-2">
                   <Text className="text-black dark:text-white text-lg font-bold">Total</Text>
                   <Text className="text-[#39FF14] text-xl" style={{ fontFamily: 'Poppins_900Black' }}>{Number(selectedOrder.total_amount || selectedOrder.total || 0).toLocaleString('fr-FR')} FCFA</Text>
                </View>
              </View>

            </ScrollView>
          )}

          {/* Floating WhatsApp Button */}
          {selectedOrder && (
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => {
                const dateStr = new Date(selectedOrder.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
                const total = Number(selectedOrder.total_amount || selectedOrder.total || 0).toLocaleString('fr-FR');
                const message = `Bonjour, je vous contacte au sujet de ma commande N°${selectedOrder.id?.toString().slice(0, 8)} passée le ${dateStr} d'un montant de ${total} FCFA. \n\n (Lien Admin : https://nutriafro.app/admin/orders/${selectedOrder.id})`;
                Linking.openURL(`https://wa.me/221770000000?text=${encodeURIComponent(message)}`);
              }}
              className="absolute bottom-6 right-6 flex-row items-center bg-white dark:bg-zinc-800 pl-4 pr-2 py-2 rounded-full shadow-lg"
              style={{ elevation: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5 }}
            >
              <Text className="text-black dark:text-white text-xs font-bold mr-3" style={{ fontFamily: 'Poppins_700Bold' }}>Suivre ma commande</Text>
              <View className="w-12 h-12 bg-white rounded-full overflow-hidden items-center justify-center border-2 border-[#25D366]">
                <Image source={{ uri: 'https://similarpng.com/_next/image/?url=https%3A%2F%2Fimage.similarpng.com%2Ffile%2Fsimilarpng%2Fvery-thumbnail%2F2020%2F04%2Flogo-WhatsApp-Abstract-social-media-icon-png.png&w=3840&q=75' }} className="w-10 h-10 resize-contain" />
              </View>
            </TouchableOpacity>
          )}
        </View>
      </Modal>

    </View>
  );
}
