import { useLocalSearchParams } from 'expo-router';
import RecipeForm from '../../components/RecipeForm';

export default function NewRecipeScreen() {
  const { importUrl } = useLocalSearchParams<{ importUrl?: string }>();
  return <RecipeForm title="Neues Rezept" importUrl={importUrl} />;
}
