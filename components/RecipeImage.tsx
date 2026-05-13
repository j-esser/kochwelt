import { Image, type ImageStyle, type ImageContentFit } from 'expo-image';
import { type StyleProp } from 'react-native';
import { resolveCategoryPhoto } from '../constants/categoryPhotos';

const FALLBACK = require('../assets/images/food-fallback.jpg');

interface Props {
  uri: string | number | undefined | null;
  /** Stabile Rezept-ID; nötig für deterministische Kategorie-Bildwahl wenn `uri` leer ist. */
  recipeId?: string;
  /** Erste Rezept-Kategorie (z.B. 'Pasta', 'Curry'); steuert den Asset-Pool. */
  category?: string;
  style: StyleProp<ImageStyle>;
  resizeMode?: ImageContentFit;
}

/**
 * Zeigt ein Rezept-Foto via expo-image (Memory + Disk Cache).
 *
 * Auflösungs-Reihenfolge:
 *   1. Wenn `uri` (string/number) gesetzt → direkt verwenden (User-Foto oder externes Bild).
 *   2. Wenn `recipeId` gesetzt → lokales Kategorie-Bild via `resolveCategoryPhoto()`.
 *   3. Sonst → generisches Fallback-Bild.
 *
 * Das vermeidet 40 parallele Unsplash-Downloads beim Erst-Start.
 */
export function RecipeImage({ uri, recipeId, category, style, resizeMode = 'cover' }: Props) {
  const source =
    uri && uri !== ''       ? uri
    : recipeId !== undefined ? resolveCategoryPhoto(recipeId, category)
    :                          FALLBACK;
  return (
    <Image
      source={source}
      style={style}
      contentFit={resizeMode}
      cachePolicy="memory-disk"
      transition={120}
      placeholder={FALLBACK}
    />
  );
}
