import { useMemo, useState } from 'react';
import { TouchableOpacity, type StyleProp, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { tipsFor, CONTEXT_LABELS } from '../services/tips';
import { TipModal } from './TipModal';

interface Props {
  context: string;
  size?: number;
  color?: string;
  style?: StyleProp<ViewStyle>;
  /** Optionaler Override-Titel für das Modal. Default: CONTEXT_LABELS[context]. */
  title?: string;
}

/**
 * Zeigt ein Info-Icon an. Tap öffnet ein Bottom-Sheet mit den Tipps für
 * den jeweiligen Kontext. Wird kein Tipp gefunden (alle plattform-fremd
 * oder Kontext leer), rendert die Komponente nichts.
 */
export function TipButton({ context, size = 20, color = '#a8a29e', style, title }: Props) {
  const [open, setOpen] = useState(false);
  const tips = useMemo(() => tipsFor(context), [context]);

  if (tips.length === 0) return null;

  const modalTitle = title ?? CONTEXT_LABELS[context] ?? 'Tipps';

  return (
    <>
      <TouchableOpacity
        onPress={() => setOpen(true)}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        style={style}
        accessibilityLabel="Tipps anzeigen"
        accessibilityRole="button"
      >
        <Ionicons name="help-circle-outline" size={size} color={color} />
      </TouchableOpacity>

      <TipModal
        visible={open}
        title={modalTitle}
        tips={tips}
        onClose={() => setOpen(false)}
      />
    </>
  );
}
