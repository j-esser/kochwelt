import { useMemo, useState } from 'react';
import { Pressable, type StyleProp, type ViewStyle } from 'react-native';
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
      <Pressable
        onPress={() => setOpen(true)}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        style={[{ padding: 6, minWidth: 32, minHeight: 32, alignItems: 'center', justifyContent: 'center' }, style]}
        accessibilityLabel="Tipps anzeigen"
        accessibilityRole="button"
      >
        <Ionicons name="help-circle-outline" size={size} color={color} />
      </Pressable>

      <TipModal
        visible={open}
        title={modalTitle}
        tips={tips}
        onClose={() => setOpen(false)}
      />
    </>
  );
}
