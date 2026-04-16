import { useCallback, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { RecipeImage } from '../../components/RecipeImage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { getAllRecipes, type Recipe } from '../../services/recipeStore';
import { getWeekStats, type WeekStats } from '../../services/plannerStore';

const FOOD_IMAGE = 'https://images.unsplash.com/photo-1547592180-85f173990554?w=800&q=80';

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 11) return 'Guten Morgen';
  if (h < 14) return 'Guten Appetit';
  if (h < 18) return 'Guten Nachmittag';
  return 'Guten Abend';
}

type BadgeLevel = 'none' | 'good' | 'great';

function getWeekBadge(stats: WeekStats): BadgeLevel {
  if (stats.days >= 6 || stats.meals >= 10) return 'great';
  if (stats.days >= 2 || stats.meals >= 4) return 'good';
  return 'none';
}

const BADGE_CONFIG = {
  great: { ionicon: 'trophy', color: '#22c55e', bg: '#f0fdf4', border: '#bbf7d0', label: 'Tolle Woche!' },
  good:  { ionicon: 'star',   color: '#f59e0b', bg: '#fffbeb', border: '#fde68a', label: 'Gute Planung, weiter so!' },
} as const;

// ─── Zwei kombinierte Karten ──────────────────────────────────────────────────

function RecipesCard({ count, onPress, onNew }: { count: number; onPress: () => void; onNew: () => void }) {
  return (
    <TouchableOpacity style={s.dashCard} onPress={onPress} activeOpacity={0.8}>
      <View style={s.dashCardHeader}>
        <Ionicons name="book-outline" size={18} color="#f97316" />
        <Text style={s.dashCardLabel}>Rezepte</Text>
      </View>
      <View style={s.dashCardValueRow}>
        <Text style={s.dashCardValue}>{count}</Text>
        <TouchableOpacity onPress={onNew} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} style={{ marginLeft: 'auto' as any }}>
          <Ionicons name="add-circle-outline" size={44} color="#f97316" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

function PlannerCard({ stats, onPress }: { stats: WeekStats; onPress: () => void }) {
  const level = getWeekBadge(stats);
  const achieved = level !== 'none';
  const cfg = achieved ? BADGE_CONFIG[level as 'good' | 'great'] : null;

  // Fortschritt: maximal bis zur nächsten Stufe
  const targetMeals = stats.meals >= 10 ? 10 : 4;
  const targetDays  = stats.days  >= 6  ? 6  : 2;
  const progress = Math.max(
    Math.min(stats.meals / targetMeals, 1),
    Math.min(stats.days  / targetDays,  1),
  );

  return (
    <TouchableOpacity style={[s.dashCard, achieved && { borderWidth: 1.5, borderColor: cfg!.border, backgroundColor: cfg!.bg }]} onPress={onPress} activeOpacity={0.8}>
      <View style={s.dashCardHeader}>
        <Ionicons name="calendar-outline" size={18} color={achieved ? cfg!.color : '#f97316'} />
        <Text style={[s.dashCardLabel, achieved && { color: cfg!.color }]}>Diese Woche</Text>
      </View>
      <View style={s.dashCardValueRow}>
        <Text style={[s.dashCardValue, achieved && { color: cfg!.color }]}>{stats.meals}</Text>
        {achieved && <Ionicons name={cfg!.ionicon as any} size={44} color={cfg!.color} style={{ marginLeft: 'auto' as any }} />}
      </View>
      <Text style={s.dashCardSub}>
        {achieved ? cfg!.label : `${stats.days} Tage · ${stats.meals} Mahlzeiten`}
      </Text>
      {!achieved && (
        <View style={s.progressTrack}>
          <View style={[s.progressFill, { width: `${Math.round(progress * 100)}%` as any }]} />
        </View>
      )}
    </TouchableOpacity>
  );
}

function FeaturedCard({ recipe, onPress }: { recipe: Recipe; onPress: () => void }) {
  const content = (
    <>
      <View style={s.featuredContent}>
        <View style={s.featuredBadge}>
          <Text style={s.featuredBadgeText}>Rezept des Tages</Text>
        </View>
        <Text style={s.featuredTitle} numberOfLines={2}>{recipe.title}</Text>
        <View style={s.featuredMeta}>
          <View style={s.featuredChip}>
            <Ionicons name="time-outline" size={12} color="rgba(255,255,255,0.8)" />
            <Text style={s.featuredChipText}>{recipe.cookTime} min</Text>
          </View>
          <View style={s.featuredChip}>
            <Ionicons name="people-outline" size={12} color="rgba(255,255,255,0.8)" />
            <Text style={s.featuredChipText}>{recipe.portions} Portionen</Text>
          </View>
          {recipe.nutrition?.kcal != null && (
            <View style={s.featuredChip}>
              <Text style={s.featuredChipText}>{Math.round(recipe.nutrition.kcal / (recipe.portions || 1))} kcal/Port.</Text>
            </View>
          )}
        </View>
      </View>
      <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.7)" style={s.featuredArrow} />
    </>
  );

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={s.featuredCard}>
      <View style={s.featuredPhotoWrap}>
        <RecipeImage uri={recipe.photo} style={StyleSheet.absoluteFill} />
        <LinearGradient colors={['rgba(0,0,0,0.15)', 'rgba(0,0,0,0.65)']} style={[s.featuredGradient, { flexDirection: 'row', alignItems: 'flex-end' }]}>
          {content}
        </LinearGradient>
      </View>
    </TouchableOpacity>
  );
}

function QuickRecipeCard({ recipe, onPress }: { recipe: Recipe; onPress: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.75} style={s.quickCard}>
      <RecipeImage uri={recipe.photo} style={s.quickThumb} />
      <View style={{ flex: 1 }}>
        <Text style={s.quickTitle} numberOfLines={2}>{recipe.title}</Text>
        <Text style={s.quickMeta}>{recipe.cookTime} min · {recipe.categories[0] ?? '—'}</Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color="#d6d3d1" />
    </TouchableOpacity>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [weekStats, setWeekStats] = useState<WeekStats>({ days: 0, meals: 0 });

  useFocusEffect(useCallback(() => {
    (async () => {
      const [allRecipes, stats] = await Promise.all([getAllRecipes(), getWeekStats()]);
      setRecipes(allRecipes);
      setWeekStats(stats);
    })();
  }, []));

  const featured = recipes.length > 0
    ? recipes[Math.floor(Math.random() * Math.min(10, recipes.length))]
    : null;

  const recent = recipes.slice(0, 5);

  return (
    <SafeAreaView style={s.screen} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>

        {/* Hero */}
        <View style={s.hero}>
          <Image source={{ uri: FOOD_IMAGE }} style={s.heroImage} resizeMode="cover" />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.65)']}
            style={s.heroOverlay}
          />
          <View style={s.heroText}>
            <Text style={s.heroGreeting}>{getGreeting()}</Text>
            <Text style={s.heroTitle}>Meine Kochwelt</Text>
            <Text style={s.heroSub}>{recipes.length} Rezepte · Deine persönliche Küche</Text>
          </View>
        </View>

        {/* Dashboard Karten */}
        <View style={s.dashRow}>
          <RecipesCard
            count={recipes.length}
            onPress={() => router.push('/(tabs)/rezepte')}
            onNew={() => router.push('/recipe/new')}
          />
          <PlannerCard
            stats={weekStats}
            onPress={() => router.push('/(tabs)/planer')}
          />
        </View>

        {/* Rezept des Tages */}
        {featured && (
          <View style={s.section}>
            <FeaturedCard
              recipe={featured}
              onPress={() => router.push(`/recipe/${featured.id}`)}
            />
          </View>
        )}

        {/* Rezepte entdecken */}
        <View style={s.section}>
          <View style={s.sectionHeader}>
            <Text style={s.sectionTitle}>Rezepte entdecken</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/rezepte')}>
              <Text style={s.sectionLink}>Alle anzeigen</Text>
            </TouchableOpacity>
          </View>
          <View style={s.quickList}>
            {recent.map(r => (
              <QuickRecipeCard
                key={r.id}
                recipe={r}
                onPress={() => router.push(`/recipe/${r.id}`)}
              />
            ))}
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f5f5f4' },

  hero: { height: 180, position: 'relative' },
  heroImage: { width: '100%', height: '100%' },
  heroOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  heroText: { position: 'absolute', bottom: 24, left: 20, right: 20 },
  heroGreeting: { color: 'rgba(255,255,255,0.85)', fontSize: 14, fontWeight: '500' },
  heroTitle: { color: '#ffffff', fontSize: 28, fontWeight: '800', marginTop: 2 },
  heroSub: { color: 'rgba(255,255,255,0.75)', fontSize: 13, marginTop: 4 },

  dashRow: { flexDirection: 'row', gap: 10, marginHorizontal: 16, marginTop: 16 },
  dashCard: {
    flex: 1, backgroundColor: '#ffffff', borderRadius: 16,
    padding: 14,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 1,
  },
  dashCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  dashCardLabel: { flex: 1, fontSize: 12, fontWeight: '600', color: '#78716c' },
  dashCardValue: { fontSize: 28, fontWeight: '800', color: '#1c1917', lineHeight: 32 },
  dashCardSub: { fontSize: 11, color: '#78716c', marginTop: 3 },

  dashCardValueRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  progressTrack: { height: 4, backgroundColor: '#f0efee', borderRadius: 2, marginTop: 8, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#f97316', borderRadius: 2 },

  section: { marginHorizontal: 16, marginTop: 20 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: '#1c1917' },
  sectionLink: { fontSize: 13, color: '#f97316', fontWeight: '500' },

  featuredCard: { borderRadius: 20, overflow: 'hidden' },
  featuredPhotoWrap: { height: 160, borderRadius: 20, overflow: 'hidden' },
  featuredGradient: { flexDirection: 'row', alignItems: 'center', padding: 20, minHeight: 110 },
  featuredContent: { flex: 1 },
  featuredBadge: { backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, alignSelf: 'flex-start', marginBottom: 8 },
  featuredBadgeText: { color: '#ffffff', fontSize: 11, fontWeight: '600' },
  featuredTitle: { color: '#ffffff', fontSize: 17, fontWeight: '700', lineHeight: 24 },
  featuredMeta: { flexDirection: 'row', gap: 8, marginTop: 10, flexWrap: 'wrap' },
  featuredChip: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  featuredChipText: { color: '#ffffff', fontSize: 12 },
  featuredArrow: { marginLeft: 8 },

  quickList: {
    backgroundColor: '#ffffff', borderRadius: 16,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 1,
    overflow: 'hidden',
  },
  quickCard: { flexDirection: 'row', alignItems: 'center', padding: 14, borderBottomWidth: 1, borderBottomColor: '#f5f5f4', gap: 12 },
  quickIconBox: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#fff7ed', alignItems: 'center', justifyContent: 'center' },
  quickThumb: { width: 40, height: 40, borderRadius: 12 },
  quickTitle: { fontSize: 14, fontWeight: '600', color: '#1c1917' },
  quickMeta: { fontSize: 12, color: '#a8a29e', marginTop: 2 },
});
