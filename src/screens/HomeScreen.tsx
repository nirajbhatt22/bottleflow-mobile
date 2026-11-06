import React, { useState } from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ImageBackground, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { BottomNav } from '../components/BottomNav';
import { BrandMark } from '../components/BrandMark';
import { FeatureCard } from '../components/FeatureCard';
import { ProductCard } from '../components/ProductCard';
import { ResponsibleNotice } from '../components/ResponsibleNotice';
import { Screen } from '../components/Screen';
import { useCart } from '../context/CartContext';
import { useSession } from '../context/SessionContext';
import { products } from '../data/products';
import { RootStackParamList } from '../navigation/types';
import { colors, radii, spacing, type } from '../theme/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

const categories = ['All', 'Beer', 'Wine', 'Spirits', 'Zero Alcohol'];

export function HomeScreen({ navigation }: Props) {
  const { addItem } = useCart();
  const { hidePromotions, purchasesPaused } = useSession();
  const [category, setCategory] = useState('All');
  const [query, setQuery] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const featuredProducts = products.filter((product) => product.featured);

  const filteredProducts = products.filter((product) => {
    const categoryMatch = category === 'All' || product.category === category;
    const productName = `${product.brand} ${product.name}`.toLowerCase();
    const textMatch = productName.includes(query.toLowerCase());
    return categoryMatch && textMatch;
  });

  const handleAdd = (product: (typeof products)[number]) => {
    if (purchasesPaused && product.standardDrinksTotal > 0) {
      setMessage('Alcohol purchases are paused. 0.0% products are still available.');
      setTimeout(() => setMessage(null), 2200);
      return;
    }

    addItem(product);
    setMessage(`✓ ${product.name} added to cart`);
    setTimeout(() => setMessage(null), 1400);
  };

  return (
    <Screen edges={['top', 'right', 'left']}>
      <View style={styles.top}>
        <View style={styles.brandRow}>
          <BrandMark compact />
          <View style={styles.locationBlock}>
            <Text style={styles.locationLabel}>Shopping from</Text>
            <Text style={styles.location}>Perth CBD ▾</Text>
          </View>
          <Pressable onPress={() => navigation.navigate('Account')} style={styles.avatar}>
            <Text style={styles.avatarText}>MB</Text>
          </Pressable>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.headingRow}>
          <View>
            <Text style={styles.kicker}>GOOD EVENING</Text>
            <Text style={styles.heading}>What can we help you find?</Text>
          </View>
        </View>

        <View style={styles.search}>
          <Text style={styles.searchIcon}>⌕</Text>
          <TextInput
            accessibilityLabel="Search products"
            onChangeText={setQuery}
            placeholder="Search beer, wine, spirits…"
            placeholderTextColor={colors.textSecondary}
            style={styles.searchInput}
            value={query}
          />
        </View>

        <ImageBackground
          imageStyle={styles.heroImage}
          resizeMode="cover"
          source={require('../assets/images/hero.png')}
          style={styles.hero}
        >
          <View style={styles.heroShade} />
          <View style={styles.heroCopy}>
            <Text style={styles.heroEyebrow}>MINDFUL CHOICE</Text>
            <Text style={styles.heroTitle}>Great taste, zero alcohol.</Text>
            <Text style={styles.heroText}>Discover our growing 0.0% collection.</Text>
            <Pressable onPress={() => setCategory('Zero Alcohol')} style={styles.heroButton}>
              <Text style={styles.heroButtonText}>Explore 0.0%</Text>
            </Pressable>
          </View>
        </ImageBackground>

        {hidePromotions ? (
          <View style={styles.promotionsHidden}>
            <View style={styles.hiddenIcon}><Text style={styles.hiddenIconText}>✓</Text></View>
            <View style={styles.hiddenCopy}>
              <Text style={styles.hiddenTitle}>Alcohol promotions are hidden</Text>
              <Text style={styles.hiddenText}>Your responsible-use preference is active. The full catalogue is still available below.</Text>
            </View>
            <Pressable onPress={() => navigation.navigate('Account')}>
              <Text style={styles.manageText}>Manage</Text>
            </Pressable>
          </View>
        ) : (
          <>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>Featured picks</Text>
                <Text style={styles.sectionSubtitle}>Thoughtfully selected for you</Text>
              </View>
              <Text style={styles.results}>{featuredProducts.length} picks</Text>
            </View>

            <ScrollView contentContainerStyle={styles.featuredRail} horizontal showsHorizontalScrollIndicator={false}>
              {featuredProducts.map((product) => (
                <FeatureCard
                  key={product.id}
                  onPress={() => navigation.navigate('ProductDetails', { productId: product.id })}
                  product={product}
                />
              ))}
            </ScrollView>
          </>
        )}

        <ScrollView contentContainerStyle={styles.categories} horizontal showsHorizontalScrollIndicator={false}>
          {categories.map((item) => (
            <Pressable
              key={item}
              onPress={() => setCategory(item)}
              style={[styles.category, category === item && styles.categoryActive]}
            >
              <Text style={[styles.categoryText, category === item && styles.categoryTextActive]}>{item}</Text>
            </Pressable>
          ))}
        </ScrollView>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{category === 'All' ? 'Browse all' : category}</Text>
          <Text style={styles.results}>{filteredProducts.length} items</Text>
        </View>

        {message ? (
          <View style={styles.toast}><Text style={styles.toastText}>{message}</Text></View>
        ) : null}

        {filteredProducts.length ? (
          <View style={styles.grid}>
            {filteredProducts.map((product) => (
              <ProductCard
                addDisabled={purchasesPaused && product.standardDrinksTotal > 0}
                key={product.id}
                onAdd={() => handleAdd(product)}
                onOpen={() => navigation.navigate('ProductDetails', { productId: product.id })}
                product={product}
              />
            ))}
          </View>
        ) : (
          <View style={styles.emptyResults}>
            <Text style={styles.emptyIcon}>⌕</Text>
            <Text style={styles.emptyTitle}>No products found</Text>
            <Text style={styles.emptyText}>Try another search or reset the category filter.</Text>
            <Pressable onPress={() => { setQuery(''); setCategory('All'); }} style={styles.resetButton}>
              <Text style={styles.resetText}>Clear filters</Text>
            </Pressable>
          </View>
        )}

        <ResponsibleNotice
          title="Know what you are choosing"
          text="Standard-drink information is shown on every product. You can also set limits, pause purchases and hide promotions in Account."
        />
      </ScrollView>
      <BottomNav active="Shop" />
    </Screen>
  );
}

const styles = StyleSheet.create({
  top: { paddingHorizontal: spacing.xxl, paddingVertical: spacing.md, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border },
  brandRow: { flexDirection: 'row', alignItems: 'center' },
  locationBlock: { marginLeft: spacing.md, flex: 1 },
  locationLabel: { ...type.caption, color: colors.textSecondary },
  location: { ...type.smallStrong, color: colors.text },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  avatarText: { ...type.smallStrong, color: colors.primary },
  content: { paddingHorizontal: spacing.xxl, paddingTop: spacing.xl, gap: spacing.xl, paddingBottom: spacing.xxxl },
  headingRow: { flexDirection: 'row', justifyContent: 'space-between' },
  kicker: { ...type.caption, color: colors.primary, letterSpacing: 1.2, marginBottom: 4 },
  heading: { ...type.h1, color: colors.text, maxWidth: 310 },
  search: { minHeight: 50, borderRadius: radii.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg },
  searchIcon: { color: colors.primary, fontSize: 24, marginRight: spacing.sm },
  searchInput: { flex: 1, ...type.body, color: colors.text },
  hero: { backgroundColor: colors.primaryDark, minHeight: 190, borderRadius: radii.xl, padding: spacing.xl, justifyContent: 'center', overflow: 'hidden' },
  heroImage: { borderRadius: radii.xl },
  heroShade: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(32, 10, 45, 0.24)' },
  heroCopy: { width: '62%', gap: spacing.xs, zIndex: 1 },
  heroEyebrow: { ...type.caption, color: colors.accent, letterSpacing: 1.2 },
  heroTitle: { ...type.h3, color: colors.white },
  heroText: { ...type.caption, color: '#DFD2E7' },
  heroButton: { marginTop: 6, backgroundColor: colors.accent, borderRadius: radii.pill, paddingHorizontal: spacing.md, paddingVertical: 6, alignSelf: 'flex-start' },
  heroButtonText: { ...type.smallStrong, color: colors.primaryDark },
  featuredRail: { gap: spacing.md, paddingRight: spacing.xxl },
  promotionsHidden: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: colors.successSoft, borderRadius: radii.lg, padding: spacing.lg },
  hiddenIcon: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.success, alignItems: 'center', justifyContent: 'center' },
  hiddenIconText: { color: colors.white, fontWeight: '800' },
  hiddenCopy: { flex: 1, gap: 2 },
  hiddenTitle: { ...type.smallStrong, color: colors.text },
  hiddenText: { ...type.caption, color: colors.textSecondary },
  manageText: { ...type.smallStrong, color: colors.primary },
  categories: { gap: spacing.sm },
  category: { borderRadius: radii.pill, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, paddingHorizontal: spacing.lg, paddingVertical: 10 },
  categoryActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  categoryText: { ...type.smallStrong, color: colors.textSecondary },
  categoryTextActive: { color: colors.white },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  sectionTitle: { ...type.h2, color: colors.text },
  sectionSubtitle: { ...type.small, color: colors.textSecondary, marginTop: 2 },
  results: { ...type.small, color: colors.textSecondary },
  toast: { backgroundColor: colors.primarySoft, borderRadius: radii.md, padding: spacing.md },
  toastText: { ...type.smallStrong, color: colors.primaryDark },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  emptyResults: { alignItems: 'center', backgroundColor: colors.surface, borderRadius: radii.lg, padding: spacing.xxl, gap: spacing.sm },
  emptyIcon: { fontSize: 32, color: colors.primary },
  emptyTitle: { ...type.h3, color: colors.text },
  emptyText: { ...type.small, color: colors.textSecondary, textAlign: 'center' },
  resetButton: { marginTop: spacing.sm, backgroundColor: colors.primarySoft, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: radii.pill },
  resetText: { ...type.smallStrong, color: colors.primary },
});
