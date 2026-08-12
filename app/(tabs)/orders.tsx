import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import GlobalHeader from '../../components/GlobalHeader';
import { supabase } from '../../lib/supabase';
import { Package, Clock, CheckCircle } from 'lucide-react-native';

export default function OrdersScreen() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchOrders = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
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
    <SafeAreaView className="flex-1 bg-white dark:bg-black" edges={['top']}>
      <GlobalHeader />
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
              <View key={order.id || idx} className="bg-zinc-100 dark:bg-zinc-900 rounded-2xl p-4 mb-4 border border-zinc-200 dark:border-zinc-800">
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
                    <Text key={i} className="text-gray-600 dark:text-gray-400 text-sm mb-1">• {item.quantity}x {item.name}</Text>
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
              </View>
            );
          })}
          <View className="h-20" />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
