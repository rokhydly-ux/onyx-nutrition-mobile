import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, Dimensions, ImageBackground, Animated, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Check, CheckCircle2, Sun, Moon, Activity, Heart, AlertCircle, ShieldCheck, Droplets, Utensils } from 'lucide-react-native';
import { addDays, format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { supabase } from '../lib/supabase';
import { BlurView } from 'expo-blur';
import Svg, { Path, Circle } from 'react-native-svg';
const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedView = Animated.View;
import { useColorScheme } from 'nativewind';

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

const TOTAL_STEPS = 12;

export default function DiagnosticScreen() {
  const router = useRouter();
  const { colorScheme, toggleColorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [step, setStep] = useState(1);
  const [data, setData] = useState<DiagData>(initialDiagData);

  // Fake chat state
  const [chatMessage, setChatMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [password, setPassword] = useState('');
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);

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
      <View className="h-1 bg-gray-200 dark:bg-gray-800 w-full mb-4">
        <Animated.View style={{ width: `${progress}%` }} className="h-full bg-[#39FF14]" />
      </View>
    );
  };

  // --- Step Components --- //

  // Selectable Card Helper
  const SelectableCard = ({ label, value, selectedValue, onSelect, imageUri, icon: IconComponent }: any) => {
    const isSelected = selectedValue === value;
    return (
      <TouchableOpacity
        onPress={() => onSelect(value)}
        className={`w-full rounded-2xl p-4 mb-4 flex-row items-center justify-between border-[3px] ${isSelected ? 'border-[#39FF14] bg-[#39FF14]/10' : 'border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900'}`}
      >
        <View className="flex-row items-center flex-1">
           {imageUri && (
             <ImageBackground source={{ uri: imageUri }} className="w-20 h-20 rounded-xl overflow-hidden mr-4 aspect-square" resizeMode="contain" />
           )}
           {IconComponent && !imageUri && (
             <View className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-800 items-center justify-center mr-4">
               <IconComponent color={isSelected ? "#39FF14" : (isDark ? "#A3A3A3" : "#6B7280")} size={24} />
             </View>
           )}
          <Text className={`text-lg flex-1 ${isSelected ? 'text-[#39FF14] font-bold' : 'text-black dark:text-white'}`} style={{ fontFamily: isSelected ? 'Poppins_700Bold' : 'Poppins_500Medium' }}>
            {label}
          </Text>
        </View>
        {isSelected && <CheckCircle2 color="#39FF14" size={24} />}
      </TouchableOpacity>
    );
  };




  const SelectableGridCard = ({ label, value, selectedValue, onSelect, imageUri, icon: IconComponent, vertical = false }: any) => {
    const isSelected = selectedValue === value;
    return (
      <TouchableOpacity
        onPress={() => onSelect(value)}
        className={`flex-1 rounded-2xl p-3 mb-4 items-center justify-center border-[3px] ${isSelected ? 'border-[#39FF14] bg-[#39FF14]/10' : 'border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900'} ${vertical ? 'flex-col' : 'aspect-square'}`}
      >
        {imageUri && (
          <ImageBackground source={{ uri: imageUri }} className={`rounded-xl overflow-hidden mb-2 ${vertical ? 'w-full h-36' : 'w-32 h-32'} aspect-square`} resizeMode="contain" />
        )}
        <Text className={`text-center ${isSelected ? 'text-[#39FF14] font-bold' : 'text-black dark:text-white'} ${vertical ? 'text-sm' : 'text-xs'}`} style={{ fontFamily: isSelected ? 'Poppins_700Bold' : 'Poppins_500Medium' }}>
          {label}
        </Text>
        {isSelected && <View className="absolute top-2 right-2 bg-white rounded-full"><CheckCircle2 color="#39FF14" size={16} /></View>}
      </TouchableOpacity>
    );
  };

  const Step1 = () => (
    <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
      <Text className="text-black dark:text-white text-2xl font-bold mb-6" style={{ fontFamily: 'Poppins_700Bold' }}>Parle-nous de toi</Text>

      <View className="flex-row gap-3">
        <SelectableGridCard label="Homme" value="Homme" selectedValue={data.gender} onSelect={(v: string) => updateData('gender', v)} imageUri="https://res.cloudinary.com/dtr2wtoty/image/upload/v1781174715/redimensionner_format_1_1_en_202606111044_rjknkg.jpg" />
        <SelectableGridCard label="Femme" value="Femme" selectedValue={data.gender} onSelect={(v: string) => updateData('gender', v)} imageUri="https://res.cloudinary.com/dtr2wtoty/image/upload/v1781174715/redimensionner_1_1_en_gardant_202606111043_unmonc.jpg" />
      </View>

      <View className="mt-8">
        <Text className="text-gray-500 dark:text-gray-400 text-lg mb-2 text-center" style={{ fontFamily: 'Poppins_500Medium' }}>Quel âge as-tu ?</Text>
        <TextInput
          value={String(data.age || '')}
          onChangeText={(t) => updateData('age', t)}
          placeholder="Ex: 30"
          placeholderTextColor="#4B5563"
          keyboardType="number-pad"
          className="text-black dark:text-white text-4xl text-center bg-gray-50 dark:bg-gray-900 rounded-2xl py-6 font-bold border border-gray-200 dark:border-gray-800"
          style={{ fontFamily: 'Poppins_700Bold' }}
          maxLength={10}
        />
      </View>
    </ScrollView>
  );

  const Step2 = () => (
    <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
      <Text className="text-black dark:text-white text-2xl font-bold mb-6" style={{ fontFamily: 'Poppins_700Bold' }}>Quel est ton objectif ?</Text>

      <View className="flex-row gap-2">
        <SelectableGridCard vertical label="Perte de poids" value="Perte de poids" selectedValue={data.objective} onSelect={(v: string) => updateData('objective', v)} imageUri="https://res.cloudinary.com/dtr2wtoty/image/upload/v1781190763/An_authentic_photorealistic_full-body_portrait_202606111512_f3zs3t.jpg" />
        <SelectableGridCard vertical label="Maintien" value="Maintien" selectedValue={data.objective} onSelect={(v: string) => updateData('objective', v)} imageUri="https://res.cloudinary.com/dtr2wtoty/image/upload/v1781542708/A_high-end_commercial_photorealistic_portrait_202606151658_noabp9.jpg" />
        <SelectableGridCard vertical label="Prise de masse" value="Prise de masse" selectedValue={data.objective} onSelect={(v: string) => updateData('objective', v)} imageUri="https://res.cloudinary.com/dtr2wtoty/image/upload/v1781544091/rajoute_le_logo_sur_la_202606151721_aayo61.jpg" />
      </View>

      <View className="mt-6 flex-row justify-between">
        <View className="flex-1 mr-2">
           <Text className="text-gray-500 dark:text-gray-400 mb-2">Taille (cm)</Text>
           <TextInput
            value={String(data.height || '')}
            onChangeText={(t) => updateData('height', t)}
            keyboardType="number-pad"
            className="text-black dark:text-white text-2xl text-center bg-gray-50 dark:bg-gray-900 rounded-2xl py-4 font-bold border border-gray-200 dark:border-gray-800"
            placeholder="170"
            placeholderTextColor="#4B5563"
           />
        </View>
        <View className="flex-1 mx-1">
           <Text className="text-gray-500 dark:text-gray-400 mb-2">Poids (kg)</Text>
           <TextInput
            value={String(data.currentWeight || '')}
            onChangeText={(t) => updateData('currentWeight', t)}
            keyboardType="number-pad"
            className="text-black dark:text-white text-2xl text-center bg-gray-50 dark:bg-gray-900 rounded-2xl py-4 font-bold border border-gray-200 dark:border-gray-800"
            placeholder="80"
            placeholderTextColor="#4B5563"
           />
        </View>
        <View className="flex-1 ml-2">
           <Text className="text-gray-500 dark:text-gray-400 mb-2">Cible (kg)</Text>
           <TextInput
            value={String(data.targetWeight || '')}
            onChangeText={(t) => updateData('targetWeight', t)}
            keyboardType="number-pad"
            className="text-black dark:text-white text-2xl text-center bg-gray-50 dark:bg-gray-900 rounded-2xl py-4 font-bold border border-gray-200 dark:border-gray-800"
            placeholder="70"
            placeholderTextColor="#4B5563"
           />
        </View>
      </View>
    </ScrollView>
  );

  const Step3 = () => (
    <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
      <Text className="text-black dark:text-white text-2xl font-bold mb-6" style={{ fontFamily: 'Poppins_700Bold' }}>Ton mode de vie</Text>

      <View className="flex-row items-center mb-4">
        <Image source={{ uri: "https://res.cloudinary.com/dtr2wtoty/image/upload/v1782675093/3_topvyj.png" }} className="w-6 h-6 mr-2" resizeMode="contain" />
        <Text className="text-gray-500 dark:text-gray-400 font-medium" style={{ fontFamily: 'Poppins_500Medium' }}>Heures de sommeil par nuit</Text>
      </View>
      <SelectableCard label="Moins de 5h" value="Moins de 5h" selectedValue={data.sleep} onSelect={(v: string) => updateData('sleep', v)} />
      <SelectableCard label="6 à 7h" value="6-7h" selectedValue={data.sleep} onSelect={(v: string) => updateData('sleep', v)} />
      <SelectableCard label="8h ou plus" value="8h+" selectedValue={data.sleep} onSelect={(v: string) => updateData('sleep', v)} />

      <View className="flex-row items-center mt-6 mb-4">
        <Image source={{ uri: "https://res.cloudinary.com/dtr2wtoty/image/upload/v1782675092/5_olxege.png" }} className="w-6 h-6 mr-2" resizeMode="contain" />
        <Text className="text-gray-500 dark:text-gray-400 font-medium" style={{ fontFamily: 'Poppins_500Medium' }}>Déplacements au quotidien</Text>
      </View>
      <SelectableCard label="Sédentaire (Bureau, peu de marche)" value="Sédentaire" selectedValue={data.activityLevel} onSelect={(v: string) => updateData('activityLevel', v)} />
      <SelectableCard label="Légère (Marche occasionnelle)" value="Légère" selectedValue={data.activityLevel} onSelect={(v: string) => updateData('activityLevel', v)} />
      <SelectableCard label="Modérée (Sport 1-3x/semaine)" value="Modérée" selectedValue={data.activityLevel} onSelect={(v: string) => updateData('activityLevel', v)} />
      <SelectableCard label="Intense (Sport 4x+/semaine)" value="Intense" selectedValue={data.activityLevel} onSelect={(v: string) => updateData('activityLevel', v)} />
    </ScrollView>
  );

  const Step4 = () => (
    <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
      <Text className="text-black dark:text-white text-2xl font-bold mb-6" style={{ fontFamily: 'Poppins_700Bold' }}>Profil Santé</Text>

      <Text className="text-gray-500 dark:text-gray-400 mb-4 font-medium" style={{ fontFamily: 'Poppins_500Medium' }}>As-tu des conditions médicales ?</Text>
      <SelectableCard label="Aucune" value="Aucun" selectedValue={data.health} onSelect={(v: string) => updateData('health', v)} icon={ShieldCheck} />
      <SelectableCard label="Diabète" value="Diabète" selectedValue={data.health} onSelect={(v: string) => updateData('health', v)} icon={Activity} />
      <SelectableCard label="Hypertension" value="Hypertension" selectedValue={data.health} onSelect={(v: string) => updateData('health', v)} icon={Heart} />

      {data.gender === 'Femme' && (
        <View className="mt-6">
          <Text className="text-gray-500 dark:text-gray-400 mb-4 font-medium" style={{ fontFamily: 'Poppins_500Medium' }}>Conditions féminines particulières ?</Text>
          <SelectableCard label="Aucune" value="Aucune" selectedValue={data.womenCondition} onSelect={(v: string) => updateData('womenCondition', v)} icon={ShieldCheck} />
          <SelectableCard label="Allaitement" value="Allaitement" selectedValue={data.womenCondition} onSelect={(v: string) => updateData('womenCondition', v)} icon={Droplets} />
          <SelectableCard label="Grossesse" value="Grossesse" selectedValue={data.womenCondition} onSelect={(v: string) => updateData('womenCondition', v)} icon={Heart} />
          <SelectableCard label="SOPK" value="SOPK" selectedValue={data.womenCondition} onSelect={(v: string) => updateData('womenCondition', v)} icon={AlertCircle} />
          <SelectableCard label="Ménopause" value="Ménopause" selectedValue={data.womenCondition} onSelect={(v: string) => updateData('womenCondition', v)} icon={Activity} />
        </View>
      )}
    </ScrollView>
  );

  const Step5 = () => (
    <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
      <Text className="text-black dark:text-white text-2xl font-bold mb-6" style={{ fontFamily: 'Poppins_700Bold' }}>Habitudes Alimentaires</Text>

      <View className="flex-row items-center mb-4">
        <Image source={{ uri: "https://res.cloudinary.com/dtr2wtoty/image/upload/v1782675042/2_maewiy.png" }} className="w-6 h-6 mr-2" resizeMode="contain" />
        <Text className="text-gray-500 dark:text-gray-400 font-medium" style={{ fontFamily: 'Poppins_500Medium' }}>Quelle quantité d'eau consommez-vous ?</Text>
      </View>
      <SelectableCard label="Moins de 1L" value="Moins 1L" selectedValue={data.hydration} onSelect={(v: string) => updateData('hydration', v)} />
      <SelectableCard label="1L à 2L" value="1L-2L" selectedValue={data.hydration} onSelect={(v: string) => updateData('hydration', v)} />
      <SelectableCard label="Plus de 2L" value="Plus 2L" selectedValue={data.hydration} onSelect={(v: string) => updateData('hydration', v)} />

      <View className="flex-row items-center mt-6 mb-4">
        <Image source={{ uri: "https://res.cloudinary.com/dtr2wtoty/image/upload/v1782675094/4_uk6ui2.png" }} className="w-6 h-6 mr-2" resizeMode="contain" />
        <Text className="text-gray-500 dark:text-gray-400 font-medium" style={{ fontFamily: 'Poppins_500Medium' }}>Habitudes (Régimes / Cuisson)</Text>
      </View>
      <SelectableCard label="Jamais suivi de régime" value="Jamais" selectedValue={data.pastDiets} onSelect={(v: string) => updateData('pastDiets', v)} />
      <SelectableCard label="Régimes passés sans succès" value="Oui" selectedValue={data.pastDiets} onSelect={(v: string) => updateData('pastDiets', v)} />

      <SelectableCard label="Je cuisine avec beaucoup d'huile" value="Beaucoup d'huile" selectedValue={data.cookingFats} onSelect={(v: string) => updateData('cookingFats', v)} />
      <SelectableCard label="Huile d'olive / Modéré" value="Modéré" selectedValue={data.cookingFats} onSelect={(v: string) => updateData('cookingFats', v)} />
    </ScrollView>
  );

  const Step6 = () => (
    <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
      <Text className="text-black dark:text-white text-2xl font-bold mb-6" style={{ fontFamily: 'Poppins_700Bold' }}>Le Rythme Africain</Text>

      <View className="flex-row items-center mb-4">
        <Image source={{ uri: "https://res.cloudinary.com/dtr2wtoty/image/upload/v1782675091/sauce_gmyero.png" }} className="w-6 h-6 mr-2" resizeMode="contain" />
        <Text className="text-gray-500 dark:text-gray-400 font-medium" style={{ fontFamily: 'Poppins_500Medium' }}>Quel est l'élément principal de vos repas ?</Text>
      </View>
      <SelectableCard label="Féculents lourds (Foutou, Igname...)" value="Féculents lourds" selectedValue={data.mainCarb} onSelect={(v: string) => updateData('mainCarb', v)} />
      <SelectableCard label="Riz / Céréales" value="Riz/Céréales" selectedValue={data.mainCarb} onSelect={(v: string) => updateData('mainCarb', v)} />
      <SelectableCard label="Sauces riches (Arachide, Graine...)" value="Sauces riches" selectedValue={data.mainCarb} onSelect={(v: string) => updateData('mainCarb', v)} />
      <SelectableCard label="Protéines et Légumes" value="Protéines/Légumes" selectedValue={data.mainCarb} onSelect={(v: string) => updateData('mainCarb', v)} />

      <View className="flex-row items-center mt-6 mb-4">
        <Image source={{ uri: "https://res.cloudinary.com/dtr2wtoty/image/upload/v1782675258/inox_lnbt0p.png" }} className="w-6 h-6 mr-2" resizeMode="contain" />
        <Text className="text-gray-500 dark:text-gray-400 font-medium" style={{ fontFamily: 'Poppins_500Medium' }}>Le soir à la maison, votre dîner est généralement :</Text>
      </View>
      <SelectableCard label="Très copieux (Reste du midi)" value="Très copieux" selectedValue={data.dinnerType} onSelect={(v: string) => updateData('dinnerType', v)} />
      <SelectableCard label="Léger (Salade, Soupe...)" value="Léger" selectedValue={data.dinnerType} onSelect={(v: string) => updateData('dinnerType', v)} />
      <SelectableCard label="Je grignote" value="Je grignote" selectedValue={data.dinnerType} onSelect={(v: string) => updateData('dinnerType', v)} />
    </ScrollView>
  );

  const Step7 = () => (
    <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
      <Text className="text-black dark:text-white text-2xl font-bold mb-6" style={{ fontFamily: 'Poppins_700Bold' }}>Pratique & Famille</Text>

      <Text className="text-gray-500 dark:text-gray-400 mb-4 font-medium" style={{ fontFamily: 'Poppins_500Medium' }}>Comment manges-tu à midi ?</Text>
      <SelectableCard label="Gamelle personnelle" value="Gamelle" selectedValue={data.lunchType} onSelect={(v: string) => updateData('lunchType', v)} imageUri="https://res.cloudinary.com/dtr2wtoty/image/upload/v1781631228/La_Gamelle_ywfy3t.jpg" />
      <SelectableCard label="Bol commun familial" value="Bol commun" selectedValue={data.lunchType} onSelect={(v: string) => updateData('lunchType', v)} imageUri="https://res.cloudinary.com/dtr2wtoty/image/upload/v1781631228/Le_Bol_Commun_hb9fns.jpg" />

      <Text className="text-gray-500 dark:text-gray-400 mt-6 mb-4 font-medium" style={{ fontFamily: 'Poppins_500Medium' }}>Pour qui cuisines-tu ?</Text>
      <SelectableCard label="Juste pour moi" value="Pour soi" selectedValue={data.cookingFor} onSelect={(v: string) => updateData('cookingFor', v)} imageUri="https://res.cloudinary.com/dtr2wtoty/image/upload/v1781631228/Je_cuisine_pour_moi_seule_mfo6vw.jpg" />
      <SelectableCard label="Pour toute la famille" value="Famille" selectedValue={data.cookingFor} onSelect={(v: string) => updateData('cookingFor', v)} imageUri="https://res.cloudinary.com/dtr2wtoty/image/upload/v1781631228/Je_cuisine_pour_la_famille_qzlwke.jpg" />
    </ScrollView>
  );

  const Step8 = () => (
    <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
      <Text className="text-black dark:text-white text-2xl font-bold mb-6" style={{ fontFamily: 'Poppins_700Bold' }}>Budget Alimentaire</Text>
      <Text className="text-gray-500 dark:text-gray-400 mb-4 font-medium" style={{ fontFamily: 'Poppins_500Medium' }}>Budget Courses (Mensuel estimé)</Text>
      <View className="flex-row gap-2">
        <SelectableGridCard vertical label="Serré" value="< 50k" selectedValue={data.groceryBudget} onSelect={(v: string) => updateData('groceryBudget', v)} imageUri="https://res.cloudinary.com/dtr2wtoty/image/upload/v1781631228/A_cute__highly_detailed_3D_202606161723_odc2jk.jpg" />
        <SelectableGridCard vertical label="Famille" value="50k-100k" selectedValue={data.groceryBudget} onSelect={(v: string) => updateData('groceryBudget', v)} imageUri="https://res.cloudinary.com/dtr2wtoty/image/upload/v1781631229/A_cute__highly_detailed_3D_202606161723_1_x2pfvp.jpg" />
        <SelectableGridCard vertical label="Confort" value="> 100k" selectedValue={data.groceryBudget} onSelect={(v: string) => updateData('groceryBudget', v)} imageUri="https://res.cloudinary.com/dtr2wtoty/image/upload/v1781631228/A_cute__highly_detailed_3D_202606161723_2_ynd0wc.jpg" />
      </View>
    </ScrollView>
  );

  const Step9 = () => {
    const scale = useRef(new Animated.Value(1)).current;

    useEffect(() => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(scale, { toValue: 1.08, duration: 1500, useNativeDriver: true }),
          Animated.timing(scale, { toValue: 1, duration: 1500, useNativeDriver: true })
        ])
      ).start();

      const timer = setTimeout(() => {
        setStep(10); // Automatically move to Bilan
      }, 3000);
      return () => clearTimeout(timer);
    }, []);

    return (
      <View className="flex-1 -m-6 justify-center items-center bg-black">
        <ImageBackground
          source={{ uri: 'https://res.cloudinary.com/dtr2wtoty/image/upload/v1783285387/Young_woman_with_braids_2K_202607052028_ht2jn7.jpg' }}
          className="absolute inset-0 opacity-25"
          resizeMode="cover"
        />
        <View className="absolute inset-0 bg-black/60 dark:bg-black/80" />

        <Animated.View style={{ transform: [{ scale }] }} className="w-32 h-32 rounded-full shadow-lg shadow-[#39FF14]/50 mb-8 items-center justify-center bg-gray-900 overflow-visible">
           <Image
             source={{ uri: "https://res.cloudinary.com/dtr2wtoty/image/upload/v1784209735/557516971_10235324002253110_1070574324835198049_n_ch9we7.jpg" }}
             style={{ width: 128, height: 128, borderRadius: 64, borderWidth: 4, borderColor: '#39FF14' }}
             resizeMode="cover"
           />
        </Animated.View>

        <Text className="text-white text-xl text-center font-bold px-6" style={{ fontFamily: 'Poppins_700Bold' }}>
          Coach Rokhy personnalise votre programme d'action...
        </Text>
      </View>
    );
  };

  const Step10 = () => {
    const weightDiff = Math.abs(parseFloat(data.currentWeight || "0") - parseFloat(data.targetWeight || "0"));
    const weeksToGoal = weightDiff / 0.5;
    const targetDate = addDays(new Date(), weeksToGoal * 7);
    const dateFormatted = format(targetDate, 'MMMM yyyy', { locale: fr });
    const isGain = data.objective === 'Prise de masse';
    const actionText = isGain ? '+' : '-';

    const h = parseFloat(data.height || "1") / 100;
    const w = parseFloat(data.currentWeight || "0");
    const bmi = h > 0 ? (w / (h * h)).toFixed(1) : '0';
    let bmiStatus = "Normal";
    if (parseFloat(bmi) > 25) bmiStatus = "Surpoids";
    if (parseFloat(bmi) > 30) bmiStatus = "Obésité";
    if (parseFloat(bmi) < 18.5) bmiStatus = "Sous-poids";

    const bmiVal = parseFloat(bmi);
    const clampedBmi = Math.min(Math.max(bmiVal, 15), 35);
    const bmiAngle = ((clampedBmi - 15) / 20) * 180;
    const strokeDashoffset = 125 - (125 * bmiAngle / 180);

    const tdee = calculateDailyCalories(data);

    // Staggered native animations
    const card1Anim = useRef(new Animated.Value(0)).current;
    const card2Anim = useRef(new Animated.Value(0)).current;
    const card3Anim = useRef(new Animated.Value(0)).current;
    const card4Anim = useRef(new Animated.Value(0)).current;

    const scale1 = useRef(new Animated.Value(0.8)).current;
    const scale2 = useRef(new Animated.Value(0.8)).current;
    const scale3 = useRef(new Animated.Value(0.8)).current;
    const scale4 = useRef(new Animated.Value(0.8)).current;

    useEffect(() => {
      Animated.stagger(150, [
        Animated.parallel([
          Animated.timing(card1Anim, { toValue: 1, duration: 400, useNativeDriver: true }),
          Animated.timing(scale1, { toValue: 1, duration: 400, useNativeDriver: true })
        ]),
        Animated.parallel([
          Animated.timing(card2Anim, { toValue: 1, duration: 400, useNativeDriver: true }),
          Animated.timing(scale2, { toValue: 1, duration: 400, useNativeDriver: true })
        ]),
        Animated.parallel([
          Animated.timing(card3Anim, { toValue: 1, duration: 400, useNativeDriver: true }),
          Animated.timing(scale3, { toValue: 1, duration: 400, useNativeDriver: true })
        ]),
        Animated.parallel([
          Animated.timing(card4Anim, { toValue: 1, duration: 400, useNativeDriver: true }),
          Animated.timing(scale4, { toValue: 1, duration: 400, useNativeDriver: true })
        ])
      ]).start();
    }, []);

    const style1 = { opacity: card1Anim, transform: [{ scale: scale1 }] };
    const style2 = { opacity: card2Anim, transform: [{ scale: scale2 }] };
    const style3 = { opacity: card3Anim, transform: [{ scale: scale3 }] };
    const style4 = { opacity: card4Anim, transform: [{ scale: scale4 }] };

    return (
      <View className="flex-1 bg-zinc-50 dark:bg-zinc-900 -m-6 p-6 justify-center">
        <Text className="text-black dark:text-white text-2xl font-bold mb-6 text-center mt-4" style={{ fontFamily: 'Poppins_700Bold' }}>Vos objectifs sont validés</Text>

        <View className="flex-row flex-wrap justify-between gap-y-4">
          <Animated.View style={[style1, { width: '48%' }]} className="bg-white dark:bg-black rounded-[2rem] p-4 items-center border border-gray-200 dark:border-gray-800 shadow-sm relative overflow-hidden">
            <View className="w-16 h-16 rounded-full border-4 border-[#39FF14] items-center justify-center mb-2">
              <Text className="text-black dark:text-white text-lg font-bold" style={{ fontFamily: 'Poppins_700Bold' }}>{bmi}</Text>
            </View>
            <Text className="text-gray-500 text-[10px] uppercase font-bold text-center" style={{ fontFamily: 'Poppins_700Bold' }}>IMC ({bmiStatus})</Text>
          </Animated.View>

          <Animated.View style={[style2, { width: '48%' }]} className="bg-white dark:bg-black rounded-[2rem] p-4 items-center border border-gray-200 dark:border-gray-800 shadow-sm">
            <Image source={{uri: "https://res.cloudinary.com/dtr2wtoty/image/upload/v1781443964/A_cute__highly_detailed_3D_202606141332_ggiubt.jpg"}} className="w-12 h-12 rounded-full mb-2" />
            <Text className="text-gray-500 text-[10px] uppercase font-bold text-center" style={{ fontFamily: 'Poppins_700Bold' }}>Apport Énergétique</Text>
            <Text className="text-black dark:text-white text-lg font-bold" style={{ fontFamily: 'Poppins_700Bold' }}>{tdee} kcal</Text>
            {tdee === 1200 && <Text className="text-red-500 text-[8px] text-center mt-1 font-bold">Plancher sécurité</Text>}
          </Animated.View>

          <Animated.View style={[style3, { width: '48%' }]} className="bg-white dark:bg-black rounded-[2rem] p-4 items-center border border-gray-200 dark:border-gray-800 shadow-sm">
            <Image source={{uri: "https://res.cloudinary.com/dtr2wtoty/image/upload/v1781458367/A_cute__highly_detailed_3D_202606141732_kn3ujk.jpg"}} className="w-12 h-12 rounded-full mb-2" />
            <Text className="text-gray-500 text-[10px] uppercase font-bold text-center" style={{ fontFamily: 'Poppins_700Bold' }}>Poids Cible</Text>
            <Text className="text-black dark:text-white text-lg font-bold" style={{ fontFamily: 'Poppins_700Bold' }}>{data.targetWeight} kg</Text>
            <Text className="text-gray-500 text-[9px] font-bold mt-1 text-center">{actionText}{weightDiff} kg à {isGain ? 'prendre' : 'éliminer'}</Text>
          </Animated.View>

          <Animated.View style={[style4, { width: '48%' }]} className="bg-white dark:bg-black rounded-[2rem] p-4 items-center border border-gray-200 dark:border-gray-800 shadow-sm">
            <Image source={{uri: "https://res.cloudinary.com/dtr2wtoty/image/upload/v1781535959/A_cute__highly_detailed_3D_202606151505_1_uvgqf0.jpg"}} className="w-12 h-12 rounded-full mb-2" />
            <Text className="text-gray-500 text-[10px] uppercase font-bold text-center" style={{ fontFamily: 'Poppins_700Bold' }}>Date Prévue</Text>
            <Text className="text-black dark:text-white text-lg font-bold capitalize text-center" style={{ fontFamily: 'Poppins_700Bold' }}>{dateFormatted}</Text>
          </Animated.View>
        </View>

        <TouchableOpacity
          className="bg-black py-4 rounded-full items-center mt-10 shadow-[0_0_15px_rgba(0,0,0,0.3)]"
          onPress={() => setStep(11)}
        >
          <Text className="font-bold text-lg uppercase text-[#39FF14]" style={{ fontFamily: 'Poppins_700Bold' }}>
            Valider mes objectifs
          </Text>
        </TouchableOpacity>
      </View>
    );
  };


  const Step11 = () => {
    return (
      <View className="flex-1 bg-zinc-900 -m-6 p-6 justify-center">
        <Text className="text-white text-3xl font-bold mb-2 text-center" style={{ fontFamily: 'Poppins_700Bold' }}>Création de Compte</Text>
        <Text className="text-gray-400 mb-8 text-center" style={{ fontFamily: 'Poppins_500Medium' }}>Vos accès automatiques seront configurés avec ces informations.</Text>

        <View className="mb-4">
          <Text className="text-gray-400 mb-2 font-medium" style={{ fontFamily: 'Poppins_500Medium' }}>Nom Complet</Text>
          <TextInput
            value={data.firstName}
            onChangeText={(t) => updateData('firstName', t)}
            placeholder="Ex: Amina Diop"
            placeholderTextColor="#4B5563"
            className="text-white text-xl bg-black rounded-2xl p-4 font-bold border border-zinc-800 focus:border-[#39FF14]"
            style={{ fontFamily: 'Poppins_700Bold' }}
          />
        </View>

        <View className="mb-8">
          <Text className="text-gray-400 mb-2 font-medium" style={{ fontFamily: 'Poppins_500Medium' }}>Numéro WhatsApp</Text>
          <TextInput
            value={data.phone}
            onChangeText={(t) => updateData('phone', t)}
            placeholder="+221 77 000 00 00"
            placeholderTextColor="#4B5563"
            keyboardType="phone-pad"
            className="text-white text-xl bg-black rounded-2xl p-4 font-bold border border-zinc-800 focus:border-[#39FF14]"
            style={{ fontFamily: 'Poppins_700Bold' }}
          />
        </View>

        <TouchableOpacity
          className={`py-4 rounded-full items-center shadow-[0_0_15px_rgba(57,255,20,0.5)] ${data.firstName && data.phone && !isSubmitting ? 'bg-[#39FF14]' : 'bg-gray-800'}`}
          onPress={handleSubmit}
          disabled={!(data.firstName && data.phone) || isSubmitting}
        >
          <Text className={`font-bold text-lg uppercase ${data.firstName && data.phone && !isSubmitting ? 'text-black' : 'text-gray-500'}`} style={{ fontFamily: 'Poppins_700Bold' }}>
            {isSubmitting ? "Création..." : "CRÉER MON COMPTE & DÉMARRER"}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  const Step12 = () => {
    useEffect(() => {
      const timer = setTimeout(() => {
        router.replace('/(tabs)');
      }, 3000);
      return () => clearTimeout(timer);
    }, []);

    return (
      <View className="flex-1 bg-white -m-6 p-6 justify-center items-center" style={{ borderTopWidth: 8, borderTopColor: '#39FF14' }}>
        <Image source={{ uri: "https://res.cloudinary.com/dtr2wtoty/image/upload/v1781224243/logo_dore_um5fsr.png" }} className="w-32 h-12 mb-8" resizeMode="contain" />

        <Text className="text-black text-3xl font-bold text-center mb-8" style={{ fontFamily: 'Poppins_700Bold' }}>
          Bienvenue <Text className="text-[#39FF14]">{data.firstName}</Text> !
        </Text>

        <View className="bg-black rounded-2xl p-6 w-full mb-6">
          <View className="flex-row items-center justify-center mb-4">
            <CheckCircle2 color="white" size={32} />
          </View>
          <Text className="text-white text-center mb-4" style={{ fontFamily: 'Poppins_500Medium' }}>
            Numéro WhatsApp : <Text className="font-bold">{data.phone}</Text>
          </Text>
          <View className="flex-row items-center justify-center">
            <Text className="text-white text-center mr-2" style={{ fontFamily: 'Poppins_500Medium' }}>Mot de passe provisoire :</Text>
            <View className="bg-[#39FF14] rounded-lg p-2">
              <Text className="text-black font-bold" style={{ fontFamily: 'Poppins_700Bold' }}>{(data.phone || "").replace(/\s+/g, '').slice(-8).padStart(8, '0')}</Text>
            </View>
          </View>
        </View>

        <View className="flex-row items-center justify-center mb-10">
          <Image source={{ uri: "https://res.cloudinary.com/dtr2wtoty/image/upload/v1781536233/A_cute__highly_detailed_3D_202606151510_uj9z5c.jpg" }} className="w-8 h-8 rounded-full mr-2" />
          <Text className="text-gray-500 text-xs text-center" style={{ fontFamily: 'Poppins_400Regular' }}>
            Vous pourrez modifier ce mot de passe plus tard.
          </Text>
        </View>

        <TouchableOpacity
          className="bg-[#39FF14] w-full py-4 rounded-full items-center shadow-[0_0_15px_rgba(57,255,20,0.5)]"
          onPress={() => router.replace('/(tabs)')}
        >
          <Text className="font-bold text-lg uppercase text-black" style={{ fontFamily: 'Poppins_700Bold' }}>
            🚀 ACCÉDER À MON TABLEAU DE BORD
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

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

    const backendProcess = async () => {
      try {
        const cleanPhone = data.phone.replace(/\s+/g, '');
        const authEmail = cleanPhone.includes('@') ? cleanPhone : `${cleanPhone}@clients.onyxcrm.com`;
        const defaultPassword = cleanPhone.slice(-8).padStart(8, '0');

        let userId = null;

        // ÉTAPE A : Tentative de connexion (Si le compte existe déjà)
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: authEmail,
          password: password || defaultPassword,
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
              password: password || defaultPassword,
              full_name: data.firstName,
              phone: cleanPhone.startsWith('+221') ? cleanPhone : `+221${cleanPhone}`,
              role: 'client',
              saas: "Nutrition à l'Africaine",
              type: 'Client',
              status: 'Compte Créé',
              password_temp: password || defaultPassword
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

          await supabase.from('clients').upsert([{
            id: userId,
            full_name: data.firstName,
            phone: cleanPhone,
            created_at: new Date().toISOString()
          }], { onConflict: 'id' });
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

    const success = await backendProcess();

    if (success) {
      setStep(12);
      setIsSubmitting(false);
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
      case 3: return <Step3 />;
      case 4: return <Step4 />;
      case 5: return <Step5 />;
      case 6: return <Step6 />;
      case 7: return <Step7 />;
      case 8: return <Step8 />;
      case 9: return <Step9 />;
      case 10: return <Step10 />;
      case 11: return <Step11 />;
      case 12: return <Step12 />;
      default: return <Step1 />;
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-zinc-900" edges={['top', 'bottom']}>
      <View className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-[#39FF14]/10 blur-3xl" pointerEvents="none" />
      <View className="absolute top-1/2 -left-20 w-72 h-72 rounded-full bg-[#39FF14]/5 blur-3xl" pointerEvents="none" />
      <View className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-[#39FF14]/10 blur-3xl" pointerEvents="none" />
      <View className="absolute top-1/2 -left-20 w-72 h-72 rounded-full bg-[#39FF14]/5 blur-3xl" pointerEvents="none" />


      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} className="flex-1">
        {/* Header */}
        {step < 10 && (
          <View className="px-6 pt-4 pb-2 bg-white dark:bg-zinc-900 z-10 relative">
            <Image source={{ uri: "https://res.cloudinary.com/dtr2wtoty/image/upload/v1781224243/logo_dore_um5fsr.png" }} className="w-24 h-8 absolute top-4 left-1/2 -ml-12" resizeMode="contain" />
            <View className="flex-row items-center justify-between mb-4">
              <View className="flex-row items-center">
                <TouchableOpacity onPress={step > 1 ? prevStep : () => router.replace('/')} className="mr-4 p-2 bg-gray-100 dark:bg-gray-900 rounded-full border border-gray-200 dark:border-gray-800 z-20">
                  <ArrowLeft color={isDark ? "white" : "black"} size={20} />
                </TouchableOpacity>
                <Text className="text-black dark:text-white text-lg font-bold" style={{ fontFamily: 'Poppins_700Bold' }}>Étape {step} / 9</Text>
              </View>
              <TouchableOpacity onPress={toggleColorScheme} className="p-2 bg-gray-100 dark:bg-gray-900 rounded-full border border-gray-200 dark:border-gray-800 z-20">
                {isDark ? <Sun color="white" size={20} /> : <Moon color="black" size={20} />}
              </TouchableOpacity>
            </View>
            {renderProgressBar()}
          </View>
        )}

        {/* Content */}
        <ScrollView className="flex-1 px-6 pt-4" contentContainerStyle={{ paddingBottom: step < 10 ? 120 : 20 }}>
          {renderStep()}
        </ScrollView>

        {/* Sticky Footer */}
        {step < 10 && (
          <View className="absolute bottom-0 left-0 right-0 p-4 bg-white/90 dark:bg-zinc-900/90 border-t border-zinc-100 dark:border-zinc-800" >
            {step === 9 ? (
              <TouchableOpacity
                className={`w-full py-4 rounded-full items-center ${data.firstName && data.phone && !isSubmitting ? 'bg-[#39FF14] shadow-[0_0_15px_rgba(57,255,20,0.5)]' : 'bg-gray-200 dark:bg-gray-800'}`}
                onPress={() => {
                   setStep(10);
                }}
                disabled={!(data.firstName && data.phone) || isSubmitting}
              >
                <Text className={`font-bold text-lg uppercase ${data.firstName && data.phone ? 'text-black' : 'text-gray-500'}`} style={{ fontFamily: 'Poppins_700Bold' }}>
                  Générer mon programme
                </Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                className={`w-full py-4 rounded-full items-center ${(step === 1 && data.gender && data.age) || (step === 2 && data.objective && data.height && data.currentWeight && data.targetWeight) || (step === 3 && data.sleep && data.activityLevel) || (step === 4 && data.health && (data.gender === 'Homme' || data.womenCondition)) || (step === 5 && data.hydration && data.pastDiets && data.cookingFats) || (step === 6 && data.mainCarb && data.dinnerType) || (step === 7 && data.lunchType && data.cookingFor) || (step === 8 && data.groceryBudget) ? 'bg-black dark:bg-white' : 'bg-gray-200 dark:bg-gray-800'}`}
                onPress={nextStep}
                disabled={!((step === 1 && data.gender && data.age) || (step === 2 && data.objective && data.height && data.currentWeight && data.targetWeight) || (step === 3 && data.sleep && data.activityLevel) || (step === 4 && data.health && (data.gender === 'Homme' || data.womenCondition)) || (step === 5 && data.hydration && data.pastDiets && data.cookingFats) || (step === 6 && data.mainCarb && data.dinnerType) || (step === 7 && data.lunchType && data.cookingFor) || (step === 8 && data.groceryBudget))}
              >
                <Text className={`font-bold text-lg uppercase ${((step === 1 && data.gender && data.age) || (step === 2 && data.objective && data.height && data.currentWeight && data.targetWeight) || (step === 3 && data.sleep && data.activityLevel) || (step === 4 && data.health && (data.gender === 'Homme' || data.womenCondition)) || (step === 5 && data.hydration && data.pastDiets && data.cookingFats) || (step === 6 && data.mainCarb && data.dinnerType) || (step === 7 && data.lunchType && data.cookingFor) || (step === 8 && data.groceryBudget)) ? (isDark ? 'text-[#39FF14]' : 'text-white') : 'text-gray-500 dark:text-gray-400'}`} style={{ fontFamily: 'Poppins_700Bold' }}>
                  Continuer
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </KeyboardAvoidingView>


    </SafeAreaView>
  );
}
