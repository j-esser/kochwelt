import { Image, type ImageStyle, type ImageContentFit } from 'expo-image';
import { type StyleProp } from 'react-native';

const FALLBACK = require('../assets/images/food-fallback.jpg');

interface Props {
  uri: string | number | undefined | null;
  style: StyleProp<ImageStyle>;
  resizeMode?: ImageContentFit;
}

/**
 * Zeigt ein Rezept-Foto via expo-image (Memory + Disk Cache).
 * Fallback auf lokales food-fallback.jpg, wenn `uri` leer ist oder Laden scheitert.
 *
 * `uri` kann sein:
 *   - string (file://… oder https://…)
 *   - number (asset reference via require()) — wird ab Phase 2 (Kategorie-Bilder) genutzt
 *   - null/undefined → Fallback
 */
export function RecipeImage({ uri, style, resizeMode = 'cover' }: Props) {
  const source = uri && uri !== '' ? uri : FALLBACK;
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
