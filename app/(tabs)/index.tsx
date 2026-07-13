import { View, Text, ScrollView, TouchableOpacity, Image } from 'react-native';
import { BlurView } from 'expo-blur';
import { Flame, Droplets, Target, ArrowRight } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

export default function HomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-black" edges={['top']}>
      <ScrollView className="flex-1 px-6 pt-4" showsVerticalScrollIndicator={false}>
        {/* Header Section */}
        <View className="flex-row justify-between items-center mb-8">
          <View>
            <Text className="text-gray-400 text-sm mb-1 uppercase tracking-wider">Bon retour,</Text>
            <Text className="text-white text-3xl font-bold">Client</Text>
          </View>
          <View className="w-12 h-12 rounded-full overflow-hidden border border-[#39FF14]/30">
            <Image
              source={{ uri: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop' }}
              className="w-full h-full"
            />
          </View>
        </View>

        {/* Daily Summary Glass Card */}
        <View className="rounded-[2rem] overflow-hidden mb-8 border border-white/10">
          <BlurView intensity={20} tint="dark" className="p-6">
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-white text-xl font-bold">Aperçu du jour</Text>
              <Text className="text-[#39FF14] text-sm font-semibold">Détails</Text>
            </View>

            <View className="flex-row justify-between">
              {/* Calories */}
              <View className="items-center">
                <View className="w-12 h-12 rounded-full bg-white/5 items-center justify-center mb-2">
                  <Flame size={24} color="#39FF14" />
                </View>
                <Text className="text-white font-bold text-lg">1,850</Text>
                <Text className="text-gray-400 text-xs">kcal</Text>
              </View>

              {/* Water */}
              <View className="items-center">
                <View className="w-12 h-12 rounded-full bg-white/5 items-center justify-center mb-2">
                  <Droplets size={24} color="#39FF14" />
                </View>
                <Text className="text-white font-bold text-lg">1.5</Text>
                <Text className="text-gray-400 text-xs">Litres</Text>
              </View>

              {/* Protein */}
              <View className="items-center">
                <View className="w-12 h-12 rounded-full bg-white/5 items-center justify-center mb-2">
                  <Target size={24} color="#39FF14" />
                </View>
                <Text className="text-white font-bold text-lg">110</Text>
                <Text className="text-gray-400 text-xs">Protéines (g)</Text>
              </View>
            </View>
          </BlurView>
        </View>

        {/* Action Cards */}
        <View className="flex-row justify-between mb-6">
          <TouchableOpacity
            className="flex-1 bg-white/5 rounded-[2rem] p-5 mr-3 border border-white/5"
            onPress={() => {}} // Hook up to Mon Jour later
          >
            <View className="w-10 h-10 rounded-full bg-[#39FF14]/20 items-center justify-center mb-4">
              <Target size={20} color="#39FF14" />
            </View>
            <Text className="text-white font-bold text-lg mb-1">Mon Jour</Text>
            <Text className="text-gray-400 text-xs">Tracker tes repas</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="flex-1 bg-white/5 rounded-[2rem] p-5 ml-3 border border-white/5"
            onPress={() => {}} // Hook up to Diagnostic later
          >
            <View className="w-10 h-10 rounded-full bg-white/10 items-center justify-center mb-4">
              <Flame size={20} color="white" />
            </View>
            <Text className="text-white font-bold text-lg mb-1">Diagnostic</Text>
            <Text className="text-gray-400 text-xs">Bilan complet</Text>
          </TouchableOpacity>
        </View>

        {/* Sama Menu Banner */}
        <TouchableOpacity
          className="rounded-[2rem] overflow-hidden mb-24 border border-[#39FF14]/30"
          onPress={() => router.push('/(tabs)/menu')}
        >
          <BlurView intensity={30} tint="dark" className="p-6 flex-row items-center justify-between">
            <View className="flex-1">
              <Text className="text-[#39FF14] text-sm font-bold tracking-widest uppercase mb-1">Sama Menu</Text>
              <Text className="text-white font-bold text-xl">Plan Nutritionnel</Text>
              <Text className="text-gray-400 text-xs mt-2">Découvre tes repas adaptés d'aujourd'hui</Text>
            </View>
            <View className="w-12 h-12 rounded-full bg-[#39FF14] items-center justify-center ml-4">
              <ArrowRight size={24} color="black" />
            </View>
          </BlurView>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
