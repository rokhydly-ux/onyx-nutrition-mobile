import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { ArrowLeft, Target, Activity, Check } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import ConfettiCannon from 'react-native-confetti-cannon';
import Svg, { Path, Defs, LinearGradient, Stop, Circle, Line as SvgLine } from 'react-native-svg';

type WeightLog = {
  log_date: string;
  weight: number;
};

const SUPERFOODS = [
  {
    id: 1,
    title: "Le Soumbala (Nététou)",
    description: "Un super-aliment local exceptionnel, riche en protéines.",
    productId: "prod_soumbala_123"
  },
  {
    id: 2,
    title: "Le Fruit du Baobab (Bouye)",
    description: "Une explosion de vitamine C et de calcium pour votre énergie.",
    productId: "prod_bouye_456"
  },
  {
    id: 3,
    title: "Le Fonio",
    description: "La céréale miracle, sans gluten et à index glycémique bas.",
    productId: "prod_fonio_789"
  }
];

export default function WeightScreen() {
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { width } = Dimensions.get('window');

  const [loading, setLoading] = useState(true);
  const [profileId, setProfileId] = useState<string | null>(null);

  // Data State
  const [currentWeight, setCurrentWeight] = useState<number | null>(null);
  const [targetWeight, setTargetWeight] = useState<number | null>(null);
  const [height, setHeight] = useState<number | null>(null);
  const [weightLogs, setWeightLogs] = useState<WeightLog[]>([]);
  const [diagnosticData, setDiagnosticData] = useState<any>({});

  // Input State
  const [newWeight, setNewWeight] = useState('');
  const [saving, setSaving] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const [randomSuperfood, setRandomSuperfood] = useState(SUPERFOODS[0]);

  React.useEffect(() => {
    const randomIndex = Math.floor(Math.random() * SUPERFOODS.length);
    setRandomSuperfood(SUPERFOODS[randomIndex]);
  }, []);

  const handleQuickAdjust = (amount: number) => {
    const baseWeight = parseFloat(newWeight) || currentWeight || 0;
    const newValue = (baseWeight + amount).toFixed(1);
    if (parseFloat(newValue) >= 0) {
      setNewWeight(newValue.toString());
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchWeightData();
    }, [])
  );

  React.useEffect(() => {
    let channel: any;

    const setupRealtime = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      const channelName = `weight_sync_${Date.now()}`;
      channel = supabase.channel(channelName);

      channel.on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'nutrition_profiles',
          filter: `client_id=eq.${session.user.id}`,
        },
        (payload: any) => {
          const newProfile = payload.new as any;
          if (newProfile) {
            const diag = newProfile.diagnostic_data || {};
            setDiagnosticData(diag);
            setCurrentWeight(diag.currentWeight || null);
            setTargetWeight(diag.targetWeight || null);
            setHeight(diag.height || null);

            let logs: WeightLog[] = [];
            try {
              if (newProfile.weight_logs) {
                logs = typeof newProfile.weight_logs === 'string'
                  ? JSON.parse(newProfile.weight_logs)
                  : newProfile.weight_logs;
              }
            } catch (e) {
              console.error('Error parsing weight_logs in Realtime', e);
            }
            setWeightLogs(logs);
          }
        }
      );
      channel.subscribe();
    };

    setupRealtime();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  const fetchWeightData = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      const { data, error } = await supabase
        .from('nutrition_profiles')
        .select('*')
        .eq('client_id', session.user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setProfileId(data.id);
        const diag = data.diagnostic_data || {};
        setDiagnosticData(diag);
        setTargetWeight(diag.targetWeight || null);
        setCurrentWeight(diag.currentWeight || null);
        setHeight(diag.height || null);

        // Parse weight_logs from the independent column
        let logs: WeightLog[] = [];
        try {
          if (data.weight_logs) {
            logs = typeof data.weight_logs === 'string' ? JSON.parse(data.weight_logs) : data.weight_logs;
          }
        } catch (parseError) {
          console.error('Error parsing weight_logs JSON', parseError);
          logs = [];
        }
        setWeightLogs(logs);
      }
    } catch (e) {
      console.error('Error fetching weight data', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveWeight = async () => {
    if (!newWeight.trim() || saving) return;

    const weightVal = parseFloat(newWeight.replace(',', '.'));
    if (isNaN(weightVal) || !profileId) return;

    setSaving(true);
    try {
      const todayStr = new Date().toISOString().split('T')[0];

      // Update logs: filter out today if it exists, then append and sort chronologically
      const filteredLogs = weightLogs.filter(log => log.log_date !== todayStr);
      const newLogs = [...filteredLogs, { log_date: todayStr, weight: weightVal }]
        .sort((a, b) => new Date(a.log_date).getTime() - new Date(b.log_date).getTime());

      // Correct payload per instruction: weight_logs is its own column
      const { error } = await supabase
        .from('nutrition_profiles')
        .update({
          weight_logs: newLogs,
          diagnostic_data: {
            ...diagnosticData,
            currentWeight: weightVal
          }
        })
        .eq('id', profileId);

      if (error) throw error;

      // Update local state
      setWeightLogs(newLogs);
      setCurrentWeight(weightVal);
      setDiagnosticData({ ...diagnosticData, currentWeight: weightVal });
      setNewWeight('');

      // Gamification Logic
      if (targetWeight) {
        const startWeight = diagnosticData.currentWeight || weightVal; // Just for direction check if no history
        const isLosing = targetWeight < startWeight;
        const isGaining = targetWeight > startWeight;

        if ((isLosing && weightVal <= targetWeight) || (isGaining && weightVal >= targetWeight)) {
           setSuccessMessage("Objectif Atteint ! 🎉");
           setShowConfetti(true);
           setTimeout(() => setShowConfetti(false), 5000);
        } else {
           // Provide encouraging mini-toast logic here if desired
        }
      }

    } catch (e) {
      console.error('Error saving weight', e);
    } finally {
      setSaving(false);
    }
  };

  const calculateBMI = () => {
    if (!currentWeight || !height) return 0;
    const heightInMeters = height / 100;
    return (currentWeight / (heightInMeters * heightInMeters)).toFixed(1);
  };

  const getBMIStatus = (bmiStr: string) => {
    const bmi = parseFloat(bmiStr);
    if (bmi < 18.5) return { label: 'Insuffisance', color: '#3B82F6' };
    if (bmi >= 18.5 && bmi < 25) return { label: 'Normal', color: '#39FF14' };
    if (bmi >= 25 && bmi < 30) return { label: 'Surpoids', color: '#EAB308' };
    return { label: 'Obésité', color: '#EF4444' };
  };

  const bmi = calculateBMI();
  const bmiStatus = bmi ? getBMIStatus(bmi as string) : null;

  // --- SVG CHART LOGIC ---
  const renderChart = () => {
    if (weightLogs.length < 2) {
      return (
        <View className="h-40 items-center justify-center bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-200 dark:border-white/10 mt-4">
           <Activity size={24} color={isDark ? '#555' : '#CCC'} />
           <Text className="text-gray-400 text-xs mt-2 text-center px-4">Plus de données sont nécessaires pour afficher l&apos;évolution.</Text>
        </View>
      );
    }

    const chartHeight = 160;
    const chartWidth = width - 40 - 32; // Screen width - padding

    const minWeight = Math.min(...weightLogs.map(l => l.weight), targetWeight || Infinity) - 2;
    const maxWeight = Math.max(...weightLogs.map(l => l.weight), targetWeight || -Infinity) + 2;
    const range = maxWeight - minWeight;

    const points = weightLogs.map((log, index) => {
      const x = (index / (weightLogs.length - 1)) * chartWidth;
      const y = chartHeight - ((log.weight - minWeight) / range) * chartHeight;
      return `${x},${y}`;
    });

    const pathData = `M${points.join(' L')}`;
    const areaData = `${pathData} L${chartWidth},${chartHeight} L0,${chartHeight} Z`;

    let targetY = -1;
    if (targetWeight) {
       targetY = chartHeight - ((targetWeight - minWeight) / range) * chartHeight;
    }

    return (
      <View className="bg-white dark:bg-[#151515] p-4 rounded-3xl border border-gray-200 dark:border-white/10 shadow-sm relative h-[220px] shadow-[0_4px_20px_rgba(0,0,0,0.05)]">
        <View className="flex-row justify-between items-center mb-4">
           <Text className="text-gray-500 dark:text-gray-400 text-[10px] font-bold uppercase" style={{ fontFamily: 'Poppins_700Bold' }}>Évolution</Text>
           <View className="flex-row items-end">
             <Text className="text-black dark:text-white text-xl font-bold" style={{ fontFamily: 'Poppins_700Bold' }}>{currentWeight || '--'}</Text>
             <Text className="text-gray-400 font-bold ml-1 text-xs mb-1">kg</Text>
           </View>
        </View>

        <Svg width={chartWidth} height={chartHeight} style={{ overflow: 'visible' }}>
          <Defs>
            <LinearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor="#39FF14" stopOpacity="0.3" />
              <Stop offset="1" stopColor="#39FF14" stopOpacity="0" />
            </LinearGradient>
          </Defs>

          {/* Target Line */}
          {targetY >= 0 && targetY <= chartHeight && (
            <>
              <SvgLine x1="0" y1={targetY} x2={chartWidth} y2={targetY} stroke={isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)'} strokeWidth="1" strokeDasharray="4 4" />
              <Text style={{ position: 'absolute', right: 0, top: targetY - 15, color: isDark ? '#9CA3AF' : '#6B7280', fontSize: 9, fontWeight: 'bold' }}>
                Objectif
              </Text>
            </>
          )}

          {/* Area under the line */}
          <Path d={areaData} fill="url(#gradient)" />

          {/* Main Line */}
          <Path d={pathData} fill="none" stroke="#39FF14" strokeWidth="3" />

          {/* Data Points */}
          {points.map((p, i) => {
            const [x, y] = p.split(',');
            return (
              <Circle key={i} cx={x} cy={y} r="4" fill="#151515" stroke="#39FF14" strokeWidth="2" />
            );
          })}
        </Svg>

        <View className="flex-row justify-between mt-2">
           <Text className="text-gray-400 text-[8px]">{new Date(weightLogs[0].log_date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}</Text>
           <Text className="text-gray-400 text-[8px]">{new Date(weightLogs[weightLogs.length-1].log_date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}</Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View className="flex-1 bg-[#FAFAFA] dark:bg-[#0A0A0A] justify-center items-center">
        <ActivityIndicator size="large" color="#39FF14" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <SafeAreaView className="flex-1 bg-[#FAFAFA] dark:bg-[#0A0A0A] relative" edges={['top']}>
        {showConfetti && (
          <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 100 }} pointerEvents="none">
             <ConfettiCannon count={100} origin={{x: width/2, y: -20}} fallSpeed={2500} fadeOut />
             {successMessage ? (
                <View className="absolute top-1/4 left-5 right-5 bg-black/80 p-6 rounded-3xl items-center shadow-lg border border-[#39FF14]/30">
                   <Text className="text-[#39FF14] text-2xl font-bold text-center" style={{ fontFamily: 'Poppins_700Bold' }}>{successMessage}</Text>
                </View>
             ) : null}
          </View>
        )}

        {/* HEADER VERT FIXE EN ARRIÈRE-PLAN */}
        <View className="absolute top-0 left-0 right-0 h-[280px] bg-[#39FF14] z-0 pt-12 px-5">
          <View className="flex-row items-center justify-between">
            <TouchableOpacity onPress={() => router.back()} className="p-2 bg-black/10 rounded-full">
              <ArrowLeft size={20} color="#000" />
            </TouchableOpacity>
            <Text className="text-black font-bold text-lg" style={{ fontFamily: 'Poppins_700Bold' }}>
              Suivi de Poids
            </Text>
            <View className="w-10" />
          </View>
        </View>

        <ScrollView
          className="flex-1 z-10 mt-[100px] bg-[#FAFAFA] dark:bg-[#0A0A0A]"
          style={{ borderTopLeftRadius: 32, borderTopRightRadius: 32 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View className="p-5">

            {/* Main Stats Row - Target BMI */}
            <View className="flex-row space-x-3 mb-6">
              <View className="flex-1 bg-white dark:bg-[#151515] p-5 rounded-3xl border border-gray-200 dark:border-white/10 shadow-sm relative overflow-hidden">
                 <View className="absolute -right-6 -top-6 w-20 h-20 bg-blue-500/10 rounded-full blur-xl" />
                 <View className="flex-row justify-between items-start mb-1">
                   <Text className="text-gray-500 dark:text-gray-400 text-[10px] font-bold uppercase" style={{ fontFamily: 'Poppins_700Bold' }}>OBJECTIF</Text>
                   <Target size={14} color={isDark ? '#9CA3AF' : '#6B7280'} />
                 </View>
                 <View className="flex-row items-end">
                   <Text className="text-black dark:text-white text-3xl font-bold" style={{ fontFamily: 'Poppins_700Bold' }}>
                     {targetWeight || '--'}
                   </Text>
                   <Text className="text-gray-400 font-bold mb-1 ml-1">kg</Text>
                 </View>
              </View>

              {bmi ? (
                <View className="flex-1 bg-white dark:bg-[#151515] p-5 rounded-3xl border border-gray-200 dark:border-white/10 shadow-sm relative overflow-hidden justify-between">
                  <View>
                    <Text className="text-gray-500 dark:text-gray-400 text-[10px] font-bold uppercase mb-1" style={{ fontFamily: 'Poppins_700Bold' }}>IMC</Text>
                    <Text className="text-black dark:text-white text-2xl font-bold" style={{ fontFamily: 'Poppins_700Bold' }}>{bmi}</Text>
                  </View>
                  <View className="px-3 py-1.5 rounded-full self-start" style={{ backgroundColor: bmiStatus?.color + '20' }}>
                    <Text style={{ color: bmiStatus?.color, fontFamily: 'Poppins_700Bold', fontSize: 10, textTransform: 'uppercase' }}>
                      {bmiStatus?.label}
                    </Text>
                  </View>
                </View>
              ) : (
                <View className="flex-1 bg-white dark:bg-[#151515] p-5 rounded-3xl border border-gray-200 dark:border-white/10 shadow-sm" />
              )}
            </View>

            {/* Chart */}
            {renderChart()}

          {/* History Section */}
          {weightLogs.length > 0 && (
            <View className="mt-8 bg-white dark:bg-[#151515] p-5 rounded-3xl border border-gray-200 dark:border-white/10 shadow-sm">
               <Text className="text-black dark:text-white font-bold mb-4" style={{ fontFamily: 'Poppins_700Bold' }}>Historique</Text>
               {[...weightLogs].reverse().map((log, index, arr) => {
                 const prevLog = arr[index + 1]; // Previous chronologically is next in reversed array
                 let diff = 0;
                 let diffText = "";
                 let colorClass = "text-gray-400";

                 if (prevLog) {
                   diff = log.weight - prevLog.weight;
                   if (diff > 0) {
                     diffText = `+${diff.toFixed(1)} kg`;
                     colorClass = "text-red-500";
                   } else if (diff < 0) {
                     diffText = `${diff.toFixed(1)} kg`;
                     colorClass = "text-green-500";
                   } else {
                     diffText = "=";
                     colorClass = "text-gray-400";
                   }
                 }

                 return (
                   <View key={log.log_date} className="flex-row justify-between items-center py-3 border-b border-gray-100 dark:border-white/5 last:border-0">
                     <Text className="text-black dark:text-white text-sm" style={{ fontFamily: 'Poppins_400Regular' }}>
                       {new Date(log.log_date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
                     </Text>
                     <View className="flex-row items-center">
                       <Text className="text-black dark:text-white font-bold mr-3" style={{ fontFamily: 'Poppins_700Bold' }}>
                         {log.weight.toFixed(1)} kg
                       </Text>
                       {prevLog && (
                         <Text className={`text-xs font-bold w-12 text-right ${colorClass}`} style={{ fontFamily: 'Poppins_700Bold' }}>
                           {diffText}
                         </Text>
                       )}
                     </View>
                   </View>
                 );
               })}
            </View>
          )}

            {/* La Carte Superaliment (Dynamique) */}
            <View className="mt-6 bg-white dark:bg-[#151515] p-5 rounded-3xl border border-[#39FF14]/50 shadow-[0_0_15px_rgba(57,255,20,0.1)] flex-row items-center justify-between">
              <View className="flex-1 mr-4">
                <Text className="text-black dark:text-white font-bold text-lg mb-1" style={{ fontFamily: 'Poppins_700Bold' }}>
                  {randomSuperfood.title}
                </Text>
                <Text className="text-gray-500 dark:text-gray-400 text-xs" style={{ fontFamily: 'Poppins_400Regular' }}>
                  {randomSuperfood.description}
                </Text>
              </View>
              <TouchableOpacity
                className="bg-[#39FF14] px-4 py-2 rounded-full"
                onPress={() => router.push(`/product/${randomSuperfood.productId}` as any)}
              >
                <Text className="text-black text-xs font-bold" style={{ fontFamily: 'Poppins_700Bold' }}>
                  Découvrir
                </Text>
              </TouchableOpacity>
            </View>

            {/* Input Section - Saisie & Ruban Interactif */}
            <View className="mt-8 bg-white dark:bg-[#151515] p-5 rounded-3xl border border-gray-200 dark:border-white/10 shadow-sm mb-10">
               <Text className="text-black dark:text-white font-bold mb-4" style={{ fontFamily: 'Poppins_700Bold' }}>Nouvelle Pesée</Text>

               {/* L'Input Natif Verrouillé (N'accepte que des chiffres/points) */}
               <View className="flex-row items-center space-x-3 mb-6">
                 <View className="flex-1 bg-gray-50 dark:bg-[#0A0A0A] rounded-2xl border border-gray-200 dark:border-white/10 px-4 h-16 flex-row items-center justify-center">
                   <TextInput
                     className="flex-1 text-center text-black dark:text-white text-3xl font-bold"
                     keyboardType="decimal-pad"
                     inputMode="decimal"
                     value={newWeight}
                     onChangeText={(text) => {
                       const sanitizedText = text.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1');
                       setNewWeight(sanitizedText);
                     }}
                     placeholder="0.0"
                     placeholderTextColor="#999"
                     style={{ fontFamily: 'Poppins_700Bold' }}
                   />
                   <Text className="text-gray-400 font-bold ml-2">kg</Text>
                 </View>

                 {/* Grand bouton + vert pour sauvegarder */}
                 <TouchableOpacity
                   onPress={handleSaveWeight}
                   disabled={!newWeight.trim() || saving}
                   className={`w-16 h-16 rounded-2xl items-center justify-center ${newWeight.trim() ? 'bg-[#39FF14] shadow-[0_0_15px_rgba(57,255,20,0.3)]' : 'bg-gray-200 dark:bg-gray-800'}`}
                 >
                   {saving ? (
                     <ActivityIndicator size="small" color="#000" />
                   ) : (
                     <Text className="text-black text-3xl font-bold" style={{ marginTop: -4 }}>+</Text>
                   )}
                 </TouchableOpacity>
               </View>

               {/* Le Ruban Interactif (Boutons Rapides) */}
               <ScrollView
                 horizontal
                 showsHorizontalScrollIndicator={false}
                 className="flex-row"
                 contentContainerStyle={{ paddingRight: 20 }}
               >
                 {[
                   { label: '-1 kg', value: -1 },
                   { label: '-0.5 kg', value: -0.5 },
                   { label: '+0.5 kg', value: 0.5 },
                   { label: '+1 kg', value: 1 }
                 ].map((btn, idx) => (
                   <TouchableOpacity
                     key={idx}
                     onPress={() => handleQuickAdjust(btn.value)}
                     className="bg-gray-100 dark:bg-white/5 px-4 py-2 rounded-full mr-3 border border-gray-200 dark:border-white/10 active:bg-[#39FF14]/20"
                   >
                     <Text className="text-black dark:text-white font-bold text-sm" style={{ fontFamily: 'Poppins_700Bold' }}>
                       {btn.label}
                     </Text>
                   </TouchableOpacity>
                 ))}
               </ScrollView>
            </View>

            <View className="h-10" />
          </View>
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}