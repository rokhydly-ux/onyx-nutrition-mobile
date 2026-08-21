import React from 'react';
import { View, Text, Modal, TouchableOpacity } from 'react-native';
import { Trophy, CheckCircle } from 'lucide-react-native';

export default function DailyReportModal({
  visible,
  onClose,
  meals = [],
  onLogMeal,
  onValidate
}: any) {
  const allMealsLogged = meals.length > 0 && meals.every((m: any) => m.logged);

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View className="flex-1 bg-black/90 p-4 pt-12 justify-center items-center">
        <View className="bg-zinc-900 w-full rounded-[2rem] p-6 items-center shadow-lg border border-zinc-800">
           <Trophy size={48} color="#39FF14" className="mb-4" />
           <Text className="text-white text-2xl font-black mb-2 text-center" style={{ fontFamily: 'Poppins_900Black' }}>BILAN DU JOUR</Text>
           <Text className="text-gray-400 text-center mb-6 text-sm" style={{ fontFamily: 'Poppins_400Regular' }}>Confirmez vos repas de la journée pour gagner vos XP !</Text>

           <View className="w-full mb-6">
              {meals.map((m: any, idx: number) => (
                <TouchableOpacity
                  key={idx}
                  className="flex-row items-center justify-between bg-zinc-800 p-4 rounded-xl mb-3 border border-zinc-700"
                  onPress={() => !m.logged && onLogMeal && onLogMeal(m)}
                >
                  <Text className="text-white font-bold" style={{ fontFamily: 'Poppins_700Bold' }}>{m.type}</Text>
                  <View className={`w-6 h-6 rounded-full border-2 items-center justify-center ${m.logged ? 'border-[#39FF14] bg-[#39FF14]/20' : 'border-gray-500'}`}>
                    {m.logged && <CheckCircle size={14} color="#39FF14" />}
                  </View>
                </TouchableOpacity>
              ))}
           </View>

           <TouchableOpacity
              disabled={!allMealsLogged}
              onPress={() => {
                onClose();
                if (onValidate) onValidate();
              }}
              className={`w-full py-4 rounded-2xl items-center ${allMealsLogged ? 'bg-[#39FF14]' : 'bg-gray-600'}`}>
             <Text className={`font-black text-lg ${allMealsLogged ? 'text-black' : 'text-gray-400'}`} style={{ fontFamily: 'Poppins_900Black' }}>VALIDER MON BILAN</Text>
           </TouchableOpacity>

           <TouchableOpacity className="mt-4" onPress={onClose}>
             <Text className="text-gray-400 font-bold">Plus tard</Text>
           </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
