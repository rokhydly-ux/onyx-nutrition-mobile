import { create } from 'zustand';

interface CartItem {
  id: string;
  name: string;
  image_url?: string;
  price: number;
  quantity: number;
  categorie_nom?: string;
}

interface ShopStore {
  shopCart: CartItem[];
  addToCart: (product: any) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
}

export const useShopStore = create<ShopStore>((set) => ({
  shopCart: [],
  addToCart: (product) => set((state) => {
    const existing = state.shopCart.find(item => item.id === product.id);
    if (existing) {
      return {
        shopCart: state.shopCart.map(item =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        ),
      };
    }
    const isPremium = product._isPremiumUser || false;
    const rawPrice = isPremium && product.prix_premium ? product.prix_premium : (product?.prix_standard || product?.prix || product?.price || 0);
    return {
      shopCart: [...state.shopCart, { ...product, name: product.nom || product.name || 'Produit sans nom', price: Number(rawPrice), quantity: 1 }]
    };
  }),
  removeFromCart: (productId) => set((state) => ({
    shopCart: state.shopCart.filter(item => item.id !== productId)
  })),
  updateQuantity: (productId, quantity) => set((state) => ({
    shopCart: state.shopCart.map(item => item.id === productId ? { ...item, quantity } : item)
  })),
  clearCart: () => set({ shopCart: [] })
}));


// --- Menu Store --- //
interface MenuStore {
  showGroceryList: boolean;
  setShowGroceryList: (show: boolean) => void;
  weeklyMenu: any[];
  consumedMeals: any[];
  dailyMacros: { calories: number; protein: number; carbs: number; fats: number; water: number };

  setWeeklyMenu: (menu: any[]) => void;
  setConsumedMeals: (meals: any[]) => void;
  setDailyMacros: (macros: any) => void;

  addConsumedMeal: (meal: any) => void;
  removeConsumedMeal: (mealId: string, mealDate: string) => void;
  updateWeeklyMenuDay: (dayIndex: number, newDayMenu: any) => void;
}

export const useMenuStore = create<MenuStore>((set) => ({
  weeklyMenu: [],
  showGroceryList: false,
  setShowGroceryList: (show) => set({ showGroceryList: show }),
  consumedMeals: [],
  dailyMacros: { calories: 0, protein: 0, carbs: 0, fats: 0, water: 0 },

  setWeeklyMenu: (menu) => set({ weeklyMenu: menu }),
  setConsumedMeals: (meals) => set({ consumedMeals: meals }),
  setDailyMacros: (macros) => set({ dailyMacros: macros }),

  addConsumedMeal: (meal) => set((state) => ({
    consumedMeals: [...state.consumedMeals, meal],
    dailyMacros: {
      calories: state.dailyMacros.calories + (meal.calories || 0),
      protein: state.dailyMacros.protein + (meal.p || meal.proteines || meal.protein || 0),
      carbs: state.dailyMacros.carbs + (meal.c || meal.glucides || meal.carbs || 0),
      fats: state.dailyMacros.fats + (meal.f || meal.lipides || meal.fats || 0),
      water: state.dailyMacros.water
    }
  })),

  removeConsumedMeal: (mealId, mealDate) => set((state) => {
    const mealToRemove = state.consumedMeals.find(m => m.id === mealId && m.date === mealDate);
    if (!mealToRemove) return state;

    return {
      consumedMeals: state.consumedMeals.filter(m => !(m.id === mealId && m.date === mealDate)),
      dailyMacros: {
        calories: Math.max(0, state.dailyMacros.calories - (mealToRemove.calories || 0)),
        protein: Math.max(0, state.dailyMacros.protein - (mealToRemove.p || mealToRemove.proteines || mealToRemove.protein || 0)),
        carbs: Math.max(0, state.dailyMacros.carbs - (mealToRemove.c || mealToRemove.glucides || mealToRemove.carbs || 0)),
        fats: Math.max(0, state.dailyMacros.fats - (mealToRemove.f || mealToRemove.lipides || mealToRemove.fats || 0)),
        water: state.dailyMacros.water
      }
    };
  }),

  updateWeeklyMenuDay: (dayIndex, newDayMenu) => set((state) => {
    const newWeekly = [...state.weeklyMenu];
    newWeekly[dayIndex] = newDayMenu;
    return { weeklyMenu: newWeekly };
  })
}));
