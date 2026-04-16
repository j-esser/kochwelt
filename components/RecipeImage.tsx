import { useState } from 'react';
import { Image, type ImageStyle, type StyleProp } from 'react-native';

const FALLBACK = require('../assets/images/food-fallback.jpg');

interface Props {
  uri: string | undefined | null;
  style: StyleProp<ImageStyle>;
  resizeMode?: 'cover' | 'contain' | 'stretch' | 'center';
}

/**
 * Zeigt ein Rezept-Foto. Fällt bei fehlender oder kaputterURL
 * automatisch auf das lokale Fallback-Bild zurück.
 */
export function RecipeImage({ uri, style, resizeMode = 'cover' }: Props) {
  const [failed, setFailed] = useState(false);

  if (!uri || failed) {
    return <Image source={FALLBACK} style={style} resizeMode={resizeMode} />;
  }

  return (
    <Image
      source={{ uri }}
      style={style}
      resizeMode={resizeMode}
      onError={() => setFailed(true)}
    />
  );
}
