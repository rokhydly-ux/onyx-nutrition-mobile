import { View, Text } from 'react-native';

export default function MyDayScreen() {
  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-zinc-950 font-sans">
      <ScrollView className="flex-1 px-4 pt-12 pb-24" showsVerticalScrollIndicator={false}>

        {/* 1. EN-TÊTE DE PAGE */}
        <View className="mb-6">
          <TouchableOpacity onPress={() => router.back()} className="flex-row items-center mb-4">
            <ChevronLeft size={20} color={isDark ? '#FFF' : '#000'} />
            <Text className="text-black dark:text-white text-sm font-medium ml-1">Retour à l'accueil</Text>
          </TouchableOpacity>

          <View className="flex-row items-start justify-between">
            <View className="flex-1">
              <View className="flex-row items-center justify-between mb-4">
                <View className="flex-row items-center">
                  <Image
                    source={{ uri: 'https://res.cloudinary.com/dtr2wtoty/image/upload/v1781535958/A_cute__highly_detailed_3D_202606151505_2_akqmx4.jpg' }}
                    className="w-10 h-10 rounded-xl mr-3"
                  />
                  <Text className="text-black dark:text-white text-3xl font-black tracking-tight">MON JOUR</Text>
                </View>
                <Image source={{ uri: 'https://res.cloudinary.com/dtr2wtoty/image/upload/v1781224243/logo_dore_um5fsr.png' }} className="h-8 w-24" resizeMode="contain" />
              </View>
              <Text className="text-gray-500 dark:text-gray-400 text-xs mt-1 pr-4">Enregistrez vos repas, suivez votre eau et complétez votre bilan de la journée.</Text>
            </View>

            <View className="bg-zinc-100 dark:bg-zinc-900 rounded-full p-1 flex-row mt-2">
              <TouchableOpacity
                onPress={() => setMode('guided')}
                className={`px-3 py-1.5 rounded-full ${mode === 'guided' ? 'bg-black dark:bg-[#39FF14]' : 'bg-transparent'}`}>
                <Text className={`text-xs font-bold ${mode === 'guided' ? (isDark ? 'text-black' : 'text-white') : 'text-gray-500 dark:text-gray-400'}`}>Mode Guidé</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setMode('free')}
                className={`px-3 py-1.5 rounded-full ${mode === 'free' ? 'bg-black dark:bg-[#39FF14]' : 'bg-transparent'}`}>
                <Text className={`text-xs font-bold ${mode === 'free' ? (isDark ? 'text-black' : 'text-white') : 'text-gray-500 dark:text-gray-400'}`}>Mode Libre</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* 2. WIDGET CALORIES & MACROS */}
        <View className="bg-white dark:bg-zinc-900 rounded-[2rem] p-6 mb-6 shadow-sm border border-zinc-100 dark:border-zinc-800">
          <View className="items-center justify-center mb-6 mt-2">
             <CircularProgress
                size={180}
                strokeWidth={14}
                progress={caloriesProgress}
                color="#39FF14"
                backgroundColor={isDark ? 'rgba(255,255,255,0.1)' : '#E5E7EB'}
              >
                <View className="items-center justify-center">
                  <Text className="text-black dark:text-white text-4xl font-black">{Math.round(dailyStats.calories_consumed)}</Text>
                  <Text className="text-gray-400 text-xs font-bold uppercase mt-1">/ {profile.calories_goal} KCAL</Text>
                </View>
              </CircularProgress>
          </View>

          <View className="w-full">
            <MacroBar label="Protéines" current={dailyStats.protein_consumed} max={profile.protein_goal} color="#3B82F6" />
            <MacroBar label="Glucides" current={dailyStats.carbs_consumed} max={profile.carbs_goal} color="#EAB308" />
            <MacroBar label="Lipides" current={dailyStats.fats_consumed} max={profile.fats_goal} color="#EF4444" />
          </View>
        </View>

        {/* 3. FLUX DES REPAS DU JOUR */}
        <View className="mb-6">
            <Text className="text-black dark:text-white text-lg font-bold mb-4">Repas du jour</Text>
            {meals.map(meal => (
              <View key={meal.id} className="rounded-2xl overflow-hidden mb-4 bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800">
                <Image source={{ uri: meal.img }} className="w-full h-32 opacity-90" />
                <View className="p-4">
                  <Text className="text-gray-500 dark:text-gray-400 text-[10px] font-bold uppercase mb-1">{meal.type}</Text>
                  <Text className="text-black dark:text-white text-base font-bold mb-2">{meal.name}</Text>
                  <View className="flex-row items-center justify-between mt-2">
                    <Text className="text-gray-500 dark:text-gray-400 text-xs font-medium">
                      {meal.calories} kcal • {meal.p}g • {meal.c}g • {meal.f}g
                    </Text>
                    <TouchableOpacity
                      onPress={() => handleLogMeal(meal)}
                      activeOpacity={0.7}
                      className="bg-[#39FF14] px-4 py-2 rounded-xl"
                    >
                      <Text className="text-black text-xs font-bold">+ AJOUTER MON REPAS</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}

            {mode === 'free' && (
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => console.log('Open manual entry modal')}
                className="border-2 border-dashed border-[#39FF14] p-4 rounded-2xl items-center mt-4">
                <Text className="text-[#39FF14] text-xs font-bold uppercase">+ AJOUTER UN ALIMENT / REPAS LIBRE</Text>
              </TouchableOpacity>
            )}
          </View>

        {/* 4. LES 3 WIDGETS DU BAS */}
        <View className="space-y-4 mb-24">

          {/* A. Widget Hydratation */}
          <TouchableOpacity activeOpacity={0.9} className="rounded-[2rem] overflow-hidden bg-zinc-900">
            <ImageBackground
              source={{ uri: 'https://res.cloudinary.com/dtr2wtoty/image/upload/v1783099524/Woman_drinking_clear_water_2K_202607031724_wuqqco.jpg' }}
              style={{ padding: 24 }}
              imageStyle={{ opacity: 0.5 }}
            >
              <View className="flex-row justify-between items-center mb-2">
                <Text className="text-white text-sm font-bold uppercase">Hydratation</Text>
                <Text className="text-white text-lg font-black">{dailyStats.water_glasses} <Text className="text-gray-300 text-sm">/ 8 verres</Text></Text>
              </View>
              <Text className="text-gray-300 text-xs mb-6">L'eau booste votre métabolisme de 30% en 10 min</Text>

              <View className="flex-row flex-wrap justify-between gap-y-4 px-2">
                 {Array(8).fill(0).map((_, idx) => (
                   <TouchableOpacity
                     key={idx}
                     hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                     onPress={() => handleUpdateWater(idx + 1)}
                   >
                     <Image
                       source={{ uri: 'https://res.cloudinary.com/dtr2wtoty/image/upload/v1782675042/2_maewiy.png' }}
                       style={{ width: 18, height: 24, opacity: (idx + 1) <= dailyStats.water_glasses ? 1 : 0.4 }}
                       resizeMode="contain"
                     />
                   </TouchableOpacity>
                 ))}
              </View>
            </ImageBackground>
          </TouchableOpacity>

          {/* B. Widget Refaire mon diagnostic */}
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => router.push('/diagnostic')}
            className="rounded-[2rem] overflow-hidden mt-4 bg-zinc-900 h-32">
            <ImageBackground
              source={{ uri: 'https://res.cloudinary.com/dtr2wtoty/image/upload/v1783002400/A_high-end__photorealistic_commercial_shot_202607021426_vutjqi.jpg' }}
              style={{ flex: 1, padding: 24, justifyContent: 'center', alignItems: 'center' }}
              imageStyle={{ opacity: 0.4 }}
            >
              <View className="w-10 h-10 rounded-full bg-[#39FF14]/20 items-center justify-center mb-2 animate-pulse">
                <View className="w-4 h-4 rounded-full bg-[#39FF14]" />
              </View>
              <Text className="text-white text-sm font-bold uppercase tracking-widest">REFAIRE MON DIAGNOSTIC</Text>
              <Text className="text-gray-300 text-xs mt-1">Ajuster mes objectifs</Text>
            </ImageBackground>
          </TouchableOpacity>

          {/* C. Widget BILAN DU JOUR */}
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => console.log('Open Daily Report Modal')}
            className="bg-[#39FF14] rounded-[2rem] p-6 items-center justify-center mt-4 shadow-lg shadow-[#39FF14]/20 mb-10">
            <CheckCircle size={32} color="black" className="mb-2" />
            <Text className="text-black text-xl font-black uppercase">BILAN DU JOUR</Text>
            <Text className="text-black/70 text-xs font-bold mt-1">Clôturez pour gagner de l'XP</Text>
          </TouchableOpacity>


          {/* D. LA BOUTIQUE ONYX */}
          <View className="mt-8 mb-4">
            <View className="mb-4">
              <Text className="text-black dark:text-white text-lg font-bold uppercase tracking-wide">LE MARCHÉ ONYX • VOS ALLIÉS MINCEUR</Text>
              <Text className="text-gray-500 dark:text-gray-400 text-xs mt-1">Sélection 100% naturelle personnalisée selon votre métabolisme</Text>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 16 }}>
              {(products.length > 0 ? products : [
                { id: '1', name: 'Thé Détox Minceur', image_url: 'https://res.cloudinary.com/dtr2wtoty/image/upload/v1781224243/logo_dore_um5fsr.png', price: 15000 },
                { id: '2', name: 'Graines de Chia Bio', image_url: 'https://res.cloudinary.com/dtr2wtoty/image/upload/v1781224243/logo_dore_um5fsr.png', price: 8000 },
                { id: '3', name: 'Infusion Sommeil', image_url: 'https://res.cloudinary.com/dtr2wtoty/image/upload/v1781224243/logo_dore_um5fsr.png', price: 12000 }
              ]).map(product => (
                <Pressable
                  key={product.id}
                  className="w-44 bg-white dark:bg-zinc-900 rounded-3xl p-3 border border-zinc-100 dark:border-zinc-800 flex-col justify-between shadow-sm"
                >
                  <Image source={{ uri: product.image_url || product.image || product.img }} className="w-full h-32 resize-contain rounded-2xl mb-2" />

                  <Text className="font-poppins-bold text-sm text-zinc-900 dark:text-white mb-1" numberOfLines={1}>
                    {product.nom || product.name}
                  </Text>

                  <View className="flex-row items-center justify-between mt-1">
                    <Text className="font-poppins-bold text-xs text-[#39FF14]">
                      {Number(product?.prix || product?.price || product?.prix_standard || 0).toLocaleString('fr-FR')} FCFA
                    </Text>
                    <TouchableOpacity className="bg-black dark:bg-[#39FF14] w-7 h-7 rounded-full items-center justify-center">
                      <Text className="text-white dark:text-black font-bold">+</Text>
                    </TouchableOpacity>
                  </View>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}