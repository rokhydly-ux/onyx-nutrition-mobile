import { View, Text, TouchableOpacity, Image, Dimensions, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { BlurView } from 'expo-blur';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';

const { width } = Dimensions.get('window');

const SLIDES = [
  {
    id: 1,
    image: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?q=80&w=1000&auto=format&fit=crop',
    title: 'Perte de poids, santé ou prise de masse.',
    subtitle: "Atteins ton objectif sans 'lekk niakh' et en savourant nos plats locaux."
  },
  {
    id: 2,
    image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=1000&auto=format&fit=crop',
    title: 'Des recettes 100% locales.',
    subtitle: "Redécouvrez le Yassa, le Thiéboudienne et bien d'autres, adaptés à vos besoins."
  },
  {
    id: 3,
    image: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?q=80&w=1000&auto=format&fit=crop',
    title: 'Un accompagnement personnalisé.',
    subtitle: "Notre équipe vous guide pas à pas vers votre réussite."
  }
];

export default function WelcomeScreen() {
  const router = useRouter();
  const [activeIndex, setActiveIndex] = useState(0);

  const onScroll = (event: any) => {
    const slideSize = event.nativeEvent.layoutMeasurement.width;
    const index = event.nativeEvent.contentOffset.x / slideSize;
    setActiveIndex(Math.round(index));
  };

  return (
    <View className="flex-1 bg-black">
      {/* Auto-playing Carousel */}
      <View className="absolute inset-0">
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={onScroll}
          scrollEventThrottle={16}
          className="flex-1"
        >
          {SLIDES.map((slide, index) => (
            <View key={slide.id} style={{ width }} className="h-full">
              <Image
                source={{ uri: slide.image }}
                className="w-full h-full"
                resizeMode="cover"
              />
              <View className="absolute inset-0 bg-black/40" />
            </View>
          ))}
        </ScrollView>
      </View>

      <SafeAreaView className="flex-1 justify-between p-6" edges={['top', 'bottom']}>
        {/* Pagination Dots */}
        <View className="flex-row justify-center mt-4">
          {SLIDES.map((_, index) => (
            <View
              key={index}
              className={`h-2 rounded-full mx-1 ${
                activeIndex === index ? 'w-6 bg-[#39FF14]' : 'w-2 bg-white/50'
              }`}
            />
          ))}
        </View>

        {/* Content & Actions */}
        <View className="mb-6">
          <BlurView intensity={40} tint="dark" className="p-6 rounded-[2rem] overflow-hidden border border-white/20">
            <Text className="text-white text-3xl font-bold text-center mb-4" style={{ fontFamily: 'Poppins_700Bold' }}>
              {SLIDES[activeIndex].title}
            </Text>
            <Text className="text-gray-300 text-center mb-8" style={{ fontFamily: 'Poppins_400Regular' }}>
              {SLIDES[activeIndex].subtitle}
            </Text>

            <TouchableOpacity
              className="bg-[#39FF14] w-full py-4 rounded-full items-center mb-4"
              onPress={() => {}} // Navigation to diagnostic
            >
              <Text className="text-black font-bold text-lg" style={{ fontFamily: 'Poppins_700Bold' }}>DIAGNOSTIC GRATUIT</Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="border-2 border-white w-full py-4 rounded-full items-center"
              onPress={() => router.push('/login')}
            >
              <Text className="text-white font-bold text-lg" style={{ fontFamily: 'Poppins_700Bold' }}>SE CONNECTER</Text>
            </TouchableOpacity>
          </BlurView>
        </View>
      </SafeAreaView>
    </View>
  );
}
