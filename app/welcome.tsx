import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <View className="flex-1 bg-black">
      {/* Top 60% Image */}
      <View className="h-[60%] w-full">
        <Image
          source={{ uri: 'https://res.cloudinary.com/dtr2wtoty/image/upload/v1783285387/Young_woman_with_braids_2K_202607052028_ht2jn7.jpg' }}
          className="flex-1"
          resizeMode="cover"
        />
      </View>

      {/* Bottom 40% White Panel */}
      <View className="h-[40%] bg-white w-full rounded-t-[3rem] -mt-10 px-8 pt-10 pb-8 flex justify-between absolute bottom-0">
        <View>
          <Text className="text-3xl font-black text-black leading-tight text-center">
            Ton <Text className="text-neon">rééquilibrage</Text>{"\n"}commence ici.
          </Text>
        </View>

        <View className="space-y-4 pb-6">
          <TouchableOpacity
            className="bg-neon rounded-2xl py-4 items-center mb-4"
            onPress={() => {
              // Future: Open Diagnostic Flow
              console.log('Open diagnostic flow');
            }}
          >
            <Text className="text-black font-black uppercase text-lg tracking-widest">S&apos;inscrire</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="rounded-2xl py-4 items-center border border-gray-200"
            onPress={() => router.push('/login')}
          >
            <Text className="text-black font-bold uppercase text-lg tracking-widest">Se connecter</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}