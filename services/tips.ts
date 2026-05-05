import { Platform } from 'react-native';

export type TipPlatform = 'all' | 'ios' | 'android';

export interface Tip {
  id: string;
  context: string;
  icon: string;
  title: string;
  body: string;
  platform?: TipPlatform; // default 'all'
}

// Reihenfolge bestimmt die Anzeige im Modal und in der zentralen Tipps-Sektion.
export const TIPS: Tip[] = [
  // ── recipe-form-text: Zutaten- und Zubereitungs-Eingabe ─────────────────────
  {
    id: 'ios-text-scan',
    context: 'recipe-form-text',
    icon: 'scan-outline',
    title: 'Text aus Foto/Kochbuch scannen',
    body:
      'Tippe doppelt in das Eingabefeld → "Text scannen" wählen. Die Kamera öffnet sich, du richtest sie auf eine Seite oder einen Zettel, und der erkannte Text wird direkt eingefügt. Praktisch für Zutaten und Zubereitungs-Schritte aus Kochbüchern.',
    platform: 'ios',
  },

  // ── recipe-form-import: Import-Bereich beim neuen Rezept ────────────────────
  {
    id: 'clipboard-url',
    context: 'recipe-form-import',
    icon: 'clipboard-outline',
    title: 'URL aus Zwischenablage',
    body:
      'Hast du in Safari/Chrome eine Rezept-URL kopiert? Beim Öffnen von „Neues Rezept" erkennt Kochwelt das automatisch und bietet den Import an.',
  },
  {
    id: 'recipe-template',
    context: 'recipe-form-import',
    icon: 'copy-outline',
    title: 'Rezept als Vorlage nutzen',
    body:
      'Im Import-Bereich → „JSON / Vorlage" → „Aus vorhandenem Rezept" — Felder werden vorbelegt, Titel bekommt „(Kopie)". Ideal für Varianten.',
  },

  // ── recipes: Rezeptliste ────────────────────────────────────────────────────
  {
    id: 'smart-filters',
    context: 'recipes',
    icon: 'options-outline',
    title: 'Smart-Filter kombinieren',
    body:
      'Die Chips „Schnell", „Einfach", „High-Protein", „Low-Carb", „Low-Kalorie" lassen sich kombinieren mit der Kategorie und der Suchleiste — alle Filter wirken zusammen.',
  },

  // ── recipe-detail: Detail-Ansicht ───────────────────────────────────────────
  {
    id: 'portion-scale',
    context: 'recipe-detail',
    icon: 'people-outline',
    title: 'Portionen live skalieren',
    body:
      'Über die +/− Knöpfe oben — alle Zutatenmengen passen sich sofort an, ohne das Originalrezept zu verändern.',
  },
  {
    id: 'rating-toggle',
    context: 'recipe-detail',
    icon: 'star-outline',
    title: 'Bewertung entfernen',
    body: 'Den aktuell gewählten Stern erneut tippen → Bewertung wird zurückgesetzt.',
  },
  {
    id: 'cook-history',
    context: 'recipe-detail',
    icon: 'flame-outline',
    title: 'Wann hast du es gekocht?',
    body:
      'Tippe auf das Flammen-Badge („3× in 4 Wochen") — die Daten der vergangenen Mahlzeiten werden angezeigt.',
  },
  {
    id: 'recipe-share-json',
    context: 'recipe-detail',
    icon: 'share-outline',
    title: 'Einzelnes Rezept teilen',
    body:
      'Über das Teilen-Symbol oben rechts. Das Rezept wird als JSON-Datei verpackt und kann per Mail, Nachrichten oder AirDrop verschickt werden — die andere Person importiert sie unter „Tools".',
  },

  // ── planner: Wochenplaner ───────────────────────────────────────────────────
  {
    id: 'meal-type-defaults',
    context: 'planner',
    icon: 'sunny-outline',
    title: 'Snack-Nährwerte vorbelegen',
    body:
      'Im Snack/Kalte-Küche-Dialog die Mahlzeit-Typ-Chips (Frühstück/Mittag/Abend/Snack) wechseln — kcal/Protein/Fett/KH werden automatisch aus deinem Tagesziel × Verteilung vorbelegt.',
  },

  // ── shopping: Einkaufsliste ─────────────────────────────────────────────────
  {
    id: 'shopping-ics',
    context: 'shopping',
    icon: 'calendar-outline',
    title: 'Einkaufsliste in iOS Reminders',
    body:
      'Über „Teilen" → „Als Erinnerung" wird eine .ics-Datei erzeugt. Per AirDrop oder Mail an dich selbst senden, dann öffnet iOS die Reminders-App und legt jede Position als Aufgabe an.',
    platform: 'ios',
  },
];

function currentPlatform(): 'ios' | 'android' {
  return Platform.OS === 'ios' ? 'ios' : 'android';
}

function tipMatchesPlatform(tip: Tip): boolean {
  const p = tip.platform ?? 'all';
  return p === 'all' || p === currentPlatform();
}

/** Tipps für einen bestimmten Kontext (filtert plattform-fremde Tipps aus). */
export function tipsFor(context: string): Tip[] {
  return TIPS.filter(t => t.context === context && tipMatchesPlatform(t));
}

/** Alle für die aktuelle Plattform sichtbaren Tipps — für die Tipps & Tricks-Sektion. */
export function allVisibleTips(): Tip[] {
  return TIPS.filter(tipMatchesPlatform);
}

/** Lesbare Überschriften für die Gruppierung in der zentralen Tipps-Sektion. */
export const CONTEXT_LABELS: Record<string, string> = {
  'recipe-form-text': 'Rezept eingeben',
  'recipe-form-import': 'Rezept importieren',
  'recipes': 'Rezeptliste',
  'recipe-detail': 'Rezept-Ansicht',
  'planner': 'Wochenplaner',
  'shopping': 'Einkaufsliste',
};
