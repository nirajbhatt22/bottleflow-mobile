import React from 'react';
import { Image, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View, type ImageSourcePropType, type ViewStyle } from 'react-native';

export const SHOP = {
  background: '#F7F3EE', surface: '#FFFDFA', ink: '#261B24', muted: '#6D6067',
  line: '#E7DED6', accent: '#662A49', dark: '#301627', soft: '#F0E5EB', gold: '#F5D18D',
};
export const editorialFont = Platform.select({ ios: 'Georgia', android: 'serif', default: 'Georgia' });

const line = (left: number, top: number, width: number, rotation = 0): ViewStyle => ({
  left, top, width, height: 1.6, borderRadius: 1, transform: [{ rotate: `${rotation}deg` }],
});
const outline = (left: number, top: number, width: number, height: number, borderRadius = 2): ViewStyle => ({
  left, top, width, height, borderRadius, borderWidth: 1.5,
});
const iconParts = {
  home: [line(0, 5, 11, -38), line(9, 5, 11, 38), outline(4, 8, 12, 11), line(7, 15, 6, 90)],
  browse: [outline(2, 2, 7, 7), outline(11, 2, 7, 7), outline(2, 11, 7, 7), outline(11, 11, 7, 7)],
  bag: [outline(3, 7, 14, 12, 3), { ...outline(7, 2, 6, 8, 4), borderBottomWidth: 0 }],
  receipt: [outline(4, 2, 12, 17), line(7, 6, 6), line(7, 10, 6), line(7, 14, 4)],
  account: [outline(7, 2, 6, 6, 3), outline(3, 11, 14, 8, 6)],
  chart: [line(3, 17, 14), line(3, 13, 6, 90), line(6, 11, 10, 90), line(9, 9, 14, 90)],
  pin: [{ ...outline(4, 2, 12, 12, 6), borderBottomRightRadius: 0, transform: [{ rotate: '45deg' }] }, outline(8, 6, 4, 4, 2)],
  search: [outline(2, 2, 12, 12, 6), line(11, 14, 8, 45)],
  filters: [line(2, 5, 16), line(2, 13, 16), outline(6, 2, 3, 7, 1), outline(12, 10, 3, 7, 1)],
  arrow: [line(3, 9, 13), line(10, 6, 7, 45), line(10, 11, 7, -45)],
  chevron: [line(7, 6, 6, 45), line(7, 10, 6, -45)],
  close: [line(4, 9, 12, 45), line(4, 9, 12, -45)],
  check: [line(3, 11, 7, 45), line(7, 9, 11, -48)],
} satisfies Record<string, ViewStyle[]>;

export function ShopIcon({ name, color = SHOP.ink }: { name: keyof typeof iconParts; color?: string }) {
  return <View accessible={false} pointerEvents="none" style={styles.icon}>
    {iconParts[name].map((part, index) => <View key={index} style={[
      styles.iconPart, part, part.borderWidth ? { borderColor: color } : { backgroundColor: color },
    ]}/>)}
  </View>;
}

export function ShopHomeLink({ storeName, onPress }: { storeName: string; onPress: () => void }) {
  return <Pressable
    accessibilityRole="link"
    accessibilityLabel={`${storeName} home`}
    onPress={onPress}
    style={({ pressed }) => [styles.brand, pressed && styles.pressed]}
  >
    <View style={styles.mark}><Text style={styles.markText}>B</Text></View>
    <Text numberOfLines={1} style={styles.wordmark}>{storeName}</Text>
  </Pressable>;
}

export function ShopHeader({ storeName, pickupName, manager, onPickup, onHome }: {
  storeName: string; pickupName?: string; manager: boolean; onPickup: () => void; onHome: () => void;
}) {
  return <View style={styles.header}>
    <ShopHomeLink storeName={storeName} onPress={onHome}/>
    {manager ? <Text style={styles.manager}>STORE TEAM</Text> :
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={pickupName ? `Change pickup location, ${pickupName}` : 'Choose pickup location'}
        onPress={onPickup}
        style={({ pressed }) => [styles.location, pressed && styles.pressed]}
      >
        <ShopIcon name="pin" color={SHOP.accent}/>
        <View style={styles.locationText}>
          <Text style={styles.locationLabel}>PICKUP</Text>
          <Text numberOfLines={1} style={styles.locationName}>{pickupName || 'Choose store'}</Text>
        </View>
        <ShopIcon name="chevron" color={SHOP.accent}/>
      </Pressable>}
  </View>;
}

const shopperTabs = [
  { label: 'Home', icon: 'home' }, { label: 'Browse', icon: 'browse' },
  { label: 'Cart', icon: 'bag' }, { label: 'Requests', icon: 'receipt' }, { label: 'Profile', icon: 'account' },
] as const;
const managerTabs = [
  shopperTabs[0], { label: 'Products', icon: 'browse' }, shopperTabs[3], { label: 'Reports', icon: 'chart' }, shopperTabs[4],
] as const;

export function ShopTabs({ current, manager, cartCount, onSelect }: {
  current: string; manager: boolean; cartCount: number; onSelect: (screen: string) => void;
}) {
  return <View style={styles.tabs}>
    {(manager ? managerTabs : shopperTabs).map(({ label, icon }) => {
      const selected = label === current;
      const count = label === 'Cart' ? cartCount : 0;
      return <Pressable
        key={label} accessibilityRole="tab" accessibilityState={{ selected }}
        accessibilityLabel={count ? `Cart, ${count} ${count === 1 ? 'pack' : 'packs'}` : label}
        onPress={() => onSelect(label)}
        style={({ pressed }) => [styles.tab, pressed && styles.pressed]}
      >
        <View style={[styles.tabIcon, selected && styles.activeIcon]}>
          <ShopIcon name={icon} color={selected ? SHOP.accent : SHOP.muted}/>
          {count ? <View style={styles.tabCount}><Text style={styles.tabCountText}>{count > 99 ? '99+' : count}</Text></View> : null}
        </View>
        <Text style={[styles.tabLabel, selected && styles.activeLabel]}>{label}</Text>
      </Pressable>;
    })}
  </View>;
}

export function SearchField({ value, onChange, onOpen, autoFocus = false }: {
  value?: string; onChange?: (value: string) => void; onOpen?: () => void; autoFocus?: boolean;
}) {
  const icon = <ShopIcon name="search" color={SHOP.muted}/>;
  const placeholder = 'Search products, brands or styles';
  if (onOpen) return <Pressable accessibilityRole="button" accessibilityLabel="Search products" onPress={onOpen} style={styles.search}>
    {icon}<Text style={styles.searchPlaceholder}>{placeholder}</Text>
  </Pressable>;
  return <View style={styles.search}>
    {icon}
    <TextInput
      accessibilityLabel="Search products" value={value} onChangeText={onChange}
      placeholder={placeholder} placeholderTextColor={SHOP.muted} returnKeyType="search"
      autoFocus={autoFocus} style={styles.searchInput}
    />
    {value ? <Pressable accessibilityRole="button" accessibilityLabel="Clear search" onPress={() => onChange?.('')} hitSlop={8}>
      <ShopIcon name="close" color={SHOP.muted}/>
    </Pressable> : null}
  </View>;
}

export function ShopHero({ image, onShop }: { image: ImageSourcePropType; onShop: () => void }) {
  return <View style={styles.hero}>
    <Image accessible={false} source={image} style={styles.heroImage} resizeMode="cover"/>
    <View style={styles.heroTint}/>
    <View style={styles.heroContent}>
      <Text style={styles.heroEyebrow}>WESTERN AUSTRALIA</Text>
      <Text accessibilityRole="header" style={styles.heroTitle}>{'Beer, wine\n& spirits'}</Text>
      <Pressable accessibilityRole="button" onPress={onShop} style={({ pressed }) => [styles.heroButton, pressed && styles.pressed]}>
        <Text style={styles.heroButtonText}>Shop the range</Text><ShopIcon name="arrow" color={SHOP.dark}/>
      </Pressable>
    </View>
  </View>;
}

export function ShopHeading({ title, action, onPress }: { title: string; action?: string; onPress?: () => void }) {
  return <View style={styles.heading}>
    <Text accessibilityRole="header" style={styles.headingText}>{title}</Text>
    {action && onPress ? <Pressable accessibilityRole="button" onPress={onPress} style={styles.headingLink}>
      <Text style={styles.headingLinkText}>{action}</Text><ShopIcon name="arrow" color={SHOP.accent}/>
    </Pressable> : null}
  </View>;
}

export function CategoryShelf({ categories, onSelect }: {
  categories: { name: string; image: ImageSourcePropType }[]; onSelect: (category: string) => void;
}) {
  return <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryShelf}>
    {categories.map(({ name, image }) => <Pressable
      key={name} accessibilityRole="button" accessibilityLabel={`Browse ${name}`}
      onPress={() => onSelect(name)} style={({ pressed }) => [styles.categoryTile, pressed && styles.pressed]}
    >
      <Image source={image} style={styles.categoryImage} resizeMode="cover"/>
      <Text numberOfLines={1} style={styles.categoryName}>{name}</Text>
    </Pressable>)}
  </ScrollView>;
}

const styles = StyleSheet.create({
  icon: { width: 20, height: 20 },
  iconPart: { position: 'absolute' },
  pressed: { opacity: 0.76 },
  header: { paddingHorizontal: 17, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, backgroundColor: SHOP.surface, borderBottomWidth: 1, borderColor: SHOP.line },
  brand: { flexShrink: 1, alignSelf: 'flex-start', minWidth: 0, minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 7 },
  mark: { width: 28, height: 28, flexShrink: 0, borderRadius: 8, backgroundColor: SHOP.dark, alignItems: 'center', justifyContent: 'center' },
  markText: { color: SHOP.gold, fontFamily: editorialFont, fontSize: 18 },
  wordmark: { flexShrink: 1, color: SHOP.ink, fontFamily: editorialFont, fontWeight: '700', fontSize: 23, letterSpacing: -0.7 },
  manager: { color: SHOP.accent, fontSize: 10, fontWeight: '800', letterSpacing: 1.1 },
  location: { maxWidth: '49%', flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 43, paddingHorizontal: 8, paddingVertical: 4, borderWidth: 1, borderColor: SHOP.line, borderRadius: 11 },
  locationText: { flexShrink: 1 },
  locationLabel: { color: SHOP.muted, fontSize: 8, fontWeight: '800', letterSpacing: 1.1 },
  locationName: { color: SHOP.ink, fontSize: 12, fontWeight: '800' },
  tabs: { paddingHorizontal: 6, flexDirection: 'row', backgroundColor: SHOP.surface, borderTopWidth: 1, borderColor: SHOP.line },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: 57, gap: 3 },
  tabIcon: { width: 40, height: 28, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  activeIcon: { backgroundColor: SHOP.soft },
  tabLabel: { fontSize: 10, fontWeight: '600', color: SHOP.muted },
  activeLabel: { color: SHOP.accent, fontWeight: '800' },
  tabCount: { position: 'absolute', top: -1, right: -1, minWidth: 15, height: 15, paddingHorizontal: 3, justifyContent: 'center', alignItems: 'center', borderRadius: 9, backgroundColor: SHOP.accent },
  tabCountText: { color: 'white', fontSize: 8, fontWeight: '800' },
  search: { flexDirection: 'row', alignItems: 'center', gap: 9, minHeight: 48, borderRadius: 12, paddingHorizontal: 13, borderWidth: 1, borderColor: SHOP.line, backgroundColor: SHOP.surface },
  searchPlaceholder: { color: SHOP.muted, fontSize: 13, flexShrink: 1 },
  searchInput: { flex: 1, color: SHOP.ink, fontSize: 14, minHeight: 46, paddingVertical: 4 },
  hero: { position: 'relative', width: '100%', minHeight: 198, aspectRatio: 1.68, marginTop: 14, marginBottom: 23, borderRadius: 17, overflow: 'hidden', backgroundColor: SHOP.dark, justifyContent: 'center' },
  heroImage: { ...StyleSheet.absoluteFill, width: '100%', height: '100%' },
  heroTint: { ...StyleSheet.absoluteFill, backgroundColor: '#230F2066' },
  heroContent: { paddingVertical: 18, paddingHorizontal: 15, alignItems: 'flex-start' },
  heroEyebrow: { color: SHOP.gold, fontSize: 9, letterSpacing: 1.45, fontWeight: '900', marginBottom: 7 },
  heroTitle: { color: '#FFFAF1', fontFamily: editorialFont, fontSize: 30, lineHeight: 33, letterSpacing: -0.7 },
  heroButton: { flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: SHOP.gold, marginTop: 12, paddingHorizontal: 11, minHeight: 40, borderRadius: 9 },
  heroButtonText: { color: SHOP.dark, fontSize: 12, fontWeight: '800' },
  heading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 9, marginBottom: 10 },
  headingText: { flexShrink: 1, color: SHOP.ink, fontFamily: editorialFont, fontWeight: '700', fontSize: 24, letterSpacing: -0.65 },
  headingLink: { flexDirection: 'row', minHeight: 32, alignItems: 'center', gap: 4 },
  headingLinkText: { color: SHOP.accent, fontSize: 12, fontWeight: '800' },
  categoryShelf: { gap: 9, paddingBottom: 4 },
  categoryTile: { width: 87, alignItems: 'center', gap: 6 },
  categoryImage: { height: 61, width: '100%', borderRadius: 11, backgroundColor: SHOP.soft },
  categoryName: { fontSize: 12, fontWeight: '700', color: SHOP.ink },
});
