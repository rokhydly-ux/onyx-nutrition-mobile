import { create } from 'zustand';

export interface Meal {
  id: string; // The recipe ID or unique ID for the generated meal
  recipe_id: string;
  name: string;
  type: 'Petit-Déjeuner' | 'Déjeuner' | 'Collation' | 'Dîner';
  image_url: string;
  calories: number;
  proteins: number;
  carbs: number;
  fats: number;
  ingredients: any[];
  is_logged?: boolean; // If it's been consumed
  original_calories?: number;
}

export interface DayMenu {
  date: string; // ISO date string (YYYY-MM-DD)
  day_index: number;
  meals: Meal[];
}

interface MenuStoreState {
  weeklyGeneratedMenu: DayMenu[];
  consumedMeals: Record<string, boolean>; // key could be `${date}-${meal.id}`
  showGroceryList: boolean;
  setWeeklyMenu: (menu: DayMenu[]) => void;
  setConsumedMeal: (date: string, mealId: string, isLogged: boolean) => void;
  setShowGroceryList: (show: boolean) => void;
  clearMenu: () => void;
}

export const useMenuStore = create<MenuStoreState>((set) => ({
  weeklyGeneratedMenu: [],
  consumedMeals: {},
  showGroceryList: false,
  setWeeklyMenu: (menu) => set({ weeklyGeneratedMenu: menu }),
  setConsumedMeal: (date, mealId, isLogged) => set((state) => ({
    consumedMeals: {
      ...state.consumedMeals,
      [`${date}-${mealId}`]: isLogged
    }
  })),
  setShowGroceryList: (show) => set({ showGroceryList: show }),
  clearMenu: () => set({ weeklyGeneratedMenu: [], consumedMeals: {} })
}));
