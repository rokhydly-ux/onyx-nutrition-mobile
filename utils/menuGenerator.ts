import { Meal, DayMenu } from '../store/useMenuStore';
import { addDays, format } from 'date-fns';

export interface Recipe {
  id: string;
  name: string;
  image_url: string;
  category: string;
  type: string;
  budget_tier: string;
  calories?: number;
  kcal?: number;
  energy?: number;
  proteins: number;
  carbs: number;
  fats: number;
  ingredients: any[]; // { name, quantite, price_cfa }
}

export interface ProfileData {
  daily_calorie_goal: number;
  diagnostic_data: {
    allergies?: string[];
    fasting_mode?: boolean;
    userMode?: 'strict' | 'free'; // 'strict' is Guided Mode, 'free' is Free Mode
  };
  budget: string; // the exact exact tier they are e.g. "Serré 8k", "Famille 15k"
  expert_mode?: boolean;
}

const getCalories = (recipe: Recipe) => recipe.calories || recipe.kcal || recipe.energy || 0;

export const generateWeeklyMenu = (
  recipes: Recipe[],
  profile: ProfileData,
  startDate = new Date()
): DayMenu[] => {
  const { daily_calorie_goal, diagnostic_data, budget } = profile;
  const allergies = diagnostic_data?.allergies || [];
  const fastingMode = !!diagnostic_data?.fasting_mode;

  // 1. Filter out non-meals (assuming 'Accessoire' or 'Ingrédient pur' is the category/type)
  // Need to know exactly what the column looks like. Assuming category is not these.
  let validRecipes = recipes.filter((r) =>
    !r.category?.toLowerCase().includes('accessoire') &&
    !r.category?.toLowerCase().includes('ingrédient')
  );

  // 2. Filter Allergies
  if (allergies.length > 0) {
    validRecipes = validRecipes.filter(r => {
      const ingredientsText = JSON.stringify(r.ingredients || []).toLowerCase();
      // If the ingredients contains ANY of the allergy words, exclude it
      return !allergies.some(allergy => ingredientsText.includes(allergy.toLowerCase()));
    });
  }

  // 3. Filter Budget
  if (budget === 'Serré 8k') {
    validRecipes = validRecipes.filter(r => r.budget_tier === 'Serré 8k');
  } else if (budget === 'Famille 15k') {
    validRecipes = validRecipes.filter(r => r.budget_tier === 'Serré 8k' || r.budget_tier === 'Famille 15k');
  }

  // Group valid recipes by type
  const recipesByType: Record<string, Recipe[]> = {
    'Petit-Déjeuner': validRecipes.filter(r => r.type?.toLowerCase().includes('petit')),
    'Déjeuner': validRecipes.filter(r => r.type?.toLowerCase().includes('déjeuner') || r.type?.toLowerCase().includes('dejeuner')),
    'Collation': validRecipes.filter(r => r.type?.toLowerCase().includes('collation') || r.type?.toLowerCase().includes('snack')),
    'Dîner': validRecipes.filter(r => r.type?.toLowerCase().includes('dîner') || r.type?.toLowerCase().includes('diner')),
  };

  // Fallbacks if one category is empty due to strict filters
  const allMeals = [...validRecipes];
  if (recipesByType['Petit-Déjeuner'].length === 0) recipesByType['Petit-Déjeuner'] = allMeals;
  if (recipesByType['Déjeuner'].length === 0) recipesByType['Déjeuner'] = allMeals;
  if (recipesByType['Collation'].length === 0) recipesByType['Collation'] = allMeals;
  if (recipesByType['Dîner'].length === 0) recipesByType['Dîner'] = allMeals;

  const weeklyMenu: DayMenu[] = [];
  const recentRecipes: Record<string, string[]> = {
    'Petit-Déjeuner': [],
    'Déjeuner': [],
    'Collation': [],
    'Dîner': []
  };

  const getMealTargetCalories = (mealType: string) => {
    if (fastingMode) {
      if (mealType === 'Petit-Déjeuner') return 0; // Skip
      if (mealType === 'Déjeuner') return daily_calorie_goal * 0.45;
      if (mealType === 'Collation') return daily_calorie_goal * 0.20;
      if (mealType === 'Dîner') return daily_calorie_goal * 0.35;
    } else {
      if (mealType === 'Petit-Déjeuner') return daily_calorie_goal * 0.25;
      if (mealType === 'Déjeuner') return daily_calorie_goal * 0.40;
      if (mealType === 'Collation') return daily_calorie_goal * 0.10;
      if (mealType === 'Dîner') return daily_calorie_goal * 0.25;
    }
    return 0;
  };

  const pickRandomRecipe = (type: string, lastUsedId: string | null) => {
    let choices = recipesByType[type] || [];
    if (choices.length > 1 && lastUsedId) {
      choices = choices.filter(c => c.id !== lastUsedId); // prevent consecutive days
    }
    const randomIndex = Math.floor(Math.random() * choices.length);
    return choices[randomIndex];
  };

  const scaleRecipe = (recipe: Recipe, targetCal: number): Meal => {
    const originalCal = getCalories(recipe);
    const ratio = originalCal > 0 ? (targetCal / originalCal) : 1;

    // Scale ingredients
    const scaledIngredients = (recipe.ingredients || []).map(ing => {
      // Assuming quantite might be a number or a string with units. We try to scale numbers.
      let newQuantite = ing.quantite;
      if (typeof ing.quantite === 'number') {
        newQuantite = parseFloat((ing.quantite * ratio).toFixed(2));
      } else if (typeof ing.quantite === 'string') {
        const numMatch = ing.quantite.match(/[\d.]+/);
        if (numMatch) {
          const num = parseFloat(numMatch[0]);
          const scaledNum = parseFloat((num * ratio).toFixed(2));
          newQuantite = ing.quantite.replace(numMatch[0], String(scaledNum));
        }
      }
      return {
        ...ing,
        quantite: newQuantite,
        scaledRatio: ratio // pass this to calculate price later if price is proportional to quantity
      };
    });

    return {
      id: `${recipe.id}-${Math.random().toString(36).substring(7)}`, // Unique ID for this instance in the menu
      recipe_id: recipe.id,
      name: recipe.name,
      type: recipe.type as Meal['type'],
      image_url: recipe.image_url,
      calories: Math.round(targetCal),
      proteins: Math.round(recipe.proteins * ratio),
      carbs: Math.round(recipe.carbs * ratio),
      fats: Math.round(recipe.fats * ratio),
      ingredients: scaledIngredients,
      original_calories: originalCal,
      is_logged: false
    };
  };

  for (let i = 0; i < 7; i++) {
    const dateStr = format(addDays(startDate, i), 'yyyy-MM-dd');
    const dayMeals: Meal[] = [];

    const mealTypes = fastingMode
      ? ['Déjeuner', 'Collation', 'Dîner']
      : ['Petit-Déjeuner', 'Déjeuner', 'Collation', 'Dîner'];

    for (const type of mealTypes) {
      const targetCal = getMealTargetCalories(type);
      const lastUsed = recentRecipes[type][recentRecipes[type].length - 1] || null;

      const recipe = pickRandomRecipe(type, lastUsed);
      if (recipe) {
        recentRecipes[type].push(recipe.id);
        const scaledMeal = scaleRecipe(recipe, targetCal);
        // Force the type in case the DB type is slightly different spelling
        scaledMeal.type = type as Meal['type'];
        dayMeals.push(scaledMeal);
      }
    }

    weeklyMenu.push({
      date: dateStr,
      day_index: i,
      meals: dayMeals
    });
  }

  return weeklyMenu;
};
