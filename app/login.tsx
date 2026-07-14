import { View, Text, TouchableOpacity, ImageBackground } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';
import { BlurView } from 'expo-blur';

export default function LoginScreen() {
  const router = useRouter();

  return (
    <ImageBackground
      source={{ uri: 'https://images.unsplash.com/photo-1547592180-85f173990554?q=80&w=1000&auto=format&fit=crop' }} // Placeholder gastronomic bg
      className="flex-1"
    >
      <View className="absolute inset-0 bg-black/60" /> {/* Dark Blur Overlay */}
      <SafeAreaView className="flex-1 p-6" edges={['top', 'bottom']}>

        {/* Back Button */}
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-12 h-12 rounded-full overflow-hidden mb-8"
        >
          <BlurView intensity={50} tint="dark" className="w-full h-full items-center justify-center">
            <ArrowLeft color="white" size={24} />
          </BlurView>
        </TouchableOpacity>

        {/* Content */}
        <View className="flex-1 justify-center">
          <Text className="text-white text-4xl font-bold mb-2" style={{ fontFamily: 'Poppins_700Bold' }}>Bon retour !</Text>
          <Text className="text-gray-300 text-lg mb-10" style={{ fontFamily: 'Poppins_400Regular' }}>Prêt pour ton menu du jour ?</Text>

          {/* Form Card */}
          <View className="bg-white rounded-[2rem] p-6 mb-8">
            <View className="mb-6">
              <Text className="text-gray-500 font-medium mb-2" style={{ fontFamily: 'Poppins_500Medium' }}>Numéro de téléphone</Text>
              <View className="border-b border-gray-300 pb-2">
                <Text className="text-black text-lg" style={{ fontFamily: 'Poppins_400Regular' }}>Ex: 77 123 45 67</Text>
              </View>
            </View>

            <View className="mb-6">
              <Text className="text-gray-500 font-medium mb-2" style={{ fontFamily: 'Poppins_500Medium' }}>Code PIN secret</Text>
              <View className="flex-row items-center space-x-4 border-b border-gray-300 pb-2">
                <View className="w-3 h-3 rounded-full bg-black" />
                <View className="w-3 h-3 rounded-full bg-black" />
                <View className="w-3 h-3 rounded-full bg-black" />
                <View className="w-3 h-3 rounded-full bg-black" />
              </View>
            </View>
          </View>

          <TouchableOpacity
            className="bg-[#39FF14] w-full py-4 rounded-full items-center shadow-[0_0_15px_rgba(57,255,20,0.5)]"
            onPress={() => router.push('/(tabs)')}
          >
            <Text className="text-black font-bold text-lg uppercase" style={{ fontFamily: 'Poppins_700Bold' }}>C&apos;est parti !</Text>
          </TouchableOpacity>
        </View>

      </SafeAreaView>
    </ImageBackground>
  );
}
