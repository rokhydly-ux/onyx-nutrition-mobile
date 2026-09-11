import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, ActivityIndicator, ImageBackground, TextInput, KeyboardAvoidingView, Platform, Animated, useWindowDimensions } from 'react-native';
import RenderHtml from 'react-native-render-html';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '../../../lib/supabase';
import { ArrowLeft, Clock, Eye, MessageCircle, Send } from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import { useColorScheme } from 'nativewind';

type MarketingArticle = {
  id: string;
  title: string;
  category: string;
  image_url: string;
  created_at: string;
  read_time?: string;
  view_count?: number;
  content?: string;
  author_name?: string;
};

type Comment = {
  id: string;
  content: string;
  created_at: string;
  clients?: {
    full_name: string;
    avatar_url: string;
  };
};

export default function BlogArticleScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const scrollY = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const { width } = useWindowDimensions();

  const [article, setArticle] = useState<MarketingArticle | null>(null);
  const [similarArticles, setSimilarArticles] = useState<MarketingArticle[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchArticleData();
      checkUser();
    }
  }, [id]);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      setUserId(session.user.id);
    }
  };

  const fetchArticleData = async () => {
    try {
      setLoading(true);
      // Fetch current article
      const { data: articleData, error: articleError } = await supabase
        .from('marketing_articles')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (articleError) throw articleError;
      setArticle(articleData);

      // Start Fade-in animation
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }).start();

      // Increment view count (if view_count column exists - using a raw RPC or just updating directly if RLS allows)
      // For this demo, we assume we just read the view_count, but ideally, you call an RPC `increment_view_count(article_id)`
      // To prevent RLS issues with standard UPDATE from the client, we skip the update logic here unless an RPC is available.

      // Fetch similar articles
      if (articleData?.category) {
        const { data: similarData } = await supabase
          .from('marketing_articles')
          .select('*')
          .eq('category', articleData.category)
          .neq('id', id)
          .limit(3);
        setSimilarArticles(similarData || []);
      }

      // Fetch comments
      fetchComments();

    } catch (e) {
      console.error('Error fetching article', e);
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    try {
      const { data, error } = await supabase
        .from('marketing_article_comments')
        .select('*, clients(full_name, avatar_url)')
        .eq('article_id', id)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setComments(data as any);
      }
    } catch (e) {
      console.log('Error fetching comments', e);
    }
  };

  const handlePostComment = async () => {
    if (!newComment.trim() || !userId) return;

    setSubmittingComment(true);
    try {
      const { error } = await supabase
        .from('marketing_article_comments')
        .insert({
          article_id: id,
          client_id: userId,
          content: newComment.trim()
        });

      if (!error) {
        setNewComment('');
        fetchComments(); // Refresh list
      } else {
         console.error("Error posting comment", error);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmittingComment(false);
    }
  };

  if (loading || !article) {
    return (
      <View className="flex-1 bg-[#FAFAFA] dark:bg-[#0A0A0A] justify-center items-center">
        <ActivityIndicator size="large" color="#39FF14" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <View className="flex-1 bg-[#FAFAFA] dark:bg-[#0A0A0A]">

        {/* Fixed Glassmorphism Back Button */}
        <SafeAreaView className="absolute top-0 left-0 right-0 z-20" edges={['top']} pointerEvents="box-none">
           <View className="px-5 pt-2 flex-row justify-between items-center" pointerEvents="box-none">
              <TouchableOpacity onPress={() => router.push('/(tabs)/blog' as any)} className="overflow-hidden rounded-full">
                <BlurView
                  intensity={80}
                  tint={isDark ? 'dark' : 'light'}
                  className="px-4 py-2 flex-row items-center border border-white/20 rounded-full"
                >
                  <ArrowLeft size={16} color={isDark ? '#FFF' : '#000'} />
                  <Text className="text-black dark:text-white font-bold text-xs ml-2 uppercase" style={{ fontFamily: 'Poppins_700Bold' }}>
                    Accueil Blog
                  </Text>
                </BlurView>
              </TouchableOpacity>
           </View>
        </SafeAreaView>

        <Animated.ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingBottom: 200 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: true }
          )}
          scrollEventThrottle={16}
        >

          {/* Parallax Hero Image */}
          <Animated.View style={{
            width: '100%',
            height: 250,
            transform: [
              {
                translateY: scrollY.interpolate({
                  inputRange: [-250, 0, 250],
                  outputRange: [-125, 0, 125], // Move at half speed for parallax
                  extrapolate: 'clamp',
                }),
              },
            ],
          }}>
            <ImageBackground
              source={{ uri: article.image_url || 'https://res.cloudinary.com/dtr2wtoty/image/upload/v1781222471/Bouillie_de_mil_r2zihq.jpg' }}
              style={{ width: '100%', height: '100%', justifyContent: 'flex-end' }}
            >
              {/* Gradient Overlay */}
              <View className="absolute inset-0 bg-black/30" />
            </ImageBackground>
          </Animated.View>

          {/* Title and Category (Moved outside image to prevent overlap) */}
          <View className="px-5 pt-6 pb-2 bg-[#FAFAFA] dark:bg-[#0A0A0A]">
            <View className="self-start bg-[#39FF14] px-3 py-1 rounded-full mb-3">
              <Text className="text-black text-[10px] font-bold uppercase" style={{ fontFamily: 'Poppins_700Bold' }}>
                {article.category || 'Conseils'}
              </Text>
            </View>
            <Text className="text-black dark:text-white text-2xl font-bold leading-tight mb-4" style={{ fontFamily: 'Poppins_700Bold' }}>
              {article.title}
            </Text>
          </View>

          {/* Meta Data Bar */}
          <View className="px-5">
             <View className="bg-white dark:bg-[#151515] p-4 rounded-3xl flex-row justify-between items-center border border-gray-200 dark:border-white/10 shadow-sm">
                <View className="flex-row items-center">
                   <View className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-800 items-center justify-center mr-2 border border-gray-300 dark:border-gray-700 overflow-hidden">
                     {article.author_name ? (
                        <Text className="text-gray-500 dark:text-gray-400 text-[10px] font-bold uppercase">{article.author_name.substring(0, 2)}</Text>
                     ) : (
                        <Text className="text-gray-500 dark:text-gray-400 text-[10px] font-bold uppercase">LR</Text>
                     )}
                   </View>
                   <View>
                     <Text className="text-black dark:text-white text-xs font-bold" style={{ fontFamily: 'Poppins_700Bold' }}>
                       {article.author_name || 'La Rédaction'}
                     </Text>
                     <Text className="text-gray-400 text-[10px]" style={{ fontFamily: 'Poppins_400Regular' }}>
                        {new Date(article.created_at).toLocaleDateString('fr-FR')}
                     </Text>
                   </View>
                </View>

                <View className="flex-row items-center space-x-3">
                   <View className="flex-row items-center">
                     <Clock size={12} color={isDark ? '#9CA3AF' : '#6B7280'} />
                     <Text className="text-gray-500 dark:text-gray-400 text-[10px] ml-1 font-bold">{article.read_time || '3'} min</Text>
                   </View>
                   <View className="flex-row items-center">
                     <Eye size={12} color={isDark ? '#9CA3AF' : '#6B7280'} />
                     <Text className="text-gray-500 dark:text-gray-400 text-[10px] ml-1 font-bold">{article.view_count || 0}</Text>
                   </View>
                </View>
             </View>
          </View>

          {/* Article Content Body */}
          <Animated.View className="py-4 mt-2" style={{ opacity: fadeAnim, paddingHorizontal: 20 }}>
            {article.content ? (
              <RenderHtml
                contentWidth={width - 40}
                source={{ html: article.content }}
                tagsStyles={{
                  body: {
                    color: isDark ? '#D1D5DB' : '#374151',
                    fontFamily: 'Poppins_400Regular',
                    fontSize: 16,
                    lineHeight: 24,
                  },
                  p: {
                    color: isDark ? '#D1D5DB' : '#374151',
                    fontFamily: 'Poppins_400Regular',
                    fontSize: 16,
                    lineHeight: 24,
                    marginBottom: 10,
                  },
                  span: {
                    color: isDark ? '#D1D5DB' : '#374151',
                    fontFamily: 'Poppins_400Regular',
                  },
                  h1: { fontFamily: 'Poppins_700Bold', color: isDark ? '#FFF' : '#000' },
                  h2: { fontFamily: 'Poppins_700Bold', color: isDark ? '#FFF' : '#000' },
                  h3: { fontFamily: 'Poppins_700Bold', color: isDark ? '#FFF' : '#000' },
                  strong: { fontFamily: 'Poppins_700Bold' },
                }}
              />
            ) : (
              <View className="space-y-6">
                <Text className="text-gray-700 dark:text-gray-300 text-base leading-relaxed" style={{ fontFamily: 'Poppins_400Regular' }}>
                  Découvrez nos meilleurs conseils pour optimiser votre alimentation tout en profitant des saveurs africaines. Une bonne hydratation et un sommeil réparateur sont les clés de votre succès.
                </Text>

                <View className="pl-4 border-l-4 border-[#39FF14] py-2">
                  <Text className="text-black dark:text-white text-lg font-bold italic" style={{ fontFamily: 'Poppins_700Bold' }}>
                    &quot;La nutrition n&apos;est pas une punition, c&apos;est une célébration de votre corps.&quot;
                  </Text>
                </View>

                <Text className="text-gray-700 dark:text-gray-300 text-base leading-relaxed" style={{ fontFamily: 'Poppins_400Regular' }}>
                  Intégrez plus de fibres avec des plats comme le Thiébou Diène ou privilégiez les protéines végétales du Niébé. Votre santé vous remerciera.
                </Text>
              </View>
            )}
          </Animated.View>

          <View className="h-px bg-gray-200 dark:bg-white/10 mx-5 my-6" />

          {/* Comments Section */}
          <View className="px-5 mb-10">
            <View className="flex-row items-center mb-6">
              <MessageCircle size={20} color={isDark ? '#FFF' : '#000'} />
              <Text className="text-xl font-bold text-black dark:text-white ml-2" style={{ fontFamily: 'Poppins_700Bold' }}>
                Commentaires ({comments.length})
              </Text>
            </View>

            {comments.length > 0 ? (
              <View className="space-y-4">
                {comments.map((comment) => (
                  <View key={comment.id} className="bg-gray-100 dark:bg-[#151515] p-4 rounded-2xl">
                    <View className="flex-row items-center mb-2">
                       {comment.clients?.avatar_url ? (
                          <Image source={{ uri: comment.clients.avatar_url }} className="w-8 h-8 rounded-full mr-2" />
                       ) : (
                          <View className="w-8 h-8 rounded-full bg-blue-500/20 items-center justify-center mr-2">
                            <Text className="text-blue-500 font-bold text-xs">
                              {comment.clients?.full_name?.substring(0,2).toUpperCase() || 'AN'}
                            </Text>
                          </View>
                       )}
                       <View>
                         <Text className="text-black dark:text-white text-xs font-bold" style={{ fontFamily: 'Poppins_700Bold' }}>
                           {comment.clients?.full_name || 'Utilisateur'}
                         </Text>
                         <Text className="text-gray-400 text-[10px]" style={{ fontFamily: 'Poppins_400Regular' }}>
                           {new Date(comment.created_at).toLocaleDateString('fr-FR')}
                         </Text>
                       </View>
                    </View>
                    <Text className="text-gray-700 dark:text-gray-300 text-sm mt-1" style={{ fontFamily: 'Poppins_400Regular' }}>
                      {comment.content}
                    </Text>
                  </View>
                ))}
              </View>
            ) : (
              <View className="py-6 items-center bg-gray-50 dark:bg-[#151515] rounded-2xl border border-gray-200 dark:border-white/5">
                <Text className="text-gray-400 text-xs">Soyez le premier à commenter cet article.</Text>
              </View>
            )}
          </View>

          {/* Similar Articles Carousel */}
          {similarArticles.length > 0 && (
            <View className="pb-24">
              <Text className="px-5 text-lg font-bold text-black dark:text-white mb-4" style={{ fontFamily: 'Poppins_700Bold' }}>
                À lire aussi
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-5 space-x-4">
                {similarArticles.map((simArt) => (
                  <TouchableOpacity
                    key={simArt.id}
                    activeOpacity={0.9}
                    onPress={() => router.push(`/(tabs)/blog/${simArt.id}` as any)}
                    className="w-64 bg-white dark:bg-[#151515] rounded-2xl overflow-hidden mr-4 border border-gray-200 dark:border-white/10"
                  >
                    <Image source={{ uri: simArt.image_url }} className="w-full h-32" resizeMode="cover" />
                    <View className="p-3">
                      <Text className="text-black dark:text-white text-sm font-bold leading-tight" numberOfLines={2} style={{ fontFamily: 'Poppins_700Bold' }}>
                        {simArt.title}
                      </Text>
                      <Text className="text-[#39FF14] text-xs font-bold uppercase mt-2">Lire &rarr;</Text>
                    </View>
                  </TouchableOpacity>
                ))}
                {/* Extra space at the end to prevent cutoff */}
                <View className="w-5" />
              </ScrollView>
            </View>
          )}

        </Animated.ScrollView>

        {/* Comment Input in Document Flow (Pushed by KeyboardAvoidingView) */}
        <View className="bg-white dark:bg-[#111] border-t border-gray-200 dark:border-white/10 z-50" style={{ elevation: 5 }}>
          <View className="px-5 py-4 pb-8">
             {userId ? (
               <View className="flex-row items-center space-x-2">
                 <View className="flex-1 bg-gray-100 dark:bg-white/10 rounded-3xl px-4 py-3 border border-transparent focus:border-[#39FF14] justify-center">
                   <TextInput
                     className="text-black dark:text-white text-base"
                     placeholder="Ajouter un commentaire..."
                     placeholderTextColor={isDark ? '#9CA3AF' : '#6B7280'}
                     value={newComment}
                     onChangeText={setNewComment}
                     multiline={false}
                     style={{ fontFamily: 'Poppins_400Regular' }}
                   />
                 </View>
                 <TouchableOpacity
                   disabled={!newComment.trim() || submittingComment}
                   onPress={handlePostComment}
                   className={`w-10 h-10 rounded-full items-center justify-center ${newComment.trim() ? 'bg-[#39FF14]' : 'bg-gray-300 dark:bg-gray-700'}`}
                 >
                   {submittingComment ? (
                     <ActivityIndicator size="small" color="#000" />
                   ) : (
                     <Send size={16} color={newComment.trim() ? '#000' : (isDark ? '#555' : '#FFF')} style={{ marginLeft: 2 }} />
                   )}
                 </TouchableOpacity>
               </View>
             ) : (
               <View className="items-center py-2">
                  <Text className="text-gray-500 dark:text-gray-400 text-xs">Connectez-vous pour commenter.</Text>
               </View>
             )}
          </View>
        </View>

      </View>
    </KeyboardAvoidingView>
  );
}