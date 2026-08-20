import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { useColorScheme } from 'nativewind';
import { Lock } from 'lucide-react-native';
import { supabase } from '../lib/supabase';
import { LineChart } from 'react-native-chart-kit';
import { Image } from 'react-native';
import GlobalHeader from '../components/GlobalHeader';

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

  // Pre-fill labels and data so chart-kit doesn't crash if logs is empty
  let labels = ["Lu", "Ma", "Me", "Je", "Ve", "Sa", "Di"];
  let caloriesData = [0, 0, 0, 0, 0, 0, 0];

  if (logs && logs.length > 0) {
    labels = logs.map(l => {
      const d = new Date(l.log_date);
      return `${d.getDate()}/${d.getMonth()+1}`;
    });
    caloriesData = logs.map(l => l.calories_consumed || 0);
  }

  const chartData = {
    labels: labels.length > 0 ? labels : ["Vide"],
    datasets: [
      {
        data: caloriesData.length > 0 ? caloriesData : [0],
        color: (opacity = 1) => `rgba(57, 255, 20, ${opacity})`,
        strokeWidth: 2
      }
    ]
  };

  const badges = [
    { title: 'Force Baobab', xpReq: 0, uri: 'https://res.cloudinary.com/dtr2wtoty/image/upload/v1784493020/FORCE_BAOBAB_ltcuer.png' },
    { title: 'Maître du Fonio', xpReq: 100, uri: 'https://res.cloudinary.com/dtr2wtoty/image/upload/v1784493020/MAITRE_DU_FONIO_emczhf.png' },
    { title: 'Lekkologue Or', xpReq: 500, uri: 'https://res.cloudinary.com/dtr2wtoty/image/upload/v1784493019/LEKKOLOGUE_OR_a0znxt.png' },
    { title: 'Légende', xpReq: 1000, uri: 'https://res.cloudinary.com/dtr2wtoty/image/upload/v1784493019/LEGENDE_z4ipny.png' },
  ];

  return (
    <View className="flex-1 bg-white dark:bg-zinc-950 font-sans pt-4">
      <GlobalHeader />

      <ScrollView className="flex-1 px-4 pb-12" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>

        <Text className="text-2xl font-black dark:text-white mb-6 mt-4" style={{ fontFamily: 'Poppins_700Bold' }}>MON HISTORIQUE</Text>

        {/* GRAPH VIEW */}
        <View className="bg-zinc-50 dark:bg-zinc-900 rounded-[2rem] p-4 mb-6 shadow-sm border border-zinc-100 dark:border-zinc-800">
          <Text className="text-black dark:text-white font-bold mb-4 font-poppins-bold">Évolution (Calories)</Text>
          <View className="items-center">
            <LineChart
              data={chartData}
              width={screenWidth - 64}
              height={220}
              chartConfig={chartConfig}
              bezier
              style={{
                marginVertical: 8,
                borderRadius: 16
              }}
            />
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
                    <TouchableOpacity className="bg-[#39FF14] px-3 py-1 rounded-full animate-pulse" onPress={() => console.log('Ouvrir bilan journalier')}>
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
            onPress={() => console.log('Export PDF')}
            className="bg-black dark:bg-zinc-800 rounded-full py-4 items-center justify-center mt-2 mx-4 shadow-lg mb-10">
            <Text className="text-[#39FF14] text-sm font-black uppercase tracking-wider" style={{ fontFamily: 'Poppins_700Bold' }}>EXPORTER MON BILAN (PDF)</Text>
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
}