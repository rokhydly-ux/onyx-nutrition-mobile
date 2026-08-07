import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useMenuStore, DayMenu } from '../store/useMenuStore';
import { generateWeeklyMenu, ProfileData } from '../utils/menuGenerator';

export const useMenuData = () => {
  const {
    weeklyGeneratedMenu,
    setWeeklyMenu,
    setConsumedMeal,
    consumedMeals
  } = useMenuStore();

  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [profile, setProfile] = useState<ProfileData & { id: string, plan_type: string, daysLeft: number } | null>(null);

  const fetchProfileAndMenu = useCallback(async () => {
    try {
      setLoading(true);
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !sessionData.session) {
        console.error("No active session:", sessionError);
        return;
      }

      const userId = sessionData.session.user.id;

      const { data: profileData, error: profileError } = await supabase
        .from('nutrition_profiles')
        .select('id, daily_calorie_goal, diagnostic_data, budget, weekly_menu, client_id, expert_mode')
        .eq('client_id', userId)
        .maybeSingle();

      if (profileError) {
        console.error("[useMenuData] Error fetching profile:", profileError);
        return;
      }
      if (!profileData) {
        console.warn("[useMenuData] No profile found for user.");
        return;
      }

      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .select('plan_type, subscription_end_date')
        .eq('id', userId)
        .maybeSingle();

      if (clientError) {
        console.error("[useMenuData] Error fetching client:", clientError);
      }

      let daysLeft = 0;
      if (clientData?.subscription_end_date) {
         const endDate = new Date(clientData.subscription_end_date);
         const today = new Date();
         const diffTime = endDate.getTime() - today.getTime();
         daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      }

      const combinedProfile = {
        ...profileData,
        plan_type: clientData?.plan_type || 'free',
        daysLeft,
      };

      setProfile(combinedProfile as any);

      if (profileData.weekly_menu && Array.isArray(profileData.weekly_menu) && profileData.weekly_menu.length > 0) {
        setWeeklyMenu(profileData.weekly_menu as DayMenu[]);
      }

      const subscription = supabase
        .channel('menu_daily_logs')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'nutrition_daily_logs',
            filter: `client_id=eq.${userId}`
          },
          (payload) => {
            if (payload.eventType === 'INSERT' && payload.new.recipe_id) {
               fetchConsumedMeals(userId);
            } else if (payload.eventType === 'DELETE') {
               fetchConsumedMeals(userId);
            }
          }
        )
        .subscribe();

      await fetchConsumedMeals(userId);

      return () => {
        supabase.removeChannel(subscription);
      };

    } catch (err) {
      console.error("[useMenuData] Unexpected error:", err);
    } finally {
      setLoading(false);
    }
  }, [setWeeklyMenu, setConsumedMeal]);

  const fetchConsumedMeals = async (userId: string) => {
    const today = new Date();
    today.setHours(0,0,0,0);
    const startOfMenu = new Date(today);
    startOfMenu.setDate(startOfMenu.getDate() - 7);

    const { data: logs, error } = await supabase
      .from('nutrition_daily_logs')
      .select('recipe_id, created_at')
      .eq('client_id', userId)
      .gte('created_at', startOfMenu.toISOString());

    if (error) {
      console.error("[useMenuData] Error fetching logs:", error);
      return;
    }

    if (logs) {
      logs.forEach(log => {
        const dateStr = new Date(log.created_at).toISOString().split('T')[0];
        setConsumedMeal(dateStr, log.recipe_id, true);
      });
    }
  };

  const generateMenu = async () => {
    if (!profile) return;
    try {
      setGenerating(true);
      const { data: recipes, error } = await supabase
        .from('nutrition_recipes')
        .select('*');

      if (error || !recipes || recipes.length === 0) return;

      const newMenu = generateWeeklyMenu(recipes, profile);
      setWeeklyMenu(newMenu);

      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData.session?.user.id) {
        await supabase
          .from('nutrition_profiles')
          .update({ weekly_menu: newMenu })
          .eq('client_id', sessionData.session.user.id);
      }
    } catch (err) {
      console.error("[useMenuData] Unexpected error during menu generation:", err);
    } finally {
      setGenerating(false);
    }
  };

  const removeMealLog = async (recipeId: string, date: string) => {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) return;

      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const { error } = await supabase
        .from('nutrition_daily_logs')
        .delete()
        .eq('client_id', session.session.user.id)
        .eq('recipe_id', recipeId)
        .gte('created_at', startOfDay.toISOString())
        .lt('created_at', endOfDay.toISOString());

      if (error) {
        console.error("[useMenuData] Error deleting meal log:", error);
      } else {
        setConsumedMeal(date, recipeId, false);
      }
    } catch (err) {
      console.error("[useMenuData] Unexpected error during meal delete:", err);
    }
  };

  const swapMeal = async (mealId: string, mealType: string, date: string) => {
    if (!profile) return;
    try {
      const { data: recipes, error } = await supabase
        .from('nutrition_recipes')
        .select('*');

      if (error || !recipes) return;

      let updatedMenu = [...weeklyGeneratedMenu];
      const dayIndex = updatedMenu.findIndex(d => d.date === date);

      if (dayIndex > -1) {
         const mealIndex = updatedMenu[dayIndex].meals.findIndex(m => m.id === mealId);
         const currentRecipeId = mealIndex > -1 ? updatedMenu[dayIndex].meals[mealIndex].recipe_id : null;

         const tempMenu = generateWeeklyMenu(recipes, profile, new Date(date));
         let newMeal = tempMenu[0]?.meals.find(m => m.type === mealType);

         // In case the generator gave us the same recipe again, try again (quick hack)
         let attempts = 0;
         while (newMeal && newMeal.recipe_id === currentRecipeId && attempts < 5) {
            const temp = generateWeeklyMenu(recipes, profile, new Date(date));
            newMeal = temp[0]?.meals.find(m => m.type === mealType);
            attempts++;
         }

         if (!newMeal) return;

         if (mealIndex > -1) {
             updatedMenu[dayIndex].meals[mealIndex] = newMeal;
             setWeeklyMenu(updatedMenu);

             const { data: sessionData } = await supabase.auth.getSession();
             if (sessionData.session?.user.id) {
               await supabase
                 .from('nutrition_profiles')
                 .update({ weekly_menu: updatedMenu })
                 .eq('client_id', sessionData.session.user.id);
             }
         }
      }
    } catch (err) {
      console.error("[useMenuData] Unexpected error during meal swap:", err);
    }
  };

  useEffect(() => {
    let unsubscribe: any;
    fetchProfileAndMenu().then(unsub => {
      if (unsub) unsubscribe = unsub;
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [fetchProfileAndMenu]);

  return {
    loading,
    generating,
    profile,
    menu: weeklyGeneratedMenu,
    generateMenu,
    swapMeal,
    removeMealLog,
    consumedMeals
  };
};