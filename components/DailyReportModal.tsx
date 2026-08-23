import React, { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { Trophy, Check, X } from 'lucide-react-native';

export default function DailyReportModal({
  visible,
  onClose,
  onValidate,
  isSubmittingReport = false
}: any) {
  const [reportData, setReportData] = useState({
    followedMenu: false,
    drankWater: false,
    cravedRice: false
  });

  React.useEffect(() => {
    if (visible) {
      setReportData({
        followedMenu: false,
        drankWater: false,
        cravedRice: false
      });
    }
  }, [visible]);

  const toggleOption = (key: keyof typeof reportData) => {
    setReportData(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const canValidate = reportData.followedMenu || reportData.drankWater || reportData.cravedRice;

  const options = [
    { key: 'followedMenu', label: "J'AI RESPECTÉ 80% DU MENU" },
    { key: 'drankWater', label: "J'AI BU MON OBJECTIF D'EAU" },
    { key: 'cravedRice', label: "J'AI FAIT UN ÉCART DE SUCRE" }
  ] as const;

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View className="flex-1 bg-black/90 p-4 pt-12 justify-center items-center relative z-[600]">

        {/* Close button top right */}
        <TouchableOpacity
          onPress={onClose}
          className="absolute top-12 right-6 p-2 bg-zinc-800 rounded-full z-50"
        >
          <X size={24} color="#FFF" />
        </TouchableOpacity>

        <View
          className="bg-white p-6 sm:p-8 rounded-[2rem] max-w-md w-full relative border-t-[8px] border-[#39FF14] max-h-[90vh] flex flex-col overflow-hidden"
          style={{
            shadowColor: '#39FF14',
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.3,
            shadowRadius: 50,
            elevation: 20
          }}
        >
          {/* Header */}
          <View className="w-16 h-16 bg-[#39FF14]/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Trophy size={32} color="#39FF14" />
          </View>
          <Text className="font-black text-2xl uppercase text-black text-center" style={{ fontFamily: 'Poppins_900Black', letterSpacing: -0.5 }}>Bilan du Jour</Text>
          <Text className="text-xs font-bold text-zinc-500 mt-2 text-center" style={{ fontFamily: 'Poppins_700Bold' }}>Cochez les affirmations vraies pour clôturer votre journée.</Text>

          {/* Options */}
          <ScrollView className="mt-6 mb-2 flex-1" showsVerticalScrollIndicator={false}>
            {options.map((opt) => {
              const isChecked = reportData[opt.key];
              return (
                <TouchableOpacity
                  key={opt.key}
                  onPress={() => toggleOption(opt.key)}
                  activeOpacity={0.7}
                  className={`flex-row items-center p-4 rounded-2xl border-2 mb-3 ${isChecked ? 'bg-zinc-50 border-black' : 'bg-white border-zinc-200'}`}
                >
                  <View className={`w-6 h-6 rounded-md flex items-center justify-center border-2 mr-4 ${isChecked ? 'bg-[#39FF14] border-[#39FF14]' : 'bg-white border-zinc-300'}`}>
                    {isChecked && <Check size={14} color="black" strokeWidth={3} />}
                  </View>
                  <Text className="font-bold text-black text-xs flex-1" style={{ fontFamily: 'Poppins_700Bold' }}>{opt.label}</Text>
                </TouchableOpacity>
              )
            })}
          </ScrollView>

          {/* Footer */}
          <View className="mt-4 pt-4 border-t border-zinc-100">
            <TouchableOpacity
              onPress={() => onValidate && onValidate(reportData)}
              disabled={isSubmittingReport || !canValidate}
              className={`w-full py-4 rounded-2xl flex-row items-center justify-center shadow-xl ${canValidate ? 'bg-black' : 'bg-zinc-600'}`}
            >
              {isSubmittingReport ? (
                <ActivityIndicator color="#39FF14" />
              ) : (
                <Text className={`font-black uppercase text-xs tracking-widest ${canValidate ? 'text-[#39FF14]' : 'text-zinc-400'}`} style={{ fontFamily: 'Poppins_900Black' }}>VALIDER MON BILAN</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
