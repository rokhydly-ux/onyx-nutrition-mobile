import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HistoryScreen() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-zinc-950">
      <View className="flex-row items-center px-4 py-4 border-b border-gray-100 dark:border-zinc-800">
        <TouchableOpacity onPress={() => router.back()} className="mr-4">
          <Text className="text-xl dark:text-white">←</Text>
        </TouchableOpacity>
        <Text className="text-xl font-bold dark:text-white" style={{ fontFamily: 'Poppins_700Bold' }}>Mon Historique</Text>
      </View>
      <ScrollView className="flex-1 px-4 pt-6">
        <Text className="text-gray-500 text-center mt-10">L'historique complet arrive bientôt !</Text>
      </ScrollView>
    </SafeAreaView>
  );
}