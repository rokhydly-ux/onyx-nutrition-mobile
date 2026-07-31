import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useMenuStore, DayMenu, Meal } from '../store/useMenuStore';
import { generateWeeklyMenu, ProfileData, Recipe } from '../utils/menuGenerator';

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
      console.log(`[useMenuData] Active session for user: ${userId}`);

      // 1. Fetch Profile Data (assuming budget, diagnostic_data, daily_calorie_goal, weekly_menu are here)
      // And also fetch clients for plan_type (assuming plan_type is in clients, based on previous tasks, or maybe nutrition_profiles)
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

      // Also get client data for plan_type / daysLeft if necessary.
      // Assuming plan_type and daysLeft are calculated/stored in 'clients'.
      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .select('plan_type, subscription_end_date')
        .eq('id', userId)
        .maybeSingle();

      if (clientError) {
        console.error("[useMenuData] Error fetching client:", clientError);
      }

      // Calculate days left
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

      // 2. Restore menu if exists
      if (profileData.weekly_menu && Array.isArray(profileData.weekly_menu) && profileData.weekly_menu.length > 0) {
        console.log("[useMenuData] Restoring existing weekly menu.");
        setWeeklyMenu(profileData.weekly_menu as DayMenu[]);
      }

      // 3. Setup real-time listener for logs to mark meals as "✅ Validé"
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
            console.log("[useMenuData] Realtime update on daily logs:", payload);
            // Re-fetch logs or simply set state if we can parse the meal ID
            // For now, simpler to just trigger a re-check of today's logs if needed,
            // but we can parse the recipe_id if it's there
            if (payload.eventType === 'INSERT' && payload.new.recipe_id) {
               // Mark meal as consumed. We might need the date and meal ID.
               // Assuming payload.new.created_at gives the date.
               // The exact implementation depends on how meal.id vs recipe_id maps in logs.
               const dateStr = new Date(payload.new.created_at).toISOString().split('T')[0];
               // We will just use a generic fetch to update all consumed statuses
               fetchConsumedMeals(userId);
            } else if (payload.eventType === 'DELETE') {
               fetchConsumedMeals(userId);
            }
          }
        )
        .subscribe();

      // Fetch initial consumed meals
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
    // Get last 7 days of logs to populate the state
    const today = new Date();
    today.setHours(0,0,0,0);
    const startOfMenu = new Date(today);
    // Rough estimate, fetch all recent logs
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
        // For simplicity, we just store that this recipe_id was consumed on this date
        setConsumedMeal(dateStr, log.recipe_id, true);
      });
    }
  };

  const generateMenu = async () => {
    if (!profile) return;
    try {
      setGenerating(true);
      console.log("[useMenuData] Fetching recipes to generate new menu...");

      const { data: recipes, error } = await supabase
        .from('nutrition_recipes')
        .select('*');

      if (error) {
        console.error("[useMenuData] Error fetching recipes:", error);
        return;
      }

      if (!recipes || recipes.length === 0) {
        console.warn("[useMenuData] No recipes found in DB!");
        return;
      }

      const newMenu = generateWeeklyMenu(recipes, profile);

      // Save to state
      setWeeklyMenu(newMenu);

      // Save to Supabase
      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData.session?.user.id) {
        const { error: updateError } = await supabase
          .from('nutrition_profiles')
          .update({ weekly_menu: newMenu })
          .eq('client_id', sessionData.session.user.id);

        if (updateError) {
          console.error("[useMenuData] Error saving menu to Supabase:", updateError);
        } else {
          console.log("[useMenuData] Menu successfully generated and saved to DB.");
        }
      }

    } catch (err) {
      console.error("[useMenuData] Unexpected error during menu generation:", err);
    } finally {
      setGenerating(false);
    }
  };

  const swapMeal = async (mealId: string, mealType: string, date: string) => {
    if (!profile) return;
    try {
      // 1. Fetch valid recipes for this meal type
      const { data: recipes, error } = await supabase
        .from('nutrition_recipes')
        .select('*');

      if (error || !recipes) {
        console.error("[useMenuData] Error fetching recipes for swap:", error);
        return;
      }

      // 2. We use generateWeeklyMenu just to get one day, or we can use the same logic
      // but simpler. Let's reuse generateWeeklyMenu to get a new day's meals and pick the one we need.
      // A more robust way is to re-run the menu generator for a single day, but we only want to swap one meal.
      // So we will generate a temporary 1-day menu, and extract the matching meal.

      // We pass the same date so it targets correctly
      const tempMenu = generateWeeklyMenu(recipes, profile, new Date(date));
      const newMeal = tempMenu[0]?.meals.find(m => m.type === mealType);

      if (!newMeal) {
        console.warn("[useMenuData] Could not find a replacement meal for type:", mealType);
        return;
      }

      // Ensure it has the original mealId so React key mapping stays consistent if needed,
      // or we can just replace the whole meal object.

      // 3. Update the global state
      let updatedMenu = [...weeklyGeneratedMenu];
      const dayIndex = updatedMenu.findIndex(d => d.date === date);

      if (dayIndex > -1) {
         const mealIndex = updatedMenu[dayIndex].meals.findIndex(m => m.id === mealId);
         if (mealIndex > -1) {
             updatedMenu[dayIndex].meals[mealIndex] = newMeal;
             setWeeklyMenu(updatedMenu);

             // 4. Save back to Supabase
             const { data: sessionData } = await supabase.auth.getSession();
             if (sessionData.session?.user.id) {
               const { error: updateError } = await supabase
                 .from('nutrition_profiles')
                 .update({ weekly_menu: updatedMenu })
                 .eq('client_id', sessionData.session.user.id);

               if (updateError) {
                 console.error("[useMenuData] Error updating swapped menu to Supabase:", updateError);
               } else {
                 console.log("[useMenuData] Meal swapped and saved successfully.");
               }
             }
         }
      }

    } catch (err) {
      console.error("[useMenuData] Unexpected error during meal swap:", err);
    }
  };

  // Setup on mount
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
    consumedMeals
  };
};