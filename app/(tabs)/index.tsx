import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColorScheme } from 'nativewind';
import { supabase } from '../../lib/supabase';
import {
  Droplets,
  MoreHorizontal,
  Heart,
  ArrowUpRight,
  Coffee,
} from 'lucide-react-native';
import CircularProgress from '../../components/CircularProgress';

// --- Types ---
type DailyLog = {
  id: string;
  meal_type: string;
  name: string;
  time: string;
  calories: number;
};

type CommunityPost = {
  id: string;
  author_name: string;
  author_avatar: string;
  content: string;
  likes: number;
  comments: number;
};

type UserProfile = {
  first_name: string;
  xp: number;
  subscription_days_left: number;
  weight: number | null;
  calories_goal: number;
  protein_goal: number;
  carbs_goal: number;
  fats_goal: number;
};

type DailyStats = {
  steps: number;
  sleep_hours: number;
  water_glasses: number;
  calories_consumed: number;
  protein_consumed: number;
  carbs_consumed: number;
  fats_consumed: number;
};

// --- Dummy components / Icons for visual match ---
const WeightIcon = ({ color }: { color: string }) => (
  <View className={`w-6 h-6 rounded-md items-center justify-center bg-gray-100 dark:bg-white/10`}>
    <Text style={{ color, fontSize: 10, fontWeight: 'bold' }}>KG</Text>
  </View>
);

const ActivityIcon = ({ color }: { color: string }) => (
  <View className={`w-6 h-6 rounded-md items-center justify-center bg-gray-100 dark:bg-white/10`}>
    <View className="flex-row items-end h-3 space-x-[2px]">
      <View style={{ backgroundColor: color }} className="w-[3px] h-[6px] rounded-t-sm" />
      <View style={{ backgroundColor: color }} className="w-[3px] h-[10px] rounded-t-sm" />
      <View style={{ backgroundColor: color }} className="w-[3px] h-[8px] rounded-t-sm" />
    </View>
  </View>
);

const SleepIcon = ({ color }: { color: string }) => (
  <View className={`w-6 h-6 rounded-md items-center justify-center bg-gray-100 dark:bg-white/10`}>
    <Text style={{ color, fontSize: 12 }}>🌙</Text>
  </View>
);

const HydrationIcon = ({ color }: { color: string }) => (
  <View className={`w-6 h-6 rounded-md items-center justify-center bg-gray-100 dark:bg-white/10`}>
    <Droplets size={12} color={color} />
  </View>
);

const ProgressBar = ({ label, current, max, color }: { label: string, current: number, max: number, color: string }) => {
  const percentage = max > 0 ? Math.min((current / max) * 100, 100) : 0;
  return (
    <View className="mb-3">
      <View className="flex-row justify-between mb-1">
        <Text className="text-gray-800 dark:text-gray-200 text-xs font-medium" style={{ fontFamily: 'Poppins_500Medium' }}>{label}</Text>
        <Text className="text-gray-500 dark:text-gray-400 text-xs" style={{ fontFamily: 'Poppins_400Regular' }}>{Math.round(current)}/{Math.round(max)}g</Text>
      </View>
      <View className="h-2 w-full bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden">
        <View style={{ width: `${percentage}%`, backgroundColor: color }} className="h-full rounded-full" />
      </View>
    </View>
  );
};

export default function HomeScreen() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [isLoading, setIsLoading] = useState(true);

  const [profile, setProfile] = useState<UserProfile>({
    first_name: 'UTILISATEUR', // This should be replaced, fallback only if completely failed.
    xp: 0,
    subscription_days_left: 0,
    weight: null,
    calories_goal: 2000,
    protein_goal: 90,
    carbs_goal: 150,
    fats_goal: 50
  });

  const [dailyStats, setDailyStats] = useState<DailyStats>({
    steps: 0,
    sleep_hours: 0,
    water_glasses: 0,
    calories_consumed: 0,
    protein_consumed: 0,
    carbs_consumed: 0,
    fats_consumed: 0
  });

  const [meals, setMeals] = useState<DailyLog[]>([]);
  const [posts, setPosts] = useState<CommunityPost[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError) {
         console.error("Erreur lors de la récupération de la session :", sessionError);
      }

      if (session && session.user) {
        const userId = session.user.id;
        console.log("Session active pour l'utilisateur ID :", userId);

        // 1. RÉCUPÉRATION DE L'IDENTITÉ (Table clients) avec la jointure pour nutrition_profiles
        const { data: profileData, error: profileError } = await supabase
          .from('clients')
          .select('*, nutrition_profiles(*)')
          .eq('id', userId)
          .maybeSingle();

        const { data: clientData, error: clientError } = await supabase
          .from('clients')
          .select('*')
          .eq('id', userId)
          .maybeSingle();

        if (profileError) {
           console.error("RLS Error reading nutrition_profiles :", profileError);
        } else if (profileData) {
          setProfile(prev => ({
            ...prev,
            first_name: clientData?.first_name || profileData.first_name || prev.first_name,
            xp: profileData.xp || prev.xp,
            subscription_days_left: profileData.subscription_days_left || prev.subscription_days_left,
            weight: profileData.weight || prev.weight,
            calories_goal: profileData.target_calories || profileData.calories_goal || prev.calories_goal,
            protein_goal: profileData.protein_goal || prev.protein_goal,
            carbs_goal: profileData.carbs_goal || prev.carbs_goal,
            fats_goal: profileData.fats_goal || prev.fats_goal,
          }));
        }

        // Fetch Daily Logs (Steps, Sleep, Water)
        const todayStr = new Date().toISOString().split('T')[0];
        const nextDay = new Date();
        nextDay.setDate(nextDay.getDate() + 1);
        const nextDayStr = nextDay.toISOString().split('T')[0];
        const { data: logData, error: logError } = await supabase
          .from('daily_logs')
          .select('*')
          .eq('client_id', userId)
          .gte('created_at', todayStr)
          .lt('created_at', nextDayStr)
          .maybeSingle();

        if (logError) {
           console.error("RLS Error reading daily_logs :", logError);
        } else if (logData) {
          setDailyStats(prev => ({
            ...prev,
            steps: logData.steps || 0,
            sleep_hours: logData.sleep_hours || 0,
            water_glasses: logData.water_glasses || 0,
          }));
        }

        // Fetch Meals & sum up macros
        const { data: mealData, error: mealError } = await supabase
          .from('nutrition_daily_logs')
          .select('*')
          .eq('client_id', userId)
          .order('created_at', { ascending: false })
          .limit(5);

        if (mealError) {
           console.error("RLS Error reading nutrition_daily_logs :", mealError);
        } else if (mealData) {
          setMeals(mealData as any);

          let totalCal = 0, totalP = 0, totalC = 0, totalF = 0;
          mealData.forEach((m: any) => {
            totalCal += m.calories || 0;
            totalP += m.protein || 0;
            totalC += m.carbs || 0;
            totalF += m.fats || 0;
          });

          setDailyStats(prev => ({
            ...prev,
            calories_consumed: totalCal,
            protein_consumed: totalP,
            carbs_consumed: totalC,
            fats_consumed: totalF,
          }));
        }
      } else {
        console.error("Aucune session active trouvée sur le Dashboard !");
      }

      // Fetch Community Posts
      const { data: postData, error: postError } = await supabase
        .from('community_posts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(2);

      if (postError) {
         console.error("RLS Error reading community_posts :", postError);
      } else if (postData) {
        setPosts(postData as any);
      }

    } catch (e) {
      console.error('Unexpected error fetching dashboard data:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const logoLight = "https://res.cloudinary.com/dtr2wtoty/image/upload/v1781198743/Modify_the_logo_from_the_202606111717_kftori.jpg";
  const logoDark = "https://res.cloudinary.com/dtr2wtoty/image/upload/v1781198743/Modify_the_logo_from_the_202606111719_ozvobf.jpg";

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-[#FAFAFA] dark:bg-[#0A0A0A] justify-center items-center">
        <ActivityIndicator size="large" color="#39FF14" />
      </SafeAreaView>
    );
  }

  const caloriesProgress = profile.calories_goal > 0 ? (dailyStats.calories_consumed / profile.calories_goal) : 0;

  return (
    <SafeAreaView className="flex-1 bg-[#FAFAFA] dark:bg-[#0A0A0A]" edges={['top']}>
      <ScrollView className="flex-1 px-5 pt-4 pb-32" showsVerticalScrollIndicator={false}>

        {/* Header - Logo */}
        <View className="flex-row items-center justify-between mb-6">
          <Image
            source={{ uri: isDark ? logoDark : logoLight }}
            className="w-32 h-10"
            resizeMode="contain"
          />
        </View>

        {/* User Greeting & XP */}
        <View className="flex-row justify-between items-start mb-6">
          <View>
            <Text className="text-black dark:text-white text-3xl uppercase tracking-tight" style={{ fontFamily: 'Poppins_900Black' }}>
              BONJOUR,
            </Text>
            <Text className="text-[#39FF14] text-3xl uppercase tracking-tight" style={{ fontFamily: 'Poppins_900Black' }}>
              {profile.first_name} !
            </Text>
            <Text className="text-gray-500 dark:text-gray-400 text-sm mt-1" style={{ fontFamily: 'Poppins_400Regular' }}>
              En pleine forme pour cet après-midi
            </Text>
          </View>

          <View className="items-end">
            <View className="flex-row items-center mb-1">
              <Text className="text-gray-800 dark:text-white text-xs font-bold mr-1 uppercase" style={{ fontFamily: 'Poppins_700Bold' }}>
                {profile.xp < 500 ? 'NOVICE' : 'EXPERT'}
              </Text>
              <Text className="text-gray-400 text-xs">|</Text>
              <Text className="text-[#39FF14] text-xs font-bold ml-1 uppercase" style={{ fontFamily: 'Poppins_700Bold' }}>
                {profile.xp} XP
              </Text>
            </View>
            <View className="flex-row items-center bg-white dark:bg-white/5 px-2 py-1.5 rounded-full border border-gray-200 dark:border-white/10 shadow-sm">
              <View className="w-6 h-6 rounded-full bg-[#39FF14] items-center justify-center mr-2 shadow-[0_0_10px_rgba(57,255,20,0.5)]">
                <Text className="text-black text-[10px] font-bold">XP</Text>
              </View>
              <View>
                <Text className="text-gray-400 text-[9px] uppercase tracking-wider font-bold">Abonnement</Text>
                <Text className="text-black dark:text-white text-[10px] font-bold">
                  {profile.subscription_days_left} Jours restants
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* 4 Stat Cards Row */}
        <View className="flex-row justify-between mb-6 space-x-2">
          {/* Poids */}
          <View className="flex-1 bg-white dark:bg-[#1A1A1A] p-3 rounded-2xl border border-gray-200 dark:border-white/10 shadow-sm">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-gray-500 dark:text-gray-400 text-[10px] font-bold uppercase" style={{ fontFamily: 'Poppins_700Bold' }}>POIDS</Text>
              <WeightIcon color={isDark ? '#FFF' : '#39FF14'} />
            </View>
            <View className="flex-row items-end">
              <Text className="text-black dark:text-white text-xl font-bold" style={{ fontFamily: 'Poppins_700Bold' }}>
                {profile.weight ? profile.weight : '--'}
              </Text>
              <Text className="text-gray-500 dark:text-gray-400 text-xs mb-1 ml-1">kg</Text>
            </View>
          </View>

          {/* Activity */}
          <View className="flex-1 bg-white dark:bg-[#1A1A1A] p-3 rounded-2xl border border-gray-200 dark:border-white/10 shadow-sm">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-gray-500 dark:text-gray-400 text-[10px] font-bold uppercase" style={{ fontFamily: 'Poppins_700Bold' }}>ACTIVITY</Text>
              <ActivityIcon color={isDark ? '#FFF' : '#6366F1'} />
            </View>
            <View className="flex-row items-end mb-1">
              <Text className="text-black dark:text-white text-xl font-bold" style={{ fontFamily: 'Poppins_700Bold' }}>
                {dailyStats.steps}
              </Text>
              <Text className="text-gray-500 dark:text-gray-400 text-xs mb-1 ml-1">pas</Text>
            </View>
            <View className="flex-row space-x-1 items-end h-4 mt-auto">
               <View className="w-1.5 h-full bg-[#39FF14] rounded-sm" />
               <View className="w-1.5 h-3/4 bg-[#39FF14] rounded-sm" />
               <View className="w-1.5 h-1/2 bg-[#39FF14] rounded-sm" />
               <View className="w-1.5 h-full bg-[#39FF14] rounded-sm" />
               <View className="w-1.5 h-1/4 bg-[#39FF14] rounded-sm" />
               <View className="w-1.5 h-full bg-gray-200 dark:bg-gray-700 rounded-sm" />
            </View>
          </View>

          {/* Somme */}
          <View className="flex-1 bg-white dark:bg-[#1A1A1A] p-3 rounded-2xl border border-gray-200 dark:border-white/10 shadow-sm">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-gray-500 dark:text-gray-400 text-[10px] font-bold uppercase" style={{ fontFamily: 'Poppins_700Bold' }}>SOMME</Text>
              <SleepIcon color={isDark ? '#FFF' : '#6366F1'} />
            </View>
            <Text className="text-black dark:text-white text-sm font-bold leading-tight" style={{ fontFamily: 'Poppins_700Bold' }}>
              {dailyStats.sleep_hours}h
            </Text>
            <Text className="text-gray-400 text-[10px]">Aujourd&apos;hui</Text>
          </View>

          {/* Hydration */}
          <View className="flex-1 bg-white dark:bg-[#1A1A1A] p-3 rounded-2xl border border-gray-200 dark:border-white/10 shadow-sm">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-gray-500 dark:text-gray-400 text-[10px] font-bold uppercase" style={{ fontFamily: 'Poppins_700Bold' }}>HYDRATION</Text>
              <HydrationIcon color="#3B82F6" />
            </View>
            <View className="flex-row items-end mb-2">
              <Text className="text-black dark:text-white text-lg font-bold" style={{ fontFamily: 'Poppins_700Bold' }}>
                {dailyStats.water_glasses}<Text className="text-gray-400 text-sm">/8</Text>
              </Text>
              <Text className="text-gray-500 dark:text-gray-400 text-[10px] mb-1 ml-1">glasses</Text>
            </View>
            <View className="flex-row space-x-[2px] flex-wrap mt-auto">
               {[1,2,3,4,5,6,7,8].map(i => (
                 <View key={i} className="mb-[2px]">
                   <Droplets size={10} color="#3B82F6" fill={i <= dailyStats.water_glasses ? "#3B82F6" : "transparent"} />
                 </View>
               ))}
            </View>
          </View>
        </View>

        {/* Objectif du Jour */}
        <View className="bg-white dark:bg-[#151515] rounded-3xl p-5 mb-6 border border-gray-200 dark:border-white/10 shadow-sm">
          {/* Header & Days */}
          <View className="flex-row justify-between items-center mb-6">
            <View>
              <Text className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase mb-2" style={{ fontFamily: 'Poppins_700Bold' }}>OBJECTIF DU JOUR</Text>
              <View className="flex-row space-x-1">
                {['C', 'J', 'V', 'S', 'D', 'L', 'M'].map((day, idx) => {
                  const isActive = idx < 3;
                  const isCurrent = idx === 3;
                  return (
                    <View
                      key={idx}
                      className={`w-5 h-5 rounded-full items-center justify-center ${isActive ? 'bg-[#39FF14]' : isCurrent ? 'bg-gray-200 dark:bg-gray-700' : ''}`}
                    >
                      <Text className={`text-[10px] font-bold ${isActive ? 'text-black' : isCurrent ? 'text-black dark:text-white' : 'text-gray-400'}`}>
                        {day}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>
            <TouchableOpacity className="w-8 h-8 bg-gray-100 dark:bg-white/10 rounded-full items-center justify-center">
              <ArrowUpRight size={16} color={isDark ? 'white' : 'black'} />
            </TouchableOpacity>
          </View>

          {/* Progress Section */}
          <View className="flex-row mb-6">
            <View className="mr-6 items-center justify-center relative">
              <CircularProgress
                size={100}
                strokeWidth={8}
                progress={caloriesProgress}
                color="#39FF14"
                backgroundColor={isDark ? 'rgba(255,255,255,0.1)' : '#E5E7EB'}
              >
                <View className="items-center justify-center">
                  <Text className="text-black dark:text-white text-xl font-bold" style={{ fontFamily: 'Poppins_700Bold' }}>
                    {Math.round(dailyStats.calories_consumed)}
                  </Text>
                  <Text className="text-gray-400 text-[9px] uppercase font-bold" style={{ fontFamily: 'Poppins_700Bold' }}>
                    / {profile.calories_goal} KCAL
                  </Text>
                </View>
              </CircularProgress>
            </View>

            <View className="flex-1 justify-center">
              <ProgressBar label="Protein" current={dailyStats.protein_consumed} max={profile.protein_goal} color="#3B82F6" />
              <ProgressBar label="Carbs" current={dailyStats.carbs_consumed} max={profile.carbs_goal} color="#EAB308" />
              <ProgressBar label="Fats" current={dailyStats.fats_consumed} max={profile.fats_goal} color="#EF4444" />
            </View>
          </View>

          {/* Buttons */}
          <View className="flex-row space-x-3">
            <TouchableOpacity className="flex-1 border border-gray-300 dark:border-white/20 rounded-xl py-3 flex-row items-center justify-center">
              <Coffee size={16} color={isDark ? '#A3A3A3' : '#6B7280'} />
              <Text className="text-gray-700 dark:text-gray-300 text-xs font-bold ml-2 uppercase" style={{ fontFamily: 'Poppins_700Bold' }}>LOGUER REPAS</Text>
            </TouchableOpacity>
            <TouchableOpacity className="flex-1 bg-[#39FF14] rounded-xl py-3 flex-row items-center justify-center shadow-[0_0_15px_rgba(57,255,20,0.3)]">
              <Heart size={16} color="black" />
              <Text className="text-black text-xs font-bold ml-2 uppercase" style={{ fontFamily: 'Poppins_700Bold' }}>BILAN QUOTIDIEN</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Bottom 2 Cards Grid */}
        <View className="flex-row space-x-3 mb-10">
          {/* Sama Menu du Jour */}
          <View className="flex-1 bg-white dark:bg-[#151515] rounded-3xl p-4 border border-gray-200 dark:border-white/10 shadow-sm">
            <Text className="text-gray-500 dark:text-gray-400 text-[10px] font-bold uppercase mb-4" style={{ fontFamily: 'Poppins_700Bold' }}>SAMA MENU DU JOUR</Text>

            {meals.length > 0 ? meals.map((meal) => (
               <View key={meal.id} className="flex-row items-center mb-3">
                 <View className="w-10 h-10 bg-gray-200 dark:bg-gray-800 rounded-lg mr-3 items-center justify-center">
                   <Coffee size={16} color="#A3A3A3" />
                 </View>
                 <View className="flex-1">
                   <Text className="text-gray-400 text-[9px] uppercase font-bold" style={{ fontFamily: 'Poppins_700Bold' }}>{meal.meal_type} • {meal.time}</Text>
                   <Text className="text-black dark:text-white text-xs font-bold" numberOfLines={1}>{meal.name}</Text>
                 </View>
               </View>
            )) : (
              <View className="py-4 items-center">
                <Text className="text-gray-400 text-xs text-center">Aucun repas logué aujourd&apos;hui.</Text>
              </View>
            )}
          </View>

          {/* Communauté */}
          <View className="flex-1 bg-white dark:bg-[#151515] rounded-3xl p-4 border border-gray-200 dark:border-white/10 shadow-sm">
            <Text className="text-gray-500 dark:text-gray-400 text-[10px] font-bold uppercase mb-4" style={{ fontFamily: 'Poppins_700Bold' }}>COMMUNAUTÉ</Text>

            {posts.length > 0 ? posts.map((post) => (
               <View key={post.id} className="mb-3">
                 <View className="flex-row items-center justify-between mb-2">
                    <View className="flex-row items-center">
                      <View className="w-6 h-6 bg-blue-200 rounded-full items-center justify-center mr-2 overflow-hidden">
                        {post.author_avatar ? (
                          <Image source={{uri: post.author_avatar}} className="w-full h-full" />
                        ) : (
                          <Text className="text-blue-600 text-[10px] font-bold">{post.author_name?.substring(0,2) || 'An'}</Text>
                        )}
                      </View>
                      <Text className="text-black dark:text-white text-xs font-bold" style={{ fontFamily: 'Poppins_700Bold' }}>{post.author_name}</Text>
                    </View>
                    <MoreHorizontal size={14} color={isDark ? '#A3A3A3' : '#6B7280'} />
                  </View>
                  <Text className="text-gray-600 dark:text-gray-300 text-[10px] leading-tight mb-2" numberOfLines={2} style={{ fontFamily: 'Poppins_400Regular' }}>
                    {post.content}
                  </Text>
               </View>
            )) : (
              <View className="py-4 items-center">
                <Text className="text-gray-400 text-xs text-center">Rien de nouveau dans la communauté.</Text>
              </View>
            )}
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}
