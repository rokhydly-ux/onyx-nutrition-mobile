import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Dimensions, FlatList, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { BlurView } from 'expo-blur';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');

const SLIDES = [
  {
    id: '1',
    image: 'https://res.cloudinary.com/dtr2wtoty/image/upload/v1783280897/weight_gfpje9.jpg',
    title: <Text>Ton rééquilibrage à l&apos;africaine commence ici.</Text>,
  },
  {
    id: '2',
    image: 'https://res.cloudinary.com/dtr2wtoty/image/upload/v1783280897/weight_gfpje9.jpg',
    title: <Text>Des super-aliments 100% naturels pour propulser tes résultats.</Text>,
  },
  {
    id: '3',
    image: 'https://images.unsplash.com/photo-1547592180-85f173990554?q=80&w=1000&auto=format&fit=crop',
    title: <Text>Zéro frustration. Savoure le Yassa et le Thiébou Dieune sans culpabiliser.</Text>,
  }
];

export default function WelcomeScreen() {
  const router = useRouter();
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  // Auto-scroll logic
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((prevIndex) => {
        const nextIndex = (prevIndex + 1) % SLIDES.length;
        if (flatListRef.current) {
          flatListRef.current.scrollToIndex({
            index: nextIndex,
            animated: true,
          });
        }
        return nextIndex;
      });
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setActiveIndex(viewableItems[0].index || 0);
    }
  }).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  return (
    <View className="flex-1 bg-black">
      {/* Background Carousel */}
      <View className="absolute inset-0">
        <FlatList
          ref={flatListRef}
          data={SLIDES}
          keyExtractor={(item) => item.id}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          onScrollToIndexFailed={(info) => {
            const wait = new Promise(resolve => setTimeout(resolve, 500));
            wait.then(() => {
              if (flatListRef.current) {
                flatListRef.current.scrollToIndex({ index: info.index, animated: true });
              }
            });
          }}
          renderItem={({ item }) => (
            <View style={{ width, height }}>
              <Image
                source={{ uri: item.image }}
                style={{ width: '100%', height: '100%' }}
                resizeMode="cover"
              />
              <View className="absolute inset-0 bg-black/50" />
            </View>
          )}
        />
      </View>

      <SafeAreaView className="flex-1 justify-end p-6" edges={['top', 'bottom']}>
        {/* Pagination Dots */}
        <View className="flex-row justify-center mb-8">
          {SLIDES.map((_, index) => (
            <View
              key={index}
              className={`h-2 rounded-full mx-1 transition-all duration-300 ${
                activeIndex === index ? 'w-6 bg-[#39FF14]' : 'w-2 bg-white/50'
              }`}
            />
          ))}
        </View>

        {/* Content & Actions */}
        <BlurView intensity={30} tint="dark" className="p-6 rounded-[2rem] overflow-hidden border border-white/10 mb-4">

          {/* Dynamic Text */}
          <View className="h-32 justify-center mb-4">
             <Text className="text-white text-3xl font-bold text-center leading-tight" style={{ fontFamily: 'Poppins_700Bold' }}>
               {SLIDES[activeIndex].id === '1' ? (
                 <Text>Ton rééquilibrage <Text className="text-[#39FF14]">à l&apos;africaine</Text> commence ici.</Text>
               ) : (
                 SLIDES[activeIndex].title
               )}
             </Text>
          </View>

          <TouchableOpacity
            className="bg-[#39FF14] w-full py-4 rounded-full items-center mb-4 shadow-[0_0_15px_rgba(57,255,20,0.4)]"
            onPress={() => {}} // Hook to Signup
          >
            <Text className="text-black font-bold text-lg uppercase" style={{ fontFamily: 'Poppins_700Bold' }}>S&apos;INSCRIRE</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="w-full py-4 rounded-full items-center border border-white/30 bg-white/5"
            onPress={() => router.push('/login')}
          >
            <Text className="text-white font-bold text-lg uppercase" style={{ fontFamily: 'Poppins_700Bold' }}>SE CONNECTER</Text>
          </TouchableOpacity>
        </BlurView>
        <Text className="text-center text-gray-400 text-xs mb-2">nutriafro.app</Text>
      </SafeAreaView>
    </View>
  );
}
