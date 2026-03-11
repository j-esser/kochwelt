import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { getRecipeById, type Recipe } from '../../../services/recipeStore';
import RecipeForm from '../../../components/RecipeForm';

export default function EditRecipeScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [recipe, setRecipe] = useState<Recipe | null>(null);

  useEffect(() => {
    getRecipeById(id).then(setRecipe);
  }, [id]);

  if (!recipe) {
    return (
      <View className="flex-1 items-center justify-center bg-stone-50">
        <ActivityIndicator color="#f97316" />
      </View>
    );
  }

  return <RecipeForm initial={recipe} title="Rezept bearbeiten" />;
}
