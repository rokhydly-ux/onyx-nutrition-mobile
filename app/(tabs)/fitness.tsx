import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function FitnessScreen() {
  return (
    <SafeAreaView className="flex-1 bg-[#FAFAFA] dark:bg-[#0A0A0A]">
      <ScrollView className="flex-1 p-5">
        <Text className="text-2xl font-bold text-black dark:text-white mb-4" style={{ fontFamily: 'Poppins_700Bold' }}>
          Espace Fitness
        </Text>
        <Text className="text-gray-600 dark:text-gray-400" style={{ fontFamily: 'Poppins_400Regular' }}>
          Le programme sportif sera affiché ici.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}