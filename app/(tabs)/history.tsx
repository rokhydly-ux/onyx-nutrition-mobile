import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { useColorScheme } from 'nativewind';
import { Lock, ChevronLeft } from 'lucide-react-native';
import { supabase } from '../../lib/supabase';
import { Image, Alert } from 'react-native';
import GlobalHeader from '../../components/GlobalHeader';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

const screenWidth = Dimensions.get("window").width;

export default function HistoryScreen() {
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [isLoading, setIsLoading] = useState(true);
  const [logs, setLogs] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);

  const xp = profile?.jongoma_xp || 0;

  useEffect(() => {
    fetchHistoryData();
  }, []);

  const fetchHistoryData = async () => {
    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data: profileData } = await supabase
        .from('nutrition_profiles')
        .select('*')
        .eq('client_id', session.user.id)
        .maybeSingle();

      setProfile(profileData);

      const { data: logsData } = await supabase
        .from('nutrition_daily_logs')
        .select('*')
        .eq('client_id', session.user.id)
        .order('log_date', { ascending: true })
        .limit(7);

      if (logsData) {
        setLogs(logsData);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const chartConfig = {
    backgroundGradientFrom: isDark ? "#18181b" : "#ffffff",
    backgroundGradientTo: isDark ? "#18181b" : "#ffffff",
    color: (opacity = 1) => isDark ? `rgba(57, 255, 20, ${opacity})` : `rgba(57, 255, 20, ${opacity})`,
    labelColor: (opacity = 1) => isDark ? `rgba(255, 255, 255, ${opacity})` : `rgba(0, 0, 0, ${opacity})`,
    strokeWidth: 2,
    barPercentage: 0.5,
    useShadowColorFromDataset: false,
    propsForDots: {
      r: "4",
      strokeWidth: "2",
      stroke: "#39FF14"
    }
  };

  if (isLoading) {
    return (
      <View className="flex-1 bg-white dark:bg-zinc-950 justify-center items-center">
        <ActivityIndicator size="large" color="#39FF14" />
      </View>
    );
  }

  // Ensure we display exactly 7 days ending on current system date
  const generateLast7Days = () => {
    const days = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      days.push(d);
    }
    return days;
  };

  const last7Days = generateLast7Days();

  const mappedLogs = last7Days.map(dateObj => {
    const dateStr = dateObj.toISOString().split('T')[0];
    const existing = logs.find(l => l.log_date === dateStr);
    return existing || {
      log_date: dateStr,
      calories_consumed: 0,
      water_glasses: 0,
      protein_consumed: 0,
      carbs_consumed: 0,
      fats_consumed: 0
    };
  });

  const maxCalories = Math.max(...mappedLogs.map(l => l.calories_consumed), profile?.daily_calorie_goal || 2000, 1);
  const maxWater = 8; // standard 8 glasses

  const badges = [
    { title: 'Force Baobab', xpReq: 0, uri: 'https://res.cloudinary.com/dtr2wtoty/image/upload/v1784493020/FORCE_BAOBAB_ltcuer.png' },
    { title: 'Maître du Fonio', xpReq: 100, uri: 'https://res.cloudinary.com/dtr2wtoty/image/upload/v1784493020/MAITRE_DU_FONIO_emczhf.png' },
    { title: 'Lekkologue Or', xpReq: 500, uri: 'https://res.cloudinary.com/dtr2wtoty/image/upload/v1784493019/LEKKOLOGUE_OR_a0znxt.png' },
    { title: 'Légende', xpReq: 1000, uri: 'https://res.cloudinary.com/dtr2wtoty/image/upload/v1784493019/LEGENDE_z4ipny.png' },
  ];

  const handleExportPDF = async () => {
    try {
      const html = `
        <html>
          <head>
            <style>
              body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 20px; color: #333; }
              .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #39FF14; padding-bottom: 20px; margin-bottom: 30px; }
              .logo { width: 100px; }
              .title { font-size: 24px; font-weight: bold; color: #000; }
              .stats { margin-bottom: 40px; }
              .stat-box { background: #f4f4f5; padding: 15px; border-radius: 10px; margin-bottom: 10px; }
              .logs table { width: 100%; border-collapse: collapse; }
              .logs th, .logs td { padding: 12px; text-align: left; border-bottom: 1px solid #e4e4e7; }
              .logs th { background: #18181b; color: #fff; }
              .water { color: #3b82f6; font-weight: bold; }
              .cal { color: #39FF14; font-weight: bold; }
            </style>
          </head>
          <body>
            <div class="header">
              <div class="title">Bilan Nutritionnel - Onyx</div>
              <img src="https://res.cloudinary.com/dtr2wtoty/image/upload/v1781535959/A_cute__highly_detailed_3D_202606151505_ytie6s.jpg" class="logo" />
            </div>

            <div class="stats">
              <div class="stat-box"><strong>XP Total :</strong> ${xp} XP</div>
              <div class="stat-box"><strong>Objectif Calorique :</strong> ${profile?.daily_calorie_goal || 2000} kcal/jour</div>
            </div>

            <div class="logs">
              <h2>Historique des 7 derniers jours</h2>
              <table>
                <tr>
                  <th>Date</th>
                  <th>Calories</th>
                  <th>Protéines</th>
                  <th>Glucides</th>
                  <th>Lipides</th>
                  <th>Eau</th>
                </tr>
                ${mappedLogs.map(log => `
                  <tr>
                    <td>${new Date(log.log_date).toLocaleDateString('fr-FR')}</td>
                    <td class="cal">${log.calories_consumed || 0} kcal</td>
                    <td>${log.protein_consumed || 0}g</td>
                    <td>${log.carbs_consumed || 0}g</td>
                    <td>${log.fats_consumed || 0}g</td>
                    <td class="water">${log.water_glasses || 0}/8 verres</td>
                  </tr>
                `).join('')}
              </table>
            </div>
          </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({ html });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri);
      } else {
        Alert.alert('Erreur', 'Le partage n\'est pas disponible sur cet appareil.');
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Erreur', 'Impossible de générer le PDF.');
    }
  };

  return (
    <View className="flex-1 bg-white dark:bg-zinc-950 font-sans pt-4">

      <ScrollView className="flex-1 px-4 pb-12" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>

        <View className="flex-row items-center mb-6 mt-4">
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <ChevronLeft size={24} color={isDark ? '#FFF' : '#000'} />
          </TouchableOpacity>
          <Text className="text-2xl font-black dark:text-white" style={{ fontFamily: 'Poppins_700Bold' }}>MON HISTORIQUE</Text>
        </View>

        {/* WIDGET: ÉVOLUTION SUR 7 JOURS */}
        <View className="bg-zinc-50 dark:bg-zinc-900 rounded-[2rem] p-6 mb-6 shadow-sm border border-zinc-100 dark:border-zinc-800">
          <Text className="text-black dark:text-white font-bold mb-6 font-poppins-bold text-center">ÉVOLUTION SUR 7 JOURS</Text>

          <View className="flex-row justify-between h-40">
            {/* HYDRATATION */}
            <View className="flex-1 mr-2 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-2 items-center">
               <Text className="text-gray-400 text-[10px] font-bold mb-4">EAU (VERRES)</Text>
               <View className="flex-row items-end h-24 gap-1">
                 {mappedLogs.map((log, idx) => {
                   const heightPct = Math.min((log.water_glasses / maxWater) * 100, 100);
                   return (
                     <View key={`water-${idx}`} className="items-center flex-1">
                       <View className="w-full bg-blue-500 rounded-t-sm" style={{ height: `${heightPct}%`, minHeight: 4 }} />
                     </View>
                   );
                 })}
               </View>
            </View>

            {/* CALORIES */}
            <View className="flex-1 ml-2 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-2 items-center">
               <Text className="text-gray-400 text-[10px] font-bold mb-4">CALORIES</Text>
               <View className="flex-row items-end h-24 gap-1">
                 {mappedLogs.map((log, idx) => {
                   const heightPct = Math.min((log.calories_consumed / maxCalories) * 100, 100);
                   return (
                     <View key={`cal-${idx}`} className="items-center flex-1">
                       <View className="w-full bg-red-400 rounded-t-sm" style={{ height: `${heightPct}%`, minHeight: 4 }} />
                     </View>
                   );
                 })}
               </View>
            </View>
          </View>
          <View className="flex-row justify-between mt-2 px-2">
             {mappedLogs.map((log, idx) => (
                <Text key={`label-${idx}`} className="text-[10px] text-gray-500">{new Date(log.log_date).getDate()}</Text>
             ))}
          </View>
        </View>

        {/* LOGS LIST */}
        <View className="bg-zinc-50 dark:bg-zinc-900 rounded-[2rem] p-6 mb-6 shadow-sm border border-zinc-100 dark:border-zinc-800">
          <Text className="text-black dark:text-white font-bold mb-4 font-poppins-bold">Derniers Jours</Text>
          {logs.length > 0 ? logs.slice().reverse().map((log: any, idx: number) => {
            const isEmpty = (log.calories_consumed || 0) === 0;
            return (
              <View key={log.id || idx} className="flex-row justify-between items-center py-3 border-b border-zinc-200 dark:border-zinc-800 last:border-b-0">
                <View>
                  <Text className="text-black dark:text-white font-bold font-poppins-bold mb-1">{new Date(log.log_date).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })}</Text>
                  {isEmpty ? (
                    <TouchableOpacity className="bg-[#39FF14] px-3 py-1 rounded-full animate-pulse" onPress={() => router.push('/my-day')}>
                      <Text className="text-black text-[10px] font-bold uppercase" style={{ fontFamily: 'Poppins_700Bold' }}>Rattraper</Text>
                    </TouchableOpacity>
                  ) : (
                    <View className={`px-2 py-1 rounded w-24 items-center ${log.report_data?.status === 'Craquage' ? 'bg-red-100 dark:bg-red-900/30' : 'bg-green-100 dark:bg-green-900/30'}`}>
                      <Text className={`text-[10px] font-bold ${log.report_data?.status === 'Craquage' ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-[#39FF14]'}`}>
                        {log.report_data?.status === 'Craquage' ? 'Craquage' : 'Menu suivi'}
                      </Text>
                    </View>
                  )}
                </View>
                {!isEmpty && (
                  <View className="items-end">
                    <Text className="text-[#39FF14] font-bold font-poppins-bold text-lg">{log.calories_consumed || 0} <Text className="text-xs text-black dark:text-white">kcal</Text></Text>
                    <Text className="text-xs text-blue-500 mt-1">{log.water_glasses || 0}/8 💧</Text>
                  </View>
                )}
              </View>
            )
          }) : (
            <Text className="text-gray-500 text-center py-4">Aucun log récent trouvé.</Text>
          )}
        </View>

        {/* BADGES COLLECTION */}
        <View className="bg-zinc-50 dark:bg-zinc-900 rounded-[2rem] p-6 mb-10 shadow-sm border border-zinc-100 dark:border-zinc-800">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-black dark:text-white font-bold font-poppins-bold">Mes Badges</Text>
            <Text className="text-[#39FF14] font-bold font-poppins-bold">{xp} XP</Text>
          </View>

          <View className="flex-row flex-wrap justify-between gap-y-4">
            {badges.map((badge, idx) => {
              const unlocked = xp >= badge.xpReq;
              return (
                <View key={idx} className={`w-[48%] bg-white dark:bg-zinc-800 p-4 rounded-2xl items-center border ${unlocked ? 'border-[#39FF14]' : 'border-zinc-200 dark:border-zinc-700'}`}>
                  <View className={`w-16 h-16 rounded-full items-center justify-center mb-2 ${unlocked ? 'bg-[#39FF14]/20' : 'bg-gray-200 dark:bg-zinc-700'} overflow-hidden`}>
                     {!unlocked ? <Lock color="#9CA3AF" size={24} /> : <Image source={{ uri: badge.uri }} style={{ width: 60, height: 60, resizeMode: 'contain' }} />}
                  </View>
                  <Text className={`text-center text-xs font-poppins-bold ${unlocked ? 'text-black dark:text-white' : 'text-gray-400'}`}>{badge.title}</Text>
                  {!unlocked && (
                    <Text className="text-gray-400 text-[10px] mt-1 text-center font-poppins">Requis: {badge.xpReq} XP</Text>
                  )}
                </View>
              );
            })}
          </View>
        </View>

        {/* BOUTON EXPORT PDF */}
        <TouchableOpacity
            activeOpacity={0.9}
            onPress={handleExportPDF}
            className="bg-black dark:bg-zinc-800 rounded-full py-4 items-center justify-center mt-2 mx-4 shadow-lg mb-10">
            <Text className="text-[#39FF14] text-sm font-black uppercase tracking-wider" style={{ fontFamily: 'Poppins_700Bold' }}>EXPORTER MON BILAN (PDF)</Text>
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
}