import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { supabase } from '../../../lib/supabase';
import { ArrowLeft } from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import { useColorScheme } from 'nativewind';

type MarketingArticle = {
  id: string;
  title: string;
  category: string;
  image_url: string;
  created_at: string;
  read_time?: string;
};

export default function BlogHomeScreen() {
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [articles, setArticles] = useState<MarketingArticle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchArticles();
  }, []);

  const fetchArticles = async () => {
    try {
      const { data, error } = await supabase
        .from('marketing_articles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setArticles(data || []);
    } catch (e) {
      console.error('Error fetching articles', e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 bg-[#FAFAFA] dark:bg-[#0A0A0A] justify-center items-center">
        <ActivityIndicator size="large" color="#39FF14" />
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-[#FAFAFA] dark:bg-[#0A0A0A]">
      {/* Glassmorphism Header */}
      <View className="absolute top-0 left-0 right-0 z-10 pt-12 px-5 pb-4">
        <BlurView
          intensity={80}
          tint={isDark ? 'dark' : 'light'}
          className="rounded-full overflow-hidden border border-white/20"
        >
          <View className="flex-row items-center px-4 py-2">
            <TouchableOpacity onPress={() => router.push('/(tabs)')} className="p-2 -ml-2">
              <ArrowLeft size={20} color={isDark ? '#FFF' : '#000'} />
            </TouchableOpacity>
            <Text className="text-black dark:text-white font-bold text-lg ml-2" style={{ fontFamily: 'Poppins_700Bold' }}>
              Le Mag' NutriAfro
            </Text>
          </View>
        </BlurView>
      </View>

      <ScrollView className="flex-1 px-5 pt-32 pb-32">
        <Text className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase mb-6" style={{ fontFamily: 'Poppins_700Bold' }}>
          TOUS LES ARTICLES
        </Text>

        <View className="space-y-4">
          {articles.map((article) => (
            <TouchableOpacity
              key={article.id}
              activeOpacity={0.9}
              onPress={() => router.push(`/(tabs)/blog/${article.id}`)}
              className="bg-white dark:bg-[#151515] rounded-3xl overflow-hidden border border-gray-200 dark:border-white/10"
            >
              <Image
                source={{ uri: article.image_url || 'https://res.cloudinary.com/dtr2wtoty/image/upload/v1781222471/Bouillie_de_mil_r2zihq.jpg' }}
                className="w-full h-40"
                resizeMode="cover"
              />
              <View className="p-4">
                <View className="self-start bg-black dark:bg-white/10 px-3 py-1 rounded-full mb-2">
                  <Text className="text-white dark:text-[#39FF14] text-[10px] font-bold uppercase" style={{ fontFamily: 'Poppins_700Bold' }}>
                    {article.category || 'Conseils'}
                  </Text>
                </View>
                <Text className="text-black dark:text-white text-lg font-bold mb-2 leading-tight" style={{ fontFamily: 'Poppins_700Bold' }}>
                  {article.title}
                </Text>
                <View className="flex-row items-center justify-between mt-2">
                  <Text className="text-gray-400 text-xs" style={{ fontFamily: 'Poppins_400Regular' }}>
                    {new Date(article.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </Text>
                  <Text className="text-[#39FF14] text-xs font-bold uppercase">Lire &rarr;</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}