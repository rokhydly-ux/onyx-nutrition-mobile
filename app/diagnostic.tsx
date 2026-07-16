import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, Dimensions, ImageBackground, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Check, CheckCircle2 } from 'lucide-react-native';
import { addDays, format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { supabase } from '../lib/supabase';
import { BlurView } from 'expo-blur';

const { width } = Dimensions.get('window');

// Data Types for Diag
interface DiagData {
  gender: string;
  age: string;
  objective: string;
  height: string;
  currentWeight: string;
  targetWeight: string;
  sleep: string;
  activityLevel: string;
  health: string;
  womenCondition: string; // only if female
  hydration: string;
  pastDiets: string;
  cookingFats: string;
  mainCarb: string;
  dinnerType: string;
  lunchType: string;
  cookingFor: string;
  groceryBudget: string;
  firstName: string;
  phone: string;
}

const initialDiagData: DiagData = {
  gender: '',
  age: '',
  objective: '',
  height: '',
  currentWeight: '',
  targetWeight: '',
  sleep: '',
  activityLevel: '',
  health: '',
  womenCondition: '',
  hydration: '',
  pastDiets: '',
  cookingFats: '',
  mainCarb: '',
  dinnerType: '',
  lunchType: '',
  cookingFor: '',
  groceryBudget: '',
  firstName: '',
  phone: '',
};

const TOTAL_STEPS = 10;

export default function DiagnosticScreen() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [data, setData] = useState<DiagData>(initialDiagData);

  // Fake chat state
  const [chatMessage, setChatMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateData = (key: keyof DiagData, value: string) => {
    setData(prev => ({ ...prev, [key]: value }));
  };

  const nextStep = () => {
    if (step < TOTAL_STEPS) {
      setStep(step + 1);
    }
  };

  const prevStep = () => {
    if (step > 1) {
      setStep(step - 1);
    } else {
      router.back();
    }
  };

  const renderProgressBar = () => {
    const progress = (step / TOTAL_STEPS) * 100;
    return (
      <View className="h-1 bg-gray-800 w-full mb-4">
        <Animated.View style={{ width: `${progress}%` }} className="h-full bg-[#39FF14]" />
      </View>
    );
  };

  // --- Step Components --- //

  // Selectable Card Helper
  const SelectableCard = ({ label, value, selectedValue, onSelect, imageUri }: any) => {
    const isSelected = selectedValue === value;
    return (
      <TouchableOpacity
        onPress={() => onSelect(value)}
        className={`w-full rounded-2xl p-4 mb-4 flex-row items-center justify-between border-[3px] ${isSelected ? 'border-[#39FF14] bg-[#39FF14]/10' : 'border-gray-800 bg-gray-900'}`}
      >
        <View className="flex-row items-center flex-1">
           {imageUri && (
             <ImageBackground source={{ uri: imageUri }} className="w-16 h-16 rounded-xl overflow-hidden mr-4 bg-gray-800" />
           )}
          <Text className={`text-lg flex-1 ${isSelected ? 'text-[#39FF14] font-bold' : 'text-white'}`} style={{ fontFamily: isSelected ? 'Poppins_700Bold' : 'Poppins_500Medium' }}>
            {label}
          </Text>
        </View>
        {isSelected && <CheckCircle2 color="#39FF14" size={24} />}
      </TouchableOpacity>
    );
  };

  const Step1 = () => (
    <View className="flex-1">
      <Text className="text-white text-2xl font-bold mb-6" style={{ fontFamily: 'Poppins_700Bold' }}>Parle-nous de toi</Text>

      <SelectableCard
        label="Je suis un homme"
        value="Homme"
        selectedValue={data.gender}
        onSelect={(v: string) => updateData('gender', v)}
        imageUri="https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&q=80&w=150&h=150"
      />
      <SelectableCard
        label="Je suis une femme"
        value="Femme"
        selectedValue={data.gender}
        onSelect={(v: string) => updateData('gender', v)}
        imageUri="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150&h=150"
      />

      <View className="mt-8">
        <Text className="text-gray-400 text-lg mb-2 text-center" style={{ fontFamily: 'Poppins_500Medium' }}>Quel âge as-tu ?</Text>
        <TextInput
          value={data.age}
          onChangeText={(t) => updateData('age', t)}
          placeholder="Ex: 30"
          placeholderTextColor="#4B5563"
          keyboardType="numeric"
          className="text-white text-4xl text-center bg-gray-900 rounded-2xl py-6 font-bold border border-gray-800"
          style={{ fontFamily: 'Poppins_700Bold' }}
          maxLength={3}
        />
      </View>

      <TouchableOpacity
        className={`mt-auto mb-6 py-4 rounded-full items-center ${data.gender && data.age ? 'bg-black border-2 border-black bg-white' : 'bg-gray-800'}`}
        onPress={nextStep}
        disabled={!data.gender || !data.age}
      >
        <Text className={`font-bold text-lg uppercase ${data.gender && data.age ? 'text-[#39FF14] text-black' : 'text-gray-500'}`} style={{ fontFamily: 'Poppins_700Bold', color: data.gender && data.age ? '#39FF14' : undefined, backgroundColor: data.gender && data.age ? 'black' : undefined, width: '100%', textAlign: 'center', overflow: 'hidden', borderRadius: 999 }}>
          Continuer
        </Text>
      </TouchableOpacity>
    </View>
  );

  const Step2 = () => (
    <View className="flex-1">
      <Text className="text-white text-2xl font-bold mb-6" style={{ fontFamily: 'Poppins_700Bold' }}>Quel est ton objectif ?</Text>

      <SelectableCard label="Perdre du poids" value="Perte de poids" selectedValue={data.objective} onSelect={(v: string) => updateData('objective', v)} />
      <SelectableCard label="Garder la forme (Maintien)" value="Maintien" selectedValue={data.objective} onSelect={(v: string) => updateData('objective', v)} />
      <SelectableCard label="Prendre de la masse" value="Prise de masse" selectedValue={data.objective} onSelect={(v: string) => updateData('objective', v)} />

      <View className="mt-6 flex-row justify-between">
        <View className="flex-1 mr-2">
           <Text className="text-gray-400 mb-2">Taille (cm)</Text>
           <TextInput
            value={data.height}
            onChangeText={(t) => updateData('height', t)}
            keyboardType="numeric"
            className="text-white text-2xl text-center bg-gray-900 rounded-2xl py-4 font-bold border border-gray-800"
            placeholder="170"
            placeholderTextColor="#4B5563"
           />
        </View>
        <View className="flex-1 mx-1">
           <Text className="text-gray-400 mb-2">Poids (kg)</Text>
           <TextInput
            value={data.currentWeight}
            onChangeText={(t) => updateData('currentWeight', t)}
            keyboardType="numeric"
            className="text-white text-2xl text-center bg-gray-900 rounded-2xl py-4 font-bold border border-gray-800"
            placeholder="80"
            placeholderTextColor="#4B5563"
           />
        </View>
        <View className="flex-1 ml-2">
           <Text className="text-gray-400 mb-2">Cible (kg)</Text>
           <TextInput
            value={data.targetWeight}
            onChangeText={(t) => updateData('targetWeight', t)}
            keyboardType="numeric"
            className="text-white text-2xl text-center bg-gray-900 rounded-2xl py-4 font-bold border border-gray-800"
            placeholder="70"
            placeholderTextColor="#4B5563"
           />
        </View>
      </View>

      <TouchableOpacity
        className={`mt-auto mb-6 py-4 rounded-full items-center ${data.objective && data.height && data.currentWeight && data.targetWeight ? 'bg-black border-2 border-black' : 'bg-gray-800'}`}
        onPress={nextStep}
        disabled={!(data.objective && data.height && data.currentWeight && data.targetWeight)}
      >
        <Text className="font-bold text-lg uppercase" style={{ fontFamily: 'Poppins_700Bold', color: data.objective && data.height && data.currentWeight && data.targetWeight ? '#39FF14' : '#6B7280' }}>
          Continuer
        </Text>
      </TouchableOpacity>
    </View>
  );

  const Step2Bis = () => {
    // Realistic Projection Calculation
    const weightDiff = Math.abs(parseFloat(data.currentWeight) - parseFloat(data.targetWeight));
    const weeksToGoal = weightDiff / 0.5; // Safe loss/gain: 0.5kg per week
    const targetDate = addDays(new Date(), weeksToGoal * 7);
    const dateFormatted = format(targetDate, 'dd MMMM yyyy', { locale: fr });

    const actionText = data.objective === 'Prise de masse' ? 'Prendre' : 'Perdre';

    return (
      <ImageBackground
        source={{ uri: 'https://images.unsplash.com/photo-1526506118029-4591b65db912?auto=format&fit=crop&q=80' }}
        className="flex-1 -m-6 p-6 justify-end"
      >
        <View className="absolute inset-0 bg-black/70" />
        <View className="flex-1 justify-center z-10">
          <BlurView intensity={40} tint="dark" className="p-8 rounded-[2rem] border border-white/20">
            <Text className="text-[#39FF14] text-xl font-bold mb-4 uppercase tracking-widest text-center" style={{ fontFamily: 'Poppins_700Bold' }}>Projection réaliste</Text>
            <Text className="text-white text-3xl font-bold text-center leading-relaxed" style={{ fontFamily: 'Poppins_700Bold' }}>
              {actionText} <Text className="text-[#39FF14]">{weightDiff} kg</Text> est un objectif atteignable et sain.
            </Text>
            <Text className="text-gray-300 text-lg text-center mt-6" style={{ fontFamily: 'Poppins_400Regular' }}>
              Atteignez-le d'ici le :
            </Text>
            <Text className="text-white text-2xl font-bold text-center mt-2" style={{ fontFamily: 'Poppins_700Bold' }}>
              {dateFormatted}
            </Text>
          </BlurView>
        </View>
        <TouchableOpacity
          className="bg-black py-4 rounded-full items-center mb-6 z-10 shadow-[0_0_15px_rgba(57,255,20,0.5)] border border-[#39FF14]/50"
          onPress={nextStep}
        >
          <Text className="font-bold text-lg uppercase text-[#39FF14]" style={{ fontFamily: 'Poppins_700Bold' }}>
            Je suis prêt !
          </Text>
        </TouchableOpacity>
      </ImageBackground>
    );
  };

  const Step3 = () => (
    <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
      <Text className="text-white text-2xl font-bold mb-6" style={{ fontFamily: 'Poppins_700Bold' }}>Ton mode de vie</Text>

      <Text className="text-gray-400 mb-4 font-medium" style={{ fontFamily: 'Poppins_500Medium' }}>Sommeil moyen</Text>
      <SelectableCard label="Moins de 5h" value="Moins de 5h" selectedValue={data.sleep} onSelect={(v: string) => updateData('sleep', v)} />
      <SelectableCard label="6 à 7h" value="6-7h" selectedValue={data.sleep} onSelect={(v: string) => updateData('sleep', v)} />
      <SelectableCard label="8h ou plus" value="8h+" selectedValue={data.sleep} onSelect={(v: string) => updateData('sleep', v)} />

      <Text className="text-gray-400 mt-6 mb-4 font-medium" style={{ fontFamily: 'Poppins_500Medium' }}>Niveau d'activité (Travail / Sport)</Text>
      <SelectableCard label="Sédentaire (Bureau, peu de marche)" value="Sédentaire" selectedValue={data.activityLevel} onSelect={(v: string) => updateData('activityLevel', v)} />
      <SelectableCard label="Légère (Marche occasionnelle)" value="Légère" selectedValue={data.activityLevel} onSelect={(v: string) => updateData('activityLevel', v)} />
      <SelectableCard label="Modérée (Sport 1-3x/semaine)" value="Modérée" selectedValue={data.activityLevel} onSelect={(v: string) => updateData('activityLevel', v)} />
      <SelectableCard label="Intense (Sport 4x+/semaine)" value="Intense" selectedValue={data.activityLevel} onSelect={(v: string) => updateData('activityLevel', v)} />

      <TouchableOpacity
        className={`mt-8 mb-6 py-4 rounded-full items-center ${data.sleep && data.activityLevel ? 'bg-black border-2 border-black' : 'bg-gray-800'}`}
        onPress={nextStep}
        disabled={!(data.sleep && data.activityLevel)}
      >
        <Text className="font-bold text-lg uppercase" style={{ fontFamily: 'Poppins_700Bold', color: data.sleep && data.activityLevel ? '#39FF14' : '#6B7280' }}>
          Continuer
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );

  const Step4 = () => (
    <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
      <Text className="text-white text-2xl font-bold mb-6" style={{ fontFamily: 'Poppins_700Bold' }}>Profil Santé</Text>

      <Text className="text-gray-400 mb-4 font-medium" style={{ fontFamily: 'Poppins_500Medium' }}>As-tu des conditions médicales ?</Text>
      <SelectableCard label="Aucune" value="Aucun" selectedValue={data.health} onSelect={(v: string) => updateData('health', v)} />
      <SelectableCard label="Diabète" value="Diabète" selectedValue={data.health} onSelect={(v: string) => updateData('health', v)} />
      <SelectableCard label="Hypertension" value="Hypertension" selectedValue={data.health} onSelect={(v: string) => updateData('health', v)} />

      {data.gender === 'Femme' && (
        <>
          <Text className="text-gray-400 mt-6 mb-4 font-medium" style={{ fontFamily: 'Poppins_500Medium' }}>Conditions féminines particulières ?</Text>
          <SelectableCard label="Aucune" value="Aucune" selectedValue={data.womenCondition} onSelect={(v: string) => updateData('womenCondition', v)} />
          <SelectableCard label="Allaitement" value="Allaitement" selectedValue={data.womenCondition} onSelect={(v: string) => updateData('womenCondition', v)} />
          <SelectableCard label="Grossesse" value="Grossesse" selectedValue={data.womenCondition} onSelect={(v: string) => updateData('womenCondition', v)} />
          <SelectableCard label="SOPK" value="SOPK" selectedValue={data.womenCondition} onSelect={(v: string) => updateData('womenCondition', v)} />
          <SelectableCard label="Ménopause" value="Ménopause" selectedValue={data.womenCondition} onSelect={(v: string) => updateData('womenCondition', v)} />
        </>
      )}

      <TouchableOpacity
        className={`mt-8 mb-6 py-4 rounded-full items-center ${data.health && (data.gender === 'Homme' || data.womenCondition) ? 'bg-black border-2 border-black' : 'bg-gray-800'}`}
        onPress={nextStep}
        disabled={!(data.health && (data.gender === 'Homme' || data.womenCondition))}
      >
        <Text className="font-bold text-lg uppercase" style={{ fontFamily: 'Poppins_700Bold', color: data.health && (data.gender === 'Homme' || data.womenCondition) ? '#39FF14' : '#6B7280' }}>
          Continuer
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );

  const Step5 = () => (
    <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
      <Text className="text-white text-2xl font-bold mb-6" style={{ fontFamily: 'Poppins_700Bold' }}>Habitudes Alimentaires</Text>

      <Text className="text-gray-400 mb-4 font-medium" style={{ fontFamily: 'Poppins_500Medium' }}>Hydratation quotidienne</Text>
      <SelectableCard label="Moins de 1L" value="Moins 1L" selectedValue={data.hydration} onSelect={(v: string) => updateData('hydration', v)} />
      <SelectableCard label="1L à 2L" value="1L-2L" selectedValue={data.hydration} onSelect={(v: string) => updateData('hydration', v)} />
      <SelectableCard label="Plus de 2L" value="Plus 2L" selectedValue={data.hydration} onSelect={(v: string) => updateData('hydration', v)} />

      <Text className="text-gray-400 mt-6 mb-4 font-medium" style={{ fontFamily: 'Poppins_500Medium' }}>As-tu déjà suivi des régimes ?</Text>
      <SelectableCard label="Jamais" value="Jamais" selectedValue={data.pastDiets} onSelect={(v: string) => updateData('pastDiets', v)} />
      <SelectableCard label="Oui, sans succès à long terme" value="Oui" selectedValue={data.pastDiets} onSelect={(v: string) => updateData('pastDiets', v)} />

      <Text className="text-gray-400 mt-6 mb-4 font-medium" style={{ fontFamily: 'Poppins_500Medium' }}>Matières grasses utilisées pour cuisiner</Text>
      <SelectableCard label="Beaucoup d'huile" value="Beaucoup d'huile" selectedValue={data.cookingFats} onSelect={(v: string) => updateData('cookingFats', v)} />
      <SelectableCard label="Huile d'olive / Modéré" value="Modéré" selectedValue={data.cookingFats} onSelect={(v: string) => updateData('cookingFats', v)} />

      <TouchableOpacity
        className={`mt-8 mb-6 py-4 rounded-full items-center ${data.hydration && data.pastDiets && data.cookingFats ? 'bg-black border-2 border-black' : 'bg-gray-800'}`}
        onPress={nextStep}
        disabled={!(data.hydration && data.pastDiets && data.cookingFats)}
      >
        <Text className="font-bold text-lg uppercase" style={{ fontFamily: 'Poppins_700Bold', color: data.hydration && data.pastDiets && data.cookingFats ? '#39FF14' : '#6B7280' }}>
          Continuer
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );

  const Step6 = () => (
    <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
      <Text className="text-white text-2xl font-bold mb-6" style={{ fontFamily: 'Poppins_700Bold' }}>Le Rythme Africain</Text>

      <Text className="text-gray-400 mb-4 font-medium" style={{ fontFamily: 'Poppins_500Medium' }}>L'élément principal de tes repas</Text>
      <SelectableCard label="Féculents lourds (Foutou, Igname...)" value="Féculents lourds" selectedValue={data.mainCarb} onSelect={(v: string) => updateData('mainCarb', v)} />
      <SelectableCard label="Riz / Céréales" value="Riz/Céréales" selectedValue={data.mainCarb} onSelect={(v: string) => updateData('mainCarb', v)} />
      <SelectableCard label="Sauces riches (Arachide, Graine...)" value="Sauces riches" selectedValue={data.mainCarb} onSelect={(v: string) => updateData('mainCarb', v)} />
      <SelectableCard label="Protéines et Légumes" value="Protéines/Légumes" selectedValue={data.mainCarb} onSelect={(v: string) => updateData('mainCarb', v)} />

      <Text className="text-gray-400 mt-6 mb-4 font-medium" style={{ fontFamily: 'Poppins_500Medium' }}>Le Dîner</Text>
      <SelectableCard label="Très copieux (Reste du midi)" value="Très copieux" selectedValue={data.dinnerType} onSelect={(v: string) => updateData('dinnerType', v)} />
      <SelectableCard label="Léger (Salade, Soupe...)" value="Léger" selectedValue={data.dinnerType} onSelect={(v: string) => updateData('dinnerType', v)} />
      <SelectableCard label="Je grignote" value="Je grignote" selectedValue={data.dinnerType} onSelect={(v: string) => updateData('dinnerType', v)} />

      <TouchableOpacity
        className={`mt-8 mb-6 py-4 rounded-full items-center ${data.mainCarb && data.dinnerType ? 'bg-black border-2 border-black' : 'bg-gray-800'}`}
        onPress={nextStep}
        disabled={!(data.mainCarb && data.dinnerType)}
      >
        <Text className="font-bold text-lg uppercase" style={{ fontFamily: 'Poppins_700Bold', color: data.mainCarb && data.dinnerType ? '#39FF14' : '#6B7280' }}>
          Continuer
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );

  const Step7 = () => (
    <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
      <Text className="text-white text-2xl font-bold mb-6" style={{ fontFamily: 'Poppins_700Bold' }}>Pratique & Famille</Text>

      <Text className="text-gray-400 mb-4 font-medium" style={{ fontFamily: 'Poppins_500Medium' }}>Comment manges-tu à midi ?</Text>
      <SelectableCard label="Gamelle personnelle" value="Gamelle" selectedValue={data.lunchType} onSelect={(v: string) => updateData('lunchType', v)} />
      <SelectableCard label="Bol commun familial" value="Bol commun" selectedValue={data.lunchType} onSelect={(v: string) => updateData('lunchType', v)} />

      <Text className="text-gray-400 mt-6 mb-4 font-medium" style={{ fontFamily: 'Poppins_500Medium' }}>Pour qui cuisines-tu ?</Text>
      <SelectableCard label="Juste pour moi" value="Pour soi" selectedValue={data.cookingFor} onSelect={(v: string) => updateData('cookingFor', v)} />
      <SelectableCard label="Pour toute la famille" value="Famille" selectedValue={data.cookingFor} onSelect={(v: string) => updateData('cookingFor', v)} />

      <Text className="text-gray-400 mt-6 mb-4 font-medium" style={{ fontFamily: 'Poppins_500Medium' }}>Budget Courses (Mensuel estimé)</Text>
      <SelectableCard label="Moins de 50 000 FCFA" value="< 50k" selectedValue={data.groceryBudget} onSelect={(v: string) => updateData('groceryBudget', v)} />
      <SelectableCard label="50 000 - 100 000 FCFA" value="50k-100k" selectedValue={data.groceryBudget} onSelect={(v: string) => updateData('groceryBudget', v)} />
      <SelectableCard label="Plus de 100 000 FCFA" value="> 100k" selectedValue={data.groceryBudget} onSelect={(v: string) => updateData('groceryBudget', v)} />

      <TouchableOpacity
        className={`mt-8 mb-6 py-4 rounded-full items-center ${data.lunchType && data.cookingFor && data.groceryBudget ? 'bg-black border-2 border-black' : 'bg-gray-800'}`}
        onPress={nextStep}
        disabled={!(data.lunchType && data.cookingFor && data.groceryBudget)}
      >
        <Text className="font-bold text-lg uppercase" style={{ fontFamily: 'Poppins_700Bold', color: data.lunchType && data.cookingFor && data.groceryBudget ? '#39FF14' : '#6B7280' }}>
          Continuer
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );

  const Step8 = () => (
    <View className="flex-1">
      <Text className="text-white text-2xl font-bold mb-6" style={{ fontFamily: 'Poppins_700Bold' }}>Presque fini !</Text>
      <Text className="text-gray-400 mb-8 font-medium text-lg" style={{ fontFamily: 'Poppins_500Medium' }}>Où pouvons-nous t'envoyer ton programme ?</Text>

      <View className="mb-6">
        <Text className="text-gray-400 mb-2 font-medium" style={{ fontFamily: 'Poppins_500Medium' }}>Ton Prénom</Text>
        <TextInput
          value={data.firstName}
          onChangeText={(t) => updateData('firstName', t)}
          placeholder="Ex: Awa"
          placeholderTextColor="#4B5563"
          className="text-white text-xl bg-gray-900 rounded-2xl p-4 font-bold border border-gray-800"
          style={{ fontFamily: 'Poppins_700Bold' }}
        />
      </View>

      <View className="mb-6">
        <Text className="text-gray-400 mb-2 font-medium" style={{ fontFamily: 'Poppins_500Medium' }}>Numéro WhatsApp</Text>
        <TextInput
          value={data.phone}
          onChangeText={(t) => updateData('phone', t)}
          placeholder="Ex: 77 123 45 67"
          placeholderTextColor="#4B5563"
          keyboardType="phone-pad"
          className="text-white text-xl bg-gray-900 rounded-2xl p-4 font-bold border border-gray-800"
          style={{ fontFamily: 'Poppins_700Bold' }}
        />
      </View>

      <TouchableOpacity
        className={`mt-auto mb-6 py-4 rounded-full items-center ${data.firstName && data.phone && !isSubmitting ? 'bg-[#39FF14] shadow-[0_0_15px_rgba(57,255,20,0.5)]' : 'bg-gray-800'}`}
        onPress={() => {
           setStep(10);
           handleSubmit();
        }}
        disabled={!(data.firstName && data.phone) || isSubmitting}
      >
        <Text className={`font-bold text-lg uppercase ${data.firstName && data.phone ? 'text-black' : 'text-gray-500'}`} style={{ fontFamily: 'Poppins_700Bold' }}>
          Générer mon programme
        </Text>
      </TouchableOpacity>
    </View>
  );

  const Step9 = () => (
    <View className="flex-1 justify-center items-center">
      <View className="bg-gray-900 p-6 rounded-[2rem] border border-gray-800 w-full mb-8">
        <View className="flex-row items-center mb-4">
          <View className="w-12 h-12 rounded-full bg-[#39FF14] items-center justify-center mr-4">
             <Text className="text-black font-bold text-xl" style={{ fontFamily: 'Poppins_700Bold' }}>J</Text>
          </View>
          <View>
             <Text className="text-white font-bold text-lg" style={{ fontFamily: 'Poppins_700Bold' }}>Jules (Coach IA)</Text>
             <Text className="text-[#39FF14] text-xs">En ligne</Text>
          </View>
        </View>

        <View className="bg-gray-800 p-4 rounded-2xl rounded-tl-none">
          <Text className="text-white text-lg leading-relaxed" style={{ fontFamily: 'Poppins_500Medium' }}>
            {chatMessage || "..."}
          </Text>
        </View>
      </View>
    </View>
  );

  // --- Backend Submission Logic --- //

  const calculateDailyCalories = (data: DiagData) => {
    // Mifflin-St Jeor Equation
    let bmr = (10 * parseFloat(data.currentWeight)) + (6.25 * parseFloat(data.height)) - (5 * parseInt(data.age));
    bmr = data.gender === 'Homme' ? bmr + 5 : bmr - 161;

    let multiplier = 1.2; // Sédentaire
    if (data.activityLevel === 'Légère') multiplier = 1.375;
    if (data.activityLevel === 'Modérée') multiplier = 1.55;
    if (data.activityLevel === 'Intense') multiplier = 1.725;

    let tdee = bmr * multiplier;

    if (data.objective === 'Perte de poids') tdee -= 500;
    if (data.objective === 'Prise de masse') tdee += 500;

    if (data.womenCondition === 'Allaitement') tdee += 400;

    // Plancher de sécurité
    return Math.max(1200, Math.round(tdee));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setChatMessage(`Salut ${data.firstName}, je suis en train d'analyser ton profil...`);

    // Minimum visual delay for the "chat" effect
    const chatSequence = async () => {
      await new Promise(r => setTimeout(r, 1500));
      setChatMessage(`Je calcule tes besoins métaboliques...`);
      await new Promise(r => setTimeout(r, 1500));
      setChatMessage(`Programme généré ! Création de ton espace...`);
    };

    const backendProcess = async () => {
      try {
        const cleanPhone = data.phone.replace(/\s+/g, '');
        const authEmail = cleanPhone.includes('@') ? cleanPhone : `${cleanPhone}@clients.onyxcrm.com`;
        const defaultPassword = cleanPhone.slice(-8).padStart(8, '0');

        let userId = null;

        // ÉTAPE A : Tentative de connexion (Si le compte existe déjà)
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: authEmail,
          password: defaultPassword,
        });

        if (signInData?.user) {
          userId = signInData.user.id;
        } else {
          // ÉTAPE B : Création via notre API Backend Web (Bypass RLS & Période d'essai J+15)
          const response = await fetch('https://nutriafro.app/api/create-user', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: authEmail,
              password: defaultPassword,
              full_name: data.firstName,
              phone: cleanPhone.startsWith('+221') ? cleanPhone : `+221${cleanPhone}`,
              role: 'client',
              saas: "Nutrition à l'Africaine",
              type: 'Client',
              status: 'Compte Créé',
              password_temp: defaultPassword
            }),
          });

          const apiResult = await response.json();

          if (!response.ok) {
            throw new Error(apiResult.message || "Erreur lors de la création du compte via API");
          }

          userId = apiResult.user?.id || apiResult.id;

          // Connecter immédiatement la session côté mobile après la création API
          await supabase.auth.signInWithPassword({
            email: authEmail,
            password: defaultPassword,
          });
        }

        if (!userId) throw new Error("Impossible de récupérer l'ID utilisateur.");

        const calories = calculateDailyCalories(data);

        // ÉTAPE C : Remontée commerciale dans la table LEADS
        const { error: leadsError } = await supabase
          .from('leads')
          .insert([
            {
              full_name: data.firstName,
              phone: cleanPhone,
              source: "Diagnostic Nutrition Landing",
              intent: "A complété son diagnostic",
              status: "Nouveau",
              saas: "Nutrition à l'Africaine",
              message: `Objectif: ${calories} kcal`
            }
          ]);

        if (leadsError) console.error("Erreur insertion Lead:", leadsError);

        // ÉTAPE D : Création / Mise à jour du profil dans NUTRITION_PROFILES (Pour le Dashboard)
        const { error: profileError } = await supabase
          .from('nutrition_profiles')
          .upsert([
            {
              client_id: userId,
              phone: cleanPhone,
              daily_calorie_goal: calories,
              bmr: 0,
              tdee: 0,
              carbs_goal: 150,
              protein_goal: 80,
              fats_goal: 50,
              diagnostic_data: data, // Le JSON complet des réponses
              tracking_mode: 'guided'
            }
          ], { onConflict: 'client_id' });

        if (profileError) console.error("Erreur insertion Nutrition Profile:", profileError);

        return true;
      } catch (e: any) {
        console.error("Erreur Backend Diagnostic:", e.message);
        return false;
      }
    };

    // Run both sequences in parallel, but wait for both
    const [_, success] = await Promise.all([chatSequence(), backendProcess()]);

    if (success) {
      router.replace('/(tabs)');
    } else {
      setChatMessage("Une erreur est survenue lors de la création. Veuillez réessayer.");
      setTimeout(() => {
        setStep(9);
        setIsSubmitting(false);
      }, 3000);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1: return <Step1 />;
      case 2: return <Step2 />;
      case 3: return <Step2Bis />;
      case 4: return <Step3 />;
      case 5: return <Step4 />;
      case 6: return <Step5 />;
      case 7: return <Step6 />;
      case 8: return <Step7 />;
      case 9: return <Step8 />;
      case 10: return <Step9 />; // Technically step 10 is the 9th UI step (Chat) as Step 2Bis offset it. Wait, the step counter is 1 to 10. Let's adjust.
      default: return <Step1 />;
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-black" edges={['top', 'bottom']}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} className="flex-1">
        {/* Header */}
        <View className="px-6 pt-4 pb-2 bg-black">
          <View className="flex-row items-center mb-4">
            {step > 1 && step < 10 && !isSubmitting && (
              <TouchableOpacity onPress={prevStep} className="mr-4 p-2 bg-gray-900 rounded-full border border-gray-800">
                <ArrowLeft color="white" size={20} />
              </TouchableOpacity>
            )}
            {step < 10 && <Text className="text-white text-lg font-bold" style={{ fontFamily: 'Poppins_700Bold' }}>Étape {step} / {TOTAL_STEPS - 1}</Text>}
          </View>
          {step < 10 && renderProgressBar()}
        </View>

        {/* Content */}
        <View className="flex-1 px-6 pt-4">
          {renderStep()}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
