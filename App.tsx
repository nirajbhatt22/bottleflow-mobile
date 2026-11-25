import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Image, KeyboardAvoidingView, Linking, Modal, Platform, Pressable, ScrollView, StatusBar, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View, type ImageSourcePropType } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, configured, db, missingFirebaseConfig } from './src/firebase';
import { cartCount, defaultPackOption, formatAUD, packOption, packOptions, readableError, regularPackOption, specialPercent, startOfLocalWeek, sumSales } from './src/domain';
import { addSupplier, changeName, completeRequest, createProduct, declineRequest, editProduct, login, logout, receiveStock, register, resetPassword, saveStoreSettings, seedCatalogProducts, submitRequest, useLiveDocs, useStoreSettings } from './src/data';
import { PHOTO_ID_TYPES, PICKUP_WINDOWS, WA_PICKUP_LOCATIONS, WA_PROOF_OF_AGE_URL } from './src/pickup';
import { parsePickupPayment, PickupPayment, pickupPaymentLabel, type PickupPaymentMethod } from './src/PickupPayment';
import { CATALOG_PHOTOS } from './src/catalog-photos';
import { VERIFIED_PACKSHOTS } from './src/verified-packshots';
import { CategoryShelf, editorialFont, SearchField, SHOP, ShopHeader, ShopHeading, ShopHero, ShopHomeLink, ShopIcon, ShopTabs } from './src/Storefront';
import { PREMIUM_PRODUCTS } from './src/premium-catalog';
import { deduplicateProducts, MARKET_PRODUCTS, productImageIdentity } from './src/pricing-benchmarks';
import type { CartLine, CollectionRequest, Movement, PickupDetails, Product, Profile, Sale, StoreSettings, Supplier } from './src/types';

const C = { bg: SHOP.background, ink: SHOP.ink, muted: SHOP.muted, purple: SHOP.accent,
 dark: SHOP.dark, gold: SHOP.gold, white: SHOP.surface, line: SHOP.line, soft: SHOP.soft,
 green: '#23664A', red: '#9E383B' };
const productImages: Record<string,ImageSourcePropType> = {
 'great-northern-original':require('./assets/products/great-northern-original.png'),
 'canadian-club-dry':require('./assets/products/canadian-club-dry.png'),
 'penfolds-koonunga-hill':require('./assets/products/penfolds-koonunga-hill.png'),
 'bundaberg-original':require('./assets/products/bundaberg-original.png'),
 'somersby-apple':require('./assets/products/somersby-apple.png'),
 'heaps-normal-quiet-xpa':require('./assets/products/heaps-normal-quiet-xpa.jpg'),
};
const brandImages = {
 hero: require('./assets/brand/home-hero-v2.png'),
 Beer: require('./assets/brand/category-beer-v2.png'),
 Wine: require('./assets/brand/category-wine-v2.png'),
 Spirits: require('./assets/brand/category-spirits-v2.png'),
 Premix: require('./assets/brand/category-premix-v2.png'),
 Cider: require('./assets/brand/category-cider-v2.png'),
 'No Alcohol': require('./assets/brand/category-no-alcohol-v2.png'),
 'Soft Drinks': require('./assets/brand/category-soft-drinks-v2.png'),
} satisfies Record<string,ImageSourcePropType>;
const photoCategories = ['Beer','Wine','Spirits','Premix','Cider','No Alcohol','Soft Drinks'] as const;
const storefrontCategories = photoCategories.map(name => ({ name, image: brandImages[name] }));
type SortMode = 'featured'|'name'|'price-low'|'price-high';
const sortOptions: { value: SortMode; label: string }[] = [
  { value: 'featured', label: 'Featured' },
  { value: 'name', label: 'Name A–Z' },
  { value: 'price-low', label: 'Price low to high' },
  { value: 'price-high', label: 'Price high to low' },
];
type BrowseFilters = { sort: SortMode; inStock: boolean; specials: boolean };
const nowLabel=(item?:{toDate?:()=>Date})=>{try{return item?.toDate?.().toLocaleString('en-AU',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'})||'Just now';}catch{return 'Recently';}};
const requestReference = (id: string) => id.slice(0, 8).toUpperCase();
const presentationEntry=(product:Partial<Product>&Pick<Product,'sku'|'priceCents'>):[string,Partial<Product>]=>[product.sku,{priceCents:product.priceCents,packSize:product.packSize,abv:product.abv,description:product.description,imageKey:product.imageKey,imageUrl:product.imageUrl,premium:product.premium}];
const presentationBySku=new Map<string,Partial<Product>>([...MARKET_PRODUCTS,...PREMIUM_PRODUCTS].map(product=>presentationEntry(product)));
type ProductImage = { image: ImageSourcePropType; packshot: boolean };

const packshotLabels: Partial<Record<string, { name?: string; packSize?: string; abv?: string }>> = {
  'OFF-3262151001757': { name: 'Mouton Cadet Bordeaux Rouge', packSize: '750 mL bottle' },
  'OFF-9358432064017': { packSize: '700 mL bottle' },
  'OFF-9320000500456': { name: 'Great Northern Super Crisp Lager', packSize: '330 mL bottle', abv: '3.5% ABV' },
  'OFF-9320000500432': { name: 'Great Northern Super Crisp Lager Can', packSize: '375 mL can', abv: '3.5% ABV' },
  'OFF-9318691008351': { packSize: '375 mL bottle' },
  'OFF-3043700103821': { name: 'G.H. Mumm Cordon Rouge Brut Champagne', packSize: '375 mL half-bottle' },
  'OFF-3113880113818': { name: 'Perrier-Jouët Grand Brut Champagne Gift Box', packSize: '750 mL bottle' },
  'OFF-3323860101326': { name: 'Charles de Cazanove Tête de Cuvée Brut', packSize: '750 mL bottle' },
  'OFF-3011932000829': { name: 'Martini Bianco Vermouth', packSize: '1 L bottle' },
  'OFF-3760040424446': { name: 'Arrogant Frog Croak Rotie Shiraz', packSize: '750 mL bottle' },
  'OFF-5000267024233': { name: 'Johnnie Walker Black Label 12 Year Old', packSize: '700 mL bottle', abv: '40% ABV' },
  'OFF-3219820000078': { name: 'Martell VS Cognac', packSize: '700 mL bottle', abv: '40% ABV' },
  'OFF-7506064300184': { name: 'Don Julio Añejo Tequila', packSize: '700 mL bottle', abv: '38% ABV' },
  'OFF-9334944004192': { packSize: '6 × 330 mL bottles', abv: '4% ABV' },
  'OFF-5099873003626': { name: 'Jack Daniel’s Double Jack & Cola', packSize: '375 mL can', abv: '6.9% ABV' },
  'OFF-9421905150385': { name: 'Hint Watermelon Vodka Seltzer', packSize: '250 mL can', abv: '5% ABV' },
  'OFF-9300675057899': { name: 'Coca-Cola Classic', packSize: '250 mL can' },
  'OFF-9300624401933': { name: 'Kirks Olde Stoney Ginger Beer', packSize: '1.25 L bottle' },
  'OFF-7312720021726': { name: 'Herrljunga Apple Cider', packSize: '330 mL can', abv: '0.5% ABV' },
  'OFF-9310432002666': { name: 'Double Phoenix Chinese Cooking Wine', packSize: '640 mL bottle', abv: '16% ABV' },
};

function verifiedPackshot(product: Product) {
  const packshot = VERIFIED_PACKSHOTS[product.sku];
  if (!packshot || product.imageKey) return undefined;
  // Preserve photos supplied by the manager if they differ from the imported photo.
  return productImageIdentity(product) === productImageIdentity({ ...product, imageUrl: packshot.originalUrl })
    ? packshot : undefined;
}

function productLabel(product: Product) {
  const label = verifiedPackshot(product) ? packshotLabels[product.sku] : undefined;
  return {
    name: label?.name ?? product.name,
    description: [label?.packSize ?? product.packSize, label?.abv ?? product.abv]
      .filter(Boolean).join(' · ') || 'See product label',
  };
}

function productSources(product: Product): ProductImage[] {
  const local = (product.imageKey && productImages[product.imageKey]) ||
    (product.imageUrl ? CATALOG_PHOTOS[product.imageUrl] : undefined);
  const remote = product.imageUrl?.startsWith('https://') ? { uri: product.imageUrl } : undefined;
  const verified = verifiedPackshot(product);
  return [
    ...(verified ? [{ image: verified.image, packshot: true }] : []),
    ...(local ? [{ image: local, packshot: !!product.imageKey }] : []),
    ...(remote ? [{ image: remote, packshot: false }] : []),
  ];
}

const isPremium=(product:Product)=>product.premium===true||product.priceCents>=10000;
function PrimaryButton({title,onPress,disabled=false,subtle=false}: {title:string;onPress:()=>void;disabled?:boolean;subtle?:boolean}) {return <TouchableOpacity accessibilityRole="button" disabled={disabled} onPress={onPress} style={[styles.button,subtle&&styles.buttonSubtle,disabled&&{opacity:0.5}]}><Text style={[styles.buttonText,subtle&&{color:C.purple}]}>{title}</Text></TouchableOpacity>}
function TxtInput({label,value,onChangeText,placeholder='',keyboardType,secureTextEntry,autoCapitalize,multiline,editable=true}: {label:string;value:string;onChangeText:(v:string)=>void;placeholder?:string;keyboardType?:'email-address'|'decimal-pad'|'number-pad'|'phone-pad';secureTextEntry?:boolean;autoCapitalize?:'none'|'words';multiline?:boolean;editable?:boolean}) {const[hidden,setHidden]=useState(!!secureTextEntry);return <View style={{marginBottom:12}}><Text style={styles.inputLabel}>{label}</Text><View style={{position:'relative'}}><TextInput accessibilityLabel={label} style={[styles.input,secureTextEntry&&{paddingRight:72},multiline&&{minHeight:72,textAlignVertical:'top'},!editable&&{backgroundColor:'#EEEAF4'}]} value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor="#A39BAB" keyboardType={keyboardType} secureTextEntry={secureTextEntry?hidden:false} autoCapitalize={secureTextEntry?'none':autoCapitalize} autoCorrect={false} spellCheck={false} multiline={multiline} editable={editable}/>{secureTextEntry?<TouchableOpacity accessibilityRole="button" accessibilityLabel={hidden?'Show password':'Hide password'} onPress={()=>setHidden(current=>!current)} style={styles.passwordToggle}><Text style={styles.link}>{hidden?'Show':'Hide'}</Text></TouchableOpacity>:null}</View></View>}
function Pill({label,tone='neutral'}:{label:string;tone?:'neutral'|'green'|'red'|'gold'}){const color=tone==='green'?C.green:tone==='red'?C.red:tone==='gold'?'#886018':C.purple; const bg=tone==='green'?'#E4F4EC':tone==='red'?'#FBE8E9':tone==='gold'?'#FFF4D9':C.soft;return <View style={{backgroundColor:bg,paddingHorizontal:10,paddingVertical:5,borderRadius:99,alignSelf:'flex-start'}}><Text style={{color,fontSize:11,fontWeight:'700'}}>{label}</Text></View>}
function SectionTitle({title,subtitle,right}:{title:string;subtitle?:string;right?:React.ReactNode}){return <View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginBottom:12}}><View style={{flex:1}}><Text style={styles.h2}>{title}</Text>{subtitle?<Text style={styles.small}>{subtitle}</Text>:null}</View>{right}</View>}
function Empty({title,description}:{title:string;description:string}){return <View style={styles.empty}><Text style={{fontSize:34,marginBottom:8}}>✦</Text><Text style={styles.h2}>{title}</Text><Text style={[styles.small,{textAlign:'center',marginTop:6}]}>{description}</Text></View>}
type PhotoSize = number | 'tile' | 'detail' | 'large';

function Thumb({ product, size = 76 }: { product: Product; size?: PhotoSize }) {
  return <ProductPhoto key={JSON.stringify([product.id, product.imageKey, product.imageUrl])} product={product} size={size}/>;
}

function ProductPhoto({ product, size }: { product: Product; size: PhotoSize }) {
  const [sourceIndex, setSourceIndex] = useState(0);
  const source = productSources(product)[sourceIndex];
  const frame = typeof size === 'number'
    ? { width: size, height: size, padding: size < 100 ? 4 : 9 }
    : size === 'tile' ? styles.tilePhoto : size === 'detail' ? styles.detailPhoto : styles.largePhoto;
  return <View style={[styles.productPhoto, source?.packshot && styles.packshotStage, frame]}>
    {source ? <Image
      accessible
      accessibilityLabel={`${productLabel(product).name} product photo`}
      source={source.image}
      onError={() => setSourceIndex(index => index === sourceIndex ? index + 1 : index)}
      style={styles.packshot}
      resizeMode="contain"
      resizeMethod="resize"
      fadeDuration={120}
    /> : <Text style={styles.missingPhoto}>Photo unavailable</Text>}
  </View>;
}

function DetailPhoto({ product }: { product: Product }) {
  const [expanded, setExpanded] = useState(false);
  const verified = verifiedPackshot(product);
  const photoPage = verified?.sourceUrl;
  return <View style={styles.detailPhotoButton}>
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={expanded ? 'Return to standard photo' : 'Enlarge product photo'}
      accessibilityState={{ expanded }}
      onPress={() => setExpanded(value => !value)}
    >
      <Thumb product={product} size={expanded ? 'large' : 'detail'}/>
      <View style={styles.photoControl}><Text style={styles.photoControlText}>{expanded ? 'Reduce' : 'Enlarge'}</Text></View>
    </TouchableOpacity>
    {photoPage ? <TouchableOpacity accessibilityRole="link" style={styles.photoCredit} onPress={() =>
      Linking.openURL(photoPage).catch(() => Alert.alert('Could not open the photo source'))
    }><Text style={styles.small}>Packshot source ↗</Text></TouchableOpacity> : null}
  </View>;
}

function CatalogueTile({ product, onPress, shelf = false }: { product: Product; onPress: () => void; shelf?: boolean }) {
  const offer = defaultPackOption(product);
  const saving = specialPercent(product);
  const regular = saving ? regularPackOption(product, offer.units) : null;
  const label = productLabel(product);
  return <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [
    styles.catalogueTile, shelf && styles.shelfTile, pressed && { opacity: 0.8 },
  ]}>
    <Thumb product={product} size="tile"/>
    {saving ? <View pointerEvents="none" style={styles.saleChip}><Text style={styles.saleLabel}>−{saving}%</Text></View> : null}
    <View style={styles.tileBody}>
      <Text style={styles.tileCategory}>{product.category.toUpperCase()}</Text>
      <Text style={styles.tileName} numberOfLines={3}>{label.name}</Text>
      <Text style={styles.tileMeta} numberOfLines={2}>{label.description}</Text>
      <View style={styles.tileFooter}>
        <View style={{ flexShrink: 1 }}>
          <View style={styles.tilePriceRow}>
            <Text style={styles.tilePrice}>{formatAUD(offer.priceCents)}</Text>
            {regular ? <Text style={styles.wasPrice}>{formatAUD(regular.priceCents)}</Text> : null}
          </View>
          <Text style={styles.tileMeta}>{offer.label}</Text>
        </View>
        {product.stock < offer.units
          ? <Text style={styles.tileStock}>{product.stock ? 'Limited' : 'Sold out'}</Text>
          : <View style={styles.tileView}><ShopIcon name="chevron" color={C.purple}/></View>}
      </View>
    </View>
  </Pressable>;
}

function ProductShelf({ title, action, products, onBrowse, onProduct }: {
  title: string; action?: string; products: Product[]; onBrowse?: () => void; onProduct: (product: Product) => void;
}) {
  if (!products.length) return null;
  return <View style={styles.storefrontSection}>
    <ShopHeading title={title} action={action} onPress={onBrowse}/>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.shelf}>
      {products.map(product => <CatalogueTile key={product.id} product={product} shelf onPress={() => onProduct(product)}/>)}
    </ScrollView>
  </View>;
}

function ProfileRow({ icon, title, detail, onPress }: {
  icon: 'pin' | 'bag' | 'receipt' | 'browse'; title: string; detail: string; onPress: () => void;
}) {
  return <Pressable accessibilityRole="button" onPress={onPress} style={[styles.card, styles.profileRow]}>
    <View style={styles.profileIcon}><ShopIcon name={icon} color={C.purple}/></View>
    <View style={{ flex: 1 }}>
      <Text style={styles.itemTitle}>{title}</Text>
      <Text style={styles.small}>{detail}</Text>
    </View>
    <ShopIcon name="chevron" color={C.purple}/>
  </Pressable>;
}

function CatalogueFilterPopup({ filters, manager, onApply, onClose }: {
  filters: BrowseFilters; manager: boolean; onApply: (filters: BrowseFilters) => void; onClose: () => void;
}) {
  const [draft, setDraft] = useState(filters);
  return <Popup title="Sort and filter" onClose={onClose}>
    <Text style={styles.stepTitle}>Sort by</Text>
    {sortOptions.map(({ value, label }) => <Pressable
      key={value} accessibilityRole="radio" accessibilityState={{ checked: draft.sort === value }}
      onPress={() => setDraft(current => ({ ...current, sort: value }))} style={styles.filterRadio}
    >
      <Text style={styles.itemTitle}>{label}</Text>
      {draft.sort === value ? <ShopIcon name="check" color={C.purple}/> : null}
    </Pressable>)}
    <View style={styles.filterSwitch}>
      <Text style={styles.itemTitle}>In stock only</Text>
      <Switch accessibilityLabel="In stock only" value={draft.inStock} trackColor={{ true: C.purple }} onValueChange={inStock => setDraft(current => ({ ...current, inStock }))}/>
    </View>
    {!manager ? <View style={styles.filterSwitch}>
      <Text style={styles.itemTitle}>On special only</Text>
      <Switch accessibilityLabel="On special only" value={draft.specials} trackColor={{ true: C.purple }} onValueChange={specials => setDraft(current => ({ ...current, specials }))}/>
    </View> : null}
    <PrimaryButton title="Show products" onPress={() => onApply(draft)}/>
  </Popup>;
}
function ProductCard({product,onPress}:{product:Product;onPress:()=>void}){const offer=defaultPackOption(product);const regular=regularPackOption(product,offer.units);const special=specialPercent(product);return <TouchableOpacity accessibilityRole="button" onPress={onPress} style={[styles.card,{flexDirection:'row',alignItems:'center',gap:14,marginBottom:11,padding:11}]}><Thumb product={product}/><View style={{flex:1}}><View style={{flexDirection:'row',gap:6,marginBottom:5,flexWrap:'wrap'}}><Pill label={product.category}/>{special?<Pill label={`SAVE ${special}%`} tone="red"/>:isPremium(product)?<Pill label="PREMIUM" tone="gold"/>:null}<Pill label={product.abv||'ABV: check label'} tone="gold"/></View><Text style={styles.itemTitle} numberOfLines={2}>{product.name}</Text><Text style={styles.small}>{product.packSize||product.sku}</Text><View style={{flexDirection:'row',alignItems:'center',gap:7,marginTop:5,flexWrap:'wrap'}}><Text style={{fontSize:16,color:C.purple,fontWeight:'900'}}>{offer.label} · {formatAUD(offer.priceCents)}</Text>{special?<Text style={[styles.small,{textDecorationLine:'line-through'}]}>{formatAUD(regular.priceCents)}</Text>:null}{product.stock<=product.minStock?<Pill label={product.stock===0?'Out of stock':'Low stock'} tone="red"/>:<Text style={styles.small}>{product.stock} units</Text>}</View></View><Text style={{fontSize:18,color:C.purple}}>›</Text></TouchableOpacity>}
function Stat({label,value,foot}:{label:string;value:string;foot?:string}){return <View style={[styles.card,{width:'48%',minHeight:104,justifyContent:'space-between'}]}><Text style={styles.small}>{label}</Text><Text style={{fontSize:24,fontWeight:'900',color:C.ink}}>{value}</Text>{foot?<Text style={styles.small}>{foot}</Text>:null}</View>}
function Popup({ title, children, onClose, showClose = true, scrollKey, homeLink }: {
  title: string; children: React.ReactNode; onClose: () => void; showClose?: boolean; scrollKey?: string;
  homeLink?: React.ReactNode;
}) {
  return <Modal animationType="slide" visible transparent onRequestClose={showClose ? onClose : () => {}}>
    <View style={styles.backdrop}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ width: '100%', maxWidth: 560, maxHeight: '94%' }}>
        <View style={styles.popup}>
          <View style={styles.popupHeader}>
            <View style={styles.popupHeading}>
              {homeLink}
              <Text accessibilityRole="header" style={styles.popupTitle}>{title}</Text>
            </View>
            {showClose ? <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Close" style={styles.popupClose}>
              <ShopIcon name="close" color={C.purple}/>
            </Pressable> : null}
          </View>
          <ScrollView key={scrollKey} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: 26 }}>
            {children}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </View>
  </Modal>;
}
function Choice({label,selected,onPress}:{label:string;selected:boolean;onPress:()=>void}){return <TouchableOpacity accessibilityRole="button" accessibilityState={{selected}} onPress={onPress} style={[styles.choice,selected&&styles.choiceSelected]}><Text style={{color:selected?C.white:C.purple,fontWeight:'800',fontSize:12}}>{label}</Text></TouchableOpacity>}
function ConfirmRow({checked,label,onPress}:{checked:boolean;label:string;onPress:()=>void}){return <TouchableOpacity accessibilityRole="checkbox" accessibilityState={{checked}} onPress={onPress} style={styles.confirmRow}><View style={[styles.checkbox,checked&&styles.checkboxOn]}><Text style={{color:'white',fontWeight:'900'}}>{checked?'✓':''}</Text></View><Text style={[styles.small,{flex:1,fontSize:13,lineHeight:19,color:C.ink}]}>{label}</Text></TouchableOpacity>}
function PickupPolicyCard(){return <View style={styles.policyCard}><View style={{flexDirection:'row',gap:7,flexWrap:'wrap',marginBottom:10}}><Pill label="WA ONLY" tone="green"/><Pill label="PICKUP ONLY" tone="gold"/><Pill label="CURRENT PHOTO ID" tone="red"/></View><Text style={styles.itemTitle}>No delivery — collection at a WA pickup point only</Text><Text style={[styles.small,{marginTop:6}]}>BottleFlow requires the named collector to be 18+ and show current original photo ID (or original digital ID where issued digitally). Photos and screenshots of physical ID are not accepted. Service is refused if the collector appears intoxicated.</Text></View>}
function WAComplianceCard(){return <View style={[styles.card,{marginBottom:16,backgroundColor:'#F2F8F5',borderColor:'#CFE5D9'}]}><View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center',gap:8}}><Text style={styles.itemTitle}>WA pickup rules</Text><Pill label="CHECKED 24 NOV 2026" tone="green"/></View><Text style={[styles.small,{marginTop:8}]}>Under-18s cannot buy alcohol. Approved current photo ID may be requested, and liquor cannot be supplied to an intoxicated person. Store hours and final service remain subject to the licensed premises and its licence conditions.</Text><TouchableOpacity onPress={()=>Linking.openURL(WA_PROOF_OF_AGE_URL)} style={{marginTop:9}}><Text style={styles.link}>Read official WA proof-of-age guidance ↗</Text></TouchableOpacity><Text style={[styles.small,{marginTop:8}]}>BottleFlow’s pickup-only model and weekly spending reminder are app policies, not WA legal limits.</Text></View>}
function WeeklyBudgetCard({limit,spent,projected}:{limit:number;spent:number;projected?:number}){const remaining=Math.max(0,limit-spent);const over=typeof projected==='number'&&projected>limit;return <View style={[styles.card,{marginBottom:16,backgroundColor:over?'#FBE8E9':'#EEF6FF',borderColor:over?'#E6B6BD':'#C7DCF2'}]}><View style={styles.totalRow}><View><Text style={styles.itemTitle}>Weekly spending reminder</Text><Text style={styles.small}>Saved on this device · resets Monday</Text></View><Text style={[styles.itemTitle,{fontSize:20,color:over?C.red:C.purple}]}>{formatAUD(limit)}</Text></View><Text style={styles.small}>{formatAUD(spent)} in pending/completed requests · {formatAUD(remaining)} remaining</Text>{typeof projected==='number'?<Text style={[styles.small,{marginTop:5,fontWeight:'800',color:over?C.red:C.green}]}>With this cart: {formatAUD(projected)} {over?'· over your reminder':'· within your reminder'}</Text>:null}<Text style={[styles.small,{marginTop:6}]}>This is a voluntary BottleFlow planning tool, not a WA law or payment limit.</Text></View>}
function PickupLocationOptions({ selected, onSelect }: {
  selected: string; onSelect: (locationId: string) => void;
}) {
  return <>{WA_PICKUP_LOCATIONS.map(location => {
    const checked = selected === location.id;
    return <TouchableOpacity key={location.id} accessibilityRole="radio" accessibilityState={{ checked }}
      onPress={() => onSelect(location.id)} style={[styles.pickupLocationOption, checked && styles.pickupLocationOptionSelected]}>
      <ShopIcon name="pin" color={checked ? C.purple : C.muted}/>
      <View style={{ flex: 1 }}>
        <Text style={styles.itemTitle}>{location.name}</Text>
        <Text style={styles.small}>{location.address}</Text>
        <Text style={styles.small}>{location.hours}</Text>
      </View>
      <View style={[styles.radio, checked && styles.radioOn]}>{checked ? <View style={styles.radioDot}/> : null}</View>
    </TouchableOpacity>;
  })}</>;
}

function PickupLocationPopup({ current, onConfirm, onClose }: {
  current: string; onConfirm: (locationId: string) => void; onClose?: () => void;
}) {
  const [selected, setSelected] = useState(current);
  return <Popup title="Choose your pickup point" onClose={onClose || (() => {})} showClose={!!onClose}>
    <Text style={[styles.small, { marginBottom: 13 }]}>Choose where to collect in Western Australia.</Text>
    <PickupLocationOptions selected={selected} onSelect={setSelected}/>
    <View style={{ marginTop: 7 }}><PrimaryButton title="Use this pickup point" disabled={!selected} onPress={() => onConfirm(selected)}/></View>
  </Popup>;
}

function PickupProgress({ status }: { status: CollectionRequest['status'] }) {
  const outcome = {
    pending: { title: 'Awaiting pickup', detail: 'The named collector needs their original photo ID at the counter.', icon: 'pin', color: C.purple },
    completed: { title: 'Pickup completed', detail: 'Staff recorded the photo ID check and collection.', icon: 'check', color: C.green },
    declined: { title: 'Request declined', detail: 'This request is closed. Contact the store if you need help.', icon: 'close', color: C.red },
  } as const;
  const current = outcome[status];
  return <View style={styles.pickupProgress} accessibilityLiveRegion="polite">
    <View style={styles.pickupProgressRow}>
      <View style={styles.pickupProgressMark}><ShopIcon name="check" color={C.green}/></View>
      <Text style={[styles.itemTitle, styles.pickupProgressLabel]}>Request received</Text>
    </View>
    <View style={styles.pickupProgressRow}>
      <View style={styles.pickupProgressMark}><ShopIcon name={current.icon} color={current.color}/></View>
      <View style={styles.pickupProgressLabel}>
        <Text style={[styles.itemTitle, { color: current.color }]}>{current.title}</Text>
        <Text style={styles.small}>{current.detail}</Text>
      </View>
    </View>
  </View>;
}

function PickupRequestDetails({ locationName, locationAddress, window, collector }: Partial<PickupDetails>) {
  if (!locationName) return <Text style={[styles.error, { marginBottom: 9 }]}>Pickup details were not recorded for this request.</Text>;
  return <View style={styles.pickupSummary}>
    <Text style={styles.itemTitle}>{locationName}</Text>
    <Text style={styles.small}>{[locationAddress, window].filter(Boolean).join(' · ')}</Text>
    {collector?.fullName ? <Text style={[styles.small, { marginTop: 5, color: C.ink }]}>
      Collector: {collector.fullName} ({collector.type === 'nominee' ? 'nominated adult' : 'account holder'})
    </Text> : <Text style={styles.small}>Collector details unavailable</Text>}
    <Text style={[styles.small, { color: C.purple, fontWeight: '800' }]}>
      {collector?.idType ? `Bring original photo ID · ${collector.idType}` : 'Original photo ID required'}
    </Text>
  </View>;
}

function PickupDemo({ onClose }: { onClose: () => void }) {
  const [locationId, setLocationId] = useState('');
  const [status, setStatus] = useState<'pending' | 'completed' | null>(null);
  const [nominee, setNominee] = useState(true);
  const location = WA_PICKUP_LOCATIONS.find(item => item.id === locationId);

  return <Popup title="Pickup demo" onClose={onClose} scrollKey={status ?? 'location'}>
    <View style={styles.pickupDemoBanner}><Pill label="PRACTICE · SAMPLE DATA" tone="gold"/></View>
    {location && status ? <>
      <PickupProgress status={status}/>
      <PickupRequestDetails locationName={location.name} locationAddress={location.address} window={PICKUP_WINDOWS[1]}
        collector={{ type: nominee ? 'nominee' : 'self', fullName: nominee ? 'Casey Taylor' : 'Jamie Morgan', idType: PHOTO_ID_TYPES[0] }}/>
      <View style={[styles.card, styles.pickupDemoProduct]}>
        <Image accessible={false} source={productImages['great-northern-original']} style={styles.pickupDemoImage} resizeMode="contain"/>
        <View style={styles.pickupProgressLabel}>
          <Text style={styles.itemTitle}>Great Northern Original Lager</Text>
          <Text style={styles.small}>1 × 6-pack · Pay at pickup</Text>
        </View>
      </View>
      {status === 'pending' ?
        <PrimaryButton title="Simulate ID check and pickup" onPress={() => setStatus('completed')}/> :
        <PrimaryButton title="Start again" onPress={() => { setStatus(null); setLocationId(''); setNominee(true); }}/>}
    </> : <>
      <Text style={styles.stepTitle}>Choose a WA pickup point</Text>
      <PickupLocationOptions selected={locationId} onSelect={setLocationId}/>
      <Text style={styles.stepTitle}>Who will collect?</Text>
      <View style={[styles.checkoutChoices, styles.pickupDemoChoices]}>
        <Choice label="I’ll collect" selected={!nominee} onPress={() => setNominee(false)}/>
        <Choice label="Another adult" selected={nominee} onPress={() => setNominee(true)}/>
      </View>
      <PrimaryButton title="Preview sample request" disabled={!location} onPress={() => setStatus('pending')}/>
    </>}
  </Popup>;
}
function CheckoutPopup({
  profileName, total, busy, initialLocationId, weeklyLimit, weeklySpent, preferredPayment, onSubmit, onClose,
}: {
  profileName: string;
  total: number;
  busy: boolean;
  initialLocationId: string;
  weeklyLimit: number;
  weeklySpent: number;
  preferredPayment: PickupPaymentMethod | null;
  onSubmit: (pickup: PickupDetails, method: PickupPaymentMethod) => Promise<void>;
  onClose: () => void;
}) {
  const [step, setStep] = useState<'pickup' | 'review'>('pickup');
  const [locationId, setLocationId] = useState(initialLocationId);
  const [window, setWindow] = useState(PICKUP_WINDOWS[0]);
  const [collectorType, setCollectorType] = useState<'self' | 'nominee'>('self');
  const [collectorName, setCollectorName] = useState(profileName);
  const [collectorPhone, setCollectorPhone] = useState('');
  const [idType, setIdType] = useState(PHOTO_ID_TYPES[0]);
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [idConfirmed, setIdConfirmed] = useState(false);
  const [pickupConfirmed, setPickupConfirmed] = useState(false);
  const [budgetConfirmed, setBudgetConfirmed] = useState(false);
  const [method, setMethod] = useState(preferredPayment);

  const location = WA_PICKUP_LOCATIONS.find(item => item.id === locationId) || WA_PICKUP_LOCATIONS[0];
  const validName = collectorName.trim().length >= 2;
  const validPhone = collectorType === 'self' || (
    /^\+?[0-9 ()-]{8,20}$/.test(collectorPhone.trim()) && collectorPhone.replace(/\D/g, '').length >= 8
  );
  const projected = weeklySpent + total;
  const overBudget = projected > weeklyLimit;
  const canSubmit = validName && validPhone && ageConfirmed && idConfirmed && pickupConfirmed &&
    (!overBudget || budgetConfirmed) && !!method && !busy;

  function selectCollector(type: 'self' | 'nominee') {
    if (type === collectorType) return;
    setCollectorType(type);
    setCollectorName(type === 'self' ? profileName : '');
    setCollectorPhone('');
  }

  function submit() {
    if (!canSubmit || !method) return;
    void onSubmit({
      locationId: location.id, locationName: location.name, locationAddress: location.address, window,
      collector: { type: collectorType, fullName: collectorName, phone: collectorPhone, idType },
      waPickupOnly: true, photoIdRequired: true, ageConfirmed: true,
    }, method);
  }

  return <Popup title={step === 'pickup' ? 'Pickup details' : 'Review & payment'} scrollKey={step} onClose={onClose} showClose={!busy}>
    {step === 'pickup' ? <>
      <Text style={styles.checkoutStep}>STEP 1 OF 2</Text>
      <Text style={styles.stepTitle}>Pickup location</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
        {WA_PICKUP_LOCATIONS.map(item =>
          <Choice key={item.id} label={item.name} selected={locationId === item.id} onPress={() => setLocationId(item.id)}/>
        )}
      </ScrollView>
      <View style={[styles.card, { marginBottom: 16 }]}>
        <Text style={styles.itemTitle}>{location.name}</Text>
        <Text style={styles.small}>{location.address} · {location.hours}</Text>
      </View>
      <Text style={styles.stepTitle}>Preferred collection window</Text>
      <View style={styles.checkoutChoices}>
        {PICKUP_WINDOWS.map(item =>
          <Choice key={item} label={item.replace('Next available · ', '')} selected={window === item} onPress={() => setWindow(item)}/>
        )}
      </View>
      <Text style={styles.stepTitle}>Who will collect?</Text>
      <View style={styles.checkoutChoices}>
        <Choice label="I will collect" selected={collectorType === 'self'} onPress={() => selectCollector('self')}/>
        <Choice label="Nominate another adult" selected={collectorType === 'nominee'} onPress={() => selectCollector('nominee')}/>
      </View>
      <TxtInput label="Collector’s full legal name" value={collectorName} onChangeText={setCollectorName} autoCapitalize="words" placeholder="Name shown on photo ID"/>
      {collectorType === 'nominee' ?
        <TxtInput label="Nominated collector mobile" value={collectorPhone} onChangeText={setCollectorPhone} keyboardType="phone-pad" placeholder="04xx xxx xxx"/> : null}
      <Text style={styles.inputLabel}>Photo ID the collector will show</Text>
      <View style={styles.checkoutChoices}>
        {PHOTO_ID_TYPES.map(item =>
          <Choice key={item} label={item} selected={idType === item} onPress={() => setIdType(item)}/>
        )}
      </View>
      <PrimaryButton title="Continue to review" onPress={() => setStep('review')} disabled={!validName || !validPhone}/>
    </> : <>
      <Text style={styles.checkoutStep}>STEP 2 OF 2</Text>
      <View style={styles.checkoutSummary}>
        <Text style={styles.checkoutSummaryLocation}>{location.name}</Text>
        <Text style={styles.checkoutSummaryDetail}>{location.address} · {window}</Text>
        <Text style={styles.checkoutSummaryDetail}>Collecting: {collectorName.trim()}</Text>
        <View style={styles.checkoutTotal}>
          <Text style={styles.checkoutSummaryDetail}>Estimated total at pickup</Text>
          <Text style={styles.checkoutAmount}>{formatAUD(total)}</Text>
        </View>
      </View>
      <Text style={styles.stepTitle}>Pay at pickup</Text>
      <PickupPayment selected={method} onSelect={setMethod}/>
      {overBudget ? <WeeklyBudgetCard limit={weeklyLimit} spent={weeklySpent} projected={projected}/> : null}
      <Text style={styles.stepTitle}>Confirm collection</Text>
      <ConfirmRow checked={ageConfirmed} onPress={() => setAgeConfirmed(value => !value)} label="The named collector is 18 years or older."/>
      <ConfirmRow checked={idConfirmed} onPress={() => setIdConfirmed(value => !value)} label="The collector will show current original photo ID matching their name. Screenshots are not accepted."/>
      <ConfirmRow checked={pickupConfirmed} onPress={() => setPickupConfirmed(value => !value)} label="I understand this request is for pickup in Western Australia only."/>
      {overBudget ? <ConfirmRow checked={budgetConfirmed} onPress={() => setBudgetConfirmed(value => !value)} label={`I understand this request takes my voluntary weekly spending total to ${formatAUD(projected)}.`}/> : null}
      <Text style={[styles.small, { marginTop: 12, marginBottom: 14 }]}>The store confirms stock, price and collection time after you submit.</Text>
      <PrimaryButton title={busy ? 'Submitting…' : 'Submit pickup request'} onPress={submit} disabled={!canSubmit}/>
      {!busy ? <TouchableOpacity accessibilityRole="button" onPress={() => setStep('pickup')} style={styles.checkoutBack}>
        <Text style={styles.link}>Edit pickup details</Text>
      </TouchableOpacity> : null}
    </>}
  </Popup>;
}
function SetupPage() {
  const [pickupDemoOpen, setPickupDemoOpen] = useState(false);
  const missing = missingFirebaseConfig.join(', ') || 'Unknown';
  return <SafeAreaView style={[styles.full, { backgroundColor: C.dark, justifyContent: 'center', padding: 25 }]}>
    <Text style={[styles.heroTitle, { fontSize: 35 }]}>BottleFlow</Text>
    <Text style={styles.setupTitle}>One last connection</Text>
    <Text style={styles.setupCopy}>Connect Firebase to sign in and use live requests. Add the project settings in .env, then restart Expo.</Text>
    <Text style={[styles.setupCopy, { marginVertical: 16 }]}>{missing}</Text>
    <PrimaryButton title="Try pickup demo" onPress={() => setPickupDemoOpen(true)}/>
    {pickupDemoOpen ? <PickupDemo onClose={() => setPickupDemoOpen(false)}/> : null}
  </SafeAreaView>;
}
function AuthPage() {
  const [registerMode, setRegisterMode] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [pickupDemoOpen, setPickupDemoOpen] = useState(false);

  async function run(mode: 'auth' | 'reset') {
    try {
      setLoading(true);
      if (mode === 'reset') {
        await resetPassword(email);
        Alert.alert('Reset email sent', 'Check your inbox for a password-reset link.');
      } else if (registerMode) {
        await register(name, email, password);
      } else {
        await login(email, password);
      }
    } catch (error) {
      Alert.alert('Unable to continue', readableError(error));
    } finally {
      setLoading(false);
    }
  }

  return <SafeAreaView style={styles.authScreen}>
    <StatusBar barStyle="light-content"/>
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.authContent}>
        <View style={styles.authHero}>
          <Image source={brandImages.hero} resizeMode="cover" style={styles.photoHeroImage}/>
          <View style={styles.authHeroTint}/>
          <View>
            <Text style={styles.authKicker}>WA PICKUP</Text>
            <Text accessibilityRole="header" style={styles.authBrand}>BottleFlow</Text>
          </View>
        </View>
        <View style={styles.authCard}>
          <Text accessibilityRole="header" style={styles.authTitle}>{registerMode ? 'Create an account' : 'Welcome back'}</Text>
          <Text style={styles.authIntro}>{registerMode ? 'Create your account to request a pickup.' : 'Sign in to shop and track your pickups.'}</Text>
          {registerMode ? <TxtInput label="Full name" value={name} onChangeText={setName} autoCapitalize="words" placeholder="Your legal name"/> : null}
          <TxtInput label="Email address" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" placeholder="you@example.com"/>
          <TxtInput label="Password" value={password} onChangeText={setPassword} secureTextEntry placeholder={registerMode ? 'At least 6 characters' : 'Your password'}/>
          {!registerMode ? <Pressable accessibilityRole="button" disabled={loading} onPress={() => void run('reset')} style={styles.authReset}>
            <Text style={styles.link}>Forgot your password?</Text>
          </Pressable> : null}
          <PrimaryButton disabled={loading} title={loading ? 'Please wait…' : registerMode ? 'Create account' : 'Sign in'} onPress={() => void run('auth')}/>
          <Pressable accessibilityRole="button" disabled={loading} onPress={() => setRegisterMode(value => !value)} style={styles.authSwitch}>
            <Text style={styles.link}>{registerMode ? 'Already have an account? Sign in' : 'Create a free account'}</Text>
          </Pressable>
          <Pressable accessibilityRole="button" disabled={loading} onPress={() => setPickupDemoOpen(true)} style={styles.demoLink}>
            <Text style={styles.link}>Try pickup demo</Text>
          </Pressable>
        </View>
        <Text style={styles.authFoot}>Western Australia pickup only. Original photo ID required.</Text>
      </ScrollView>
    </KeyboardAvoidingView>
    {pickupDemoOpen ? <PickupDemo onClose={() => setPickupDemoOpen(false)}/> : null}
  </SafeAreaView>;
}
function ProductEditor({product,done,cancel}:{product:Product|null;done:()=>void;cancel:()=>void}){const [sku,setSku]=useState(product?.sku||'');const [name,setName]=useState(product?.name||'');const[category,setCategory]=useState(product?.category||'Beer');const[price,setPrice]=useState(product?(product.priceCents/100).toFixed(2):'');const[stock,setStock]=useState('0');const[minStock,setMinStock]=useState(String(product?.minStock??5));const[supplier,setSupplier]=useState(product?.supplier||'');const[imageUrl,setImageUrl]=useState(product?.imageUrl||'');const[packSize,setPackSize]=useState(product?.packSize||'');const[abv,setAbv]=useState(product?.abv||'');const[description,setDescription]=useState(product?.description||'');const[active,setActive]=useState(product?.active??true);const[busy,setBusy]=useState(false);
 const save=async()=>{try{setBusy(true);if(product)await editProduct(product.id,{name,category,price,minStock,supplier,imageUrl,packSize,abv,description,active});else await createProduct({sku,name,category,price,stock,minStock,supplier,imageUrl,packSize,abv,description});done();}catch(e){Alert.alert('Cannot save product',readableError(e));}finally{setBusy(false);}};
 return <Popup title={product?'Edit product':'New product'} onClose={cancel}><TxtInput label="SKU (unique)" value={sku} onChangeText={setSku} autoCapitalize="none" editable={!product} placeholder="EG-001"/><TxtInput label="Product name" value={name} onChangeText={setName} placeholder="e.g. Lager 6 Pack"/><TxtInput label="Category" value={category} onChangeText={setCategory} placeholder="Beer / Premix / Wine / Spirits / Cider"/><TxtInput label="Pack size" value={packSize} onChangeText={setPackSize} placeholder="e.g. 6 × 375mL cans"/><TxtInput label="Alcohol content" value={abv} onChangeText={setAbv} placeholder="e.g. 4.2% ABV"/><TxtInput label="Description" value={description} onChangeText={setDescription} multiline placeholder="Short product description"/><TxtInput label="Price (AUD)" value={price} onChangeText={setPrice} keyboardType="decimal-pad" placeholder="19.90"/>{!product?<TxtInput label="Opening stock" value={stock} onChangeText={setStock} keyboardType="number-pad"/>:null}<TxtInput label="Low stock threshold" value={minStock} onChangeText={setMinStock} keyboardType="number-pad"/><TxtInput label="Supplier" value={supplier} onChangeText={setSupplier}/><TxtInput label="Optional HTTPS photo URL" value={imageUrl} onChangeText={setImageUrl} autoCapitalize="none" placeholder="https://..."/>{product?<View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginBottom:18}}><Text style={styles.itemTitle}>Active in catalogue</Text><Switch value={active} onValueChange={setActive} trackColor={{true:C.purple}}/></View>:null}<PrimaryButton title={busy?'Saving…':'Save product'} onPress={save} disabled={busy}/><View style={{height:10}}/><PrimaryButton title="Cancel" onPress={cancel} subtle/></Popup>}
function StockEditor({product,uid,done,cancel}:{product:Product;uid:string;done:()=>void;cancel:()=>void}){const[qty,setQty]=useState('1');const[reason,setReason]=useState('Delivery received');const[busy,setBusy]=useState(false);const save=async()=>{try{setBusy(true);await receiveStock(product,qty,reason,uid);done();}catch(e){Alert.alert('Stock not updated',readableError(e));}finally{setBusy(false);}};return <Popup title="Receive inventory" onClose={cancel}><Text style={[styles.small,{marginBottom:18}]}>{product.name} · Current quantity: {product.stock}</Text><TxtInput label="Quantity received" value={qty} onChangeText={setQty} keyboardType="number-pad"/><TxtInput label="Reason / delivery reference" value={reason} onChangeText={setReason}/><PrimaryButton title={busy?'Saving…':'Add stock'} onPress={save} disabled={busy}/></Popup>}
function PhotoPicker({close}:{close:()=>void}){const[uri,setUri]=useState('');const[picking,setPicking]=useState(false);const pick=async(camera:boolean)=>{try{setPicking(true);const permission=camera?await ImagePicker.requestCameraPermissionsAsync():await ImagePicker.requestMediaLibraryPermissionsAsync();if(permission.status!=='granted'){Alert.alert('Permission needed','Please allow camera or photo access in device settings.');return;}const result=camera?await ImagePicker.launchCameraAsync({mediaTypes:['images'],quality:0.7}):await ImagePicker.launchImageLibraryAsync({mediaTypes:['images'],quality:0.7});if(!result.canceled&&result.assets?.[0])setUri(result.assets[0].uri);}catch(e){Alert.alert('Photo unavailable',readableError(e));}finally{setPicking(false);}};return <Popup title="Camera & gallery" onClose={close}><Text style={styles.small}>Capture a product photo or select one from your gallery. Photos are previewed locally, not uploaded or shared through Firebase Storage.</Text><View style={{height:15}}/><PrimaryButton disabled={picking} title="📷 Take a photo" onPress={()=>pick(true)}/><View style={{height:8}}/><PrimaryButton disabled={picking} title="🖼 Choose from gallery" onPress={()=>pick(false)} subtle/>{uri?<Image source={{uri}} style={{height:280,width:'100%',borderRadius:18,marginTop:20}} resizeMode="contain"/>:<Empty title="No photo selected" description="Your photo preview will appear here."/>}</Popup>}
function App(){const[user,setUser]=useState<User|null>(null);const[loading,setLoading]=useState(true);useEffect(()=>{if(!auth){setLoading(false);return;}return onAuthStateChanged(auth,user=>{setUser(user);setLoading(false);},e=>{Alert.alert('Authentication error',readableError(e));setLoading(false);});},[]);if(!configured)return <SetupPage/>;if(loading)return <View style={[styles.full,{justifyContent:'center'}]}><ActivityIndicator color={C.purple} size="large"/></View>;return user?<Workspace key={user.uid} user={user}/>:<AuthPage/>}
function Workspace({user}:{user:User}){
 const [filtersOpen, setFiltersOpen] = useState(false);
 const [pickupDemoOpen, setPickupDemoOpen] = useState(false);
 const [profilePolicyOpen, setProfilePolicyOpen] = useState(false);
 const [specialsOnly, setSpecialsOnly] = useState(false);
 const [focusBrowseSearch, setFocusBrowseSearch] = useState(false);
 const [cartHydration, setCartHydration] = useState<'loading' | 'ready' | 'failed'>('loading');
 const [cartNotice, setCartNotice] = useState<{ title: string; productName: string } | null>(null);
 const [paymentPreviewOpen, setPaymentPreviewOpen] = useState(false);
 const [preferredPayment, setPreferredPayment] = useState<PickupPaymentMethod | null>(null);
 const checkoutInProgress = useRef(false);
 const paymentStorageKey = `bottleflow-pickup-payment:${user.uid}`;
 useEffect(() => {
   let active = true;
   void AsyncStorage.getItem(paymentStorageKey).then(value => {
     if (active) setPreferredPayment(parsePickupPayment(value));
   }).catch(() => {});
   return () => { active = false; };
 }, [paymentStorageKey]);
 function savePaymentPreference(method: PickupPaymentMethod) {
   setPreferredPayment(method);
   void AsyncStorage.setItem(paymentStorageKey, method).catch(() => {});
 }
 const [profile,setProfile]=useState<Profile|null>(null);const[profileLoading,setProfileLoading]=useState(true);const[screen,setScreen]=useState('Home');const[search,setSearch]=useState('');const[category,setCategory]=useState('All');const[sortMode,setSortMode]=useState<SortMode>('featured');const[inStockOnly,setInStockOnly]=useState(true);const[visibleLimit,setVisibleLimit]=useState(24);
 const[selected,setSelected]=useState<Product|null>(null);const[selectedPackUnits,setSelectedPackUnits]=useState(1);const[editor,setEditor]=useState<Product|null|'new'>(null);const[stockEdit,setStockEdit]=useState<Product|null>(null);const[photoOpen,setPhotoOpen]=useState(false);const[checkoutOpen,setCheckoutOpen]=useState(false);const[locationPickerOpen,setLocationPickerOpen]=useState(false);const[preferredLocationId,setPreferredLocationId]=useState('');const[locationLoaded,setLocationLoaded]=useState(false);const[cart,setCart]=useState<CartLine[]>([]);const[weeklyBudgetCents,setWeeklyBudgetCents]=useState(10000);const[busy,setBusy]=useState(false);const[settingsOpen,setSettingsOpen]=useState(false);
 const [nameEdit,setNameEdit]=useState(false);const[customerName,setCustomerName]=useState('');const[supplierOpen,setSupplierOpen]=useState(false);const[supplierName,setSupplierName]=useState('');const[supplierEmail,setSupplierEmail]=useState('');const[supplierPhone,setSupplierPhone]=useState('');
 const {settings}=useStoreSettings();const [storeName,setStoreName]=useState('');const [storeEmail,setStoreEmail]=useState('');const [storePhone,setStorePhone]=useState('');
 const screenScroll = useRef<React.ComponentRef<typeof ScrollView>>(null);
 const shopName = settings.shopName || 'BottleFlow';
 useEffect(()=>{if(!db)return;return onSnapshot(doc(db,'users',user.uid),snap=>{setProfile(snap.exists()?{...(snap.data() as Omit<Profile,'id'>),id:snap.id}:null);setProfileLoading(false);},e=>{Alert.alert('Profile read error',readableError(e));setProfileLoading(false);});},[user.uid]);
 useEffect(() => {
   let active = true;
   void AsyncStorage.getItem(`bottleflow-cart:${user.uid}`).then(raw => {
     if (!active) return;
     const stored: unknown = raw ? JSON.parse(raw) : [];
     if (Array.isArray(stored)) setCart(stored.filter(item => item && typeof item.productId === 'string'
       && Number.isInteger(item.quantity) && item.quantity > 0 && [1, 2, 4, 6, 24].includes(item.packUnits || 1)));
     setCartHydration('ready');
   }).catch(() => { if (active) setCartHydration('failed'); });
   return () => { active = false; };
 }, [user.uid]);
 useEffect(() => {
   if (cartHydration === 'ready') void AsyncStorage.setItem(`bottleflow-cart:${user.uid}`, JSON.stringify(cart)).catch(() => {});
 }, [user.uid, cart, cartHydration]);
 useEffect(()=>{AsyncStorage.getItem(`bottleflow-pickup:${user.uid}`).then(value=>{if(value&&WA_PICKUP_LOCATIONS.some(location=>location.id===value))setPreferredLocationId(value);}).catch(()=>{}).finally(()=>setLocationLoaded(true));},[user.uid]);
 useEffect(()=>{AsyncStorage.getItem(`bottleflow-weekly-budget:${user.uid}`).then(value=>{const cents=Number(value);if(Number.isSafeInteger(cents)&&cents>=5000&&cents<=100000)setWeeklyBudgetCents(cents);}).catch(()=>{});},[user.uid]);
 const manager=profile?.role==='manager';const productFeed=useLiveDocs<Product>('products',!profileLoading,manager?undefined:{field:'active',value:true});
 useEffect(()=>{if(locationLoaded&&!profileLoading&&!manager&&!preferredLocationId)setLocationPickerOpen(true);},[locationLoaded,profileLoading,manager,preferredLocationId]);
 const requestFeed=useLiveDocs<CollectionRequest>('requests',!profileLoading,manager?undefined:{field:'userId',value:user.uid});
 const saleFeed=useLiveDocs<Sale>('sales',!!manager);const movementFeed=useLiveDocs<Movement>('movements',!!manager);const supplierFeed=useLiveDocs<Supplier>('suppliers',!!manager);
 const products=useMemo(()=>deduplicateProducts(productFeed.data.map(product=>({...product,...presentationBySku.get(product.sku)})).sort((a,b)=>Number(!!b.imageKey)-Number(!!a.imageKey)||Number(b.sku.startsWith('BF-'))-Number(a.sku.startsWith('BF-'))||a.name.localeCompare(b.name))),[productFeed.data]);const requests=useMemo(()=>[...requestFeed.data].sort((a,b)=>(b.createdAt?.toMillis?.()||0)-(a.createdAt?.toMillis?.()||0)),[requestFeed.data]);
 const sales=useMemo(()=>[...saleFeed.data].sort((a,b)=>(b.createdAt?.toMillis?.()||0)-(a.createdAt?.toMillis?.()||0)),[saleFeed.data]);
 const categories=useMemo(()=>['All','Premium',...Array.from(new Set(products.filter(p=>p.active).map(p=>p.category))).sort()],[products]);
 const visibleProducts = useMemo(() => {
   const term = search.trim().toLowerCase();
   const matches = products.filter(product => {
     if (!manager && !product.active) return false;
     if (inStockOnly && product.stock <= 0) return false;
     if (specialsOnly && specialPercent(product) <= 0) return false;
     if (category !== 'All' && (category === 'Premium' ? !isPremium(product) : product.category !== category)) return false;
     const label = productLabel(product);
     return [label.name, label.description, product.name, product.sku, product.category, product.supplier, product.description]
       .filter(Boolean).join(' ').toLowerCase().includes(term);
   });
   return matches.sort((a, b) => {
     const alphabetical = a.name.localeCompare(b.name);
     if (sortMode === 'name') return alphabetical;
     if (sortMode === 'price-low' || sortMode === 'price-high') {
       const difference = defaultPackOption(a).priceCents - defaultPackOption(b).priceCents;
       return (sortMode === 'price-low' ? difference : -difference) || alphabetical;
     }
     const featured = category === 'All' ? Number(b.sku.startsWith('BF-')) - Number(a.sku.startsWith('BF-')) : 0;
     return featured || Number(isPremium(b)) - Number(isPremium(a)) || b.stock - a.stock || alphabetical;
   });
 }, [products, manager, category, search, inStockOnly, specialsOnly, sortMode]);
 const displayedProducts=visibleProducts.slice(0,visibleLimit);
 const featuredSpecials=useMemo(()=>['Beer','Wine','Spirits'].map(group=>products.filter(p=>p.active&&p.stock>0&&p.category===group&&specialPercent(p)>0).sort((a,b)=>Number(!!b.imageKey)-Number(!!a.imageKey)||specialPercent(b)-specialPercent(a)||Number(!!b.imageUrl)-Number(!!a.imageUrl)||a.name.localeCompare(b.name))[0]).filter((p):p is Product=>!!p),[products]);
 const popularPicks=useMemo(()=>products.filter(p=>p.active&&p.stock>0&&!!p.imageKey).sort((a,b)=>a.name.localeCompare(b.name)).slice(0,8),[products]);
 const collectorPicks=useMemo(()=>products.filter(p=>p.active&&p.stock>0&&isPremium(p)).sort((a,b)=>b.priceCents-a.priceCents).slice(0,8),[products]);
 useEffect(() => setVisibleLimit(24), [category, search, inStockOnly, specialsOnly, sortMode]);
 useEffect(() => {
   if (!cartNotice) return;
   const timer = setTimeout(() => setCartNotice(null), 5000);
   return () => clearTimeout(timer);
 }, [cartNotice]);
 const cartProducts = cart.flatMap(line => {
   const product = products.find(current => current.id === line.productId && current.active);
   if (!product) return [];
   const option = packOptions(product).find(current => current.units === (line.packUnits || 1));
   return option ? [{ ...line, product, option }] : [];
 });
 const unavailableLines = cart.filter(line => !cartProducts.some(current => current.productId === line.productId));
 const cartStockChanged = cartProducts.some(({ product, quantity, option }) => quantity * option.units > product.stock);
 const estimatedTotal=cartProducts.reduce((sum,line)=>sum+line.quantity*line.option.priceCents,0);
 const lowStock=products.filter(p=>p.active&&p.stock<=p.minStock);
 const pending=requests.filter(r=>r.status==='pending');
 const preferredLocation=WA_PICKUP_LOCATIONS.find(location=>location.id===preferredLocationId);
 const weekStartMillis=startOfLocalWeek().getTime();
 const weeklySpentCents=requests.filter(r=>r.status!=='declined'&&(r.createdAt?.toMillis?.()||0)>=weekStartMillis).reduce((sum,r)=>{if(r.status==='completed'&&Number.isSafeInteger(r.totalCents))return sum+(r.totalCents||0);return sum+r.items.reduce((requestTotal,line)=>{const product=products.find(p=>p.id===line.productId);if(!product)return requestTotal;try{return requestTotal+line.quantity*packOption(product,line.packUnits||1).priceCents;}catch{return requestTotal;}},0);},0);
 const projectedWeeklyCents=weeklySpentCents+estimatedTotal;
 const alertErr=(title:string,e:unknown)=>Alert.alert(title,readableError(e));
 const priorPack = selected ? cart.find(line => line.productId === selected.id) : undefined;
 const changingPack = !!priorPack && (priorPack.packUnits || 1) !== selectedPackUnits;
 function showProduct(product: Product) {
   setCartNotice(null);
   setSelectedPackUnits(defaultPackOption(product).units);
   setSelected(product);
 }
 function addToCart(product: Product, units: number) {
   if (cartHydration === 'loading') return;
   const live = products.find(current => current.id === product.id);
   const maxPacks = live?.active ? Math.min(20, Math.floor(live.stock / units)) : 0;
   if (!maxPacks) {
     Alert.alert('Not enough stock', 'This pack is currently unavailable.');
     return;
   }
   const existing = cart.find(line => line.productId === product.id);
   if (existing && (existing.packUnits || 1) === units && existing.quantity >= maxPacks) {
     Alert.alert('Cart limit reached', 'Your cart already contains the maximum available quantity of this pack.');
     return;
   }
   setCart(previous => {
     const line = previous.find(item => item.productId === product.id);
     if (!line) return [...previous, { productId: product.id, quantity: 1, packUnits: units }];
     return previous.map(item => item === line ? {
       ...item, packUnits: units,
       quantity: (item.packUnits || 1) === units ? Math.min(maxPacks, item.quantity + 1) : 1,
     } : item);
   });
   setSelected(null);
   setCartNotice({
     title: existing && (existing.packUnits || 1) !== units ? 'Pack updated' : 'Added to cart',
     productName: product.name,
   });
 }
 const adjustCart=(id:string,delta:number)=>setCart(old=>old.map(line=>{if(line.productId!==id)return line;const product=products.find(p=>p.id===id);const max=product?Math.min(20,Math.max(1,Math.floor(product.stock/(line.packUnits||1)))):20;return {...line,quantity:Math.min(max,line.quantity+delta)};}).filter(x=>x.quantity>0));
 const saveWeeklyBudget=(cents:number)=>{setWeeklyBudgetCents(cents);AsyncStorage.setItem(`bottleflow-weekly-budget:${user.uid}`,String(cents)).catch(()=>{});};
 const savePreferredLocation=(locationId:string)=>{if(!WA_PICKUP_LOCATIONS.some(location=>location.id===locationId))return;setPreferredLocationId(locationId);setLocationPickerOpen(false);AsyncStorage.setItem(`bottleflow-pickup:${user.uid}`,locationId).catch(()=>{});};
 async function checkout(pickup: PickupDetails, method: PickupPaymentMethod) {
   if (checkoutInProgress.current) return;
   checkoutInProgress.current = true;
   try {
     setBusy(true);
     if (cartStockChanged) throw new Error('Stock has changed. Update the quantities in your cart before submitting.');
     const valid = cartProducts.map(({ productId, quantity, packUnits }) => ({ productId, quantity, packUnits: packUnits || 1 }));
     if (valid.length !== cart.length) throw new Error('Some products in your cart are unavailable. Remove them before submitting.');
     const requestId = await submitRequest(user.uid, valid, pickup);
     savePreferredLocation(pickup.locationId);
     savePaymentPreference(method);
     setCart([]);
     setCheckoutOpen(false);
     setScreen('Requests');
     Alert.alert('Pickup request submitted', `Request ${requestReference(requestId)} · ${pickup.locationName}. Planned payment: ${pickupPaymentLabel(method)} at pickup. The named collector must show original photo ID.`);
   } catch (error) {
     alertErr('Request failed', error);
   } finally {
     checkoutInProgress.current = false;
     setBusy(false);
   }
 }
 const completePickup=async(r:CollectionRequest)=>{try{setBusy(true);const total=await completeRequest(r,user.uid);Alert.alert('Pickup completed',`Photo ID check recorded, stock updated and ${formatAUD(total)} recorded.`);}catch(e){alertErr('Could not complete pickup',e);}finally{setBusy(false);}};
 const actionRequest=async(r:CollectionRequest,approve:boolean)=>{if(approve){Alert.alert('Compulsory photo ID check',`Confirm the collector is 18+ and the original photo ID matches “${r.collector?.fullName||'the named collector'}”. Do not hand over the order if it does not match.`,[{text:'Cancel',style:'cancel'},{text:'ID checked — hand over',onPress:()=>completePickup(r)}]);return;}try{setBusy(true);await declineRequest(r.id);Alert.alert('Request declined','The customer can see the updated status.');}catch(e){alertErr('Could not process request',e);}finally{setBusy(false);}};
 const setupDemo=async()=>{try{setBusy(true);const result=await seedCatalogProducts();Alert.alert('WA catalogue ready',`${result.created} products added, ${result.updated} refreshed and ${result.retired} duplicate listing${result.retired===1?'':'s'} retired. The catalogue now contains ${result.total} unique photo-backed records.`);}catch(e){alertErr('Import failed',e);}finally{setBusy(false);}};
 function goto(name: string) {
   if (!manager && !preferredLocationId && name !== 'Home' && name !== 'Profile') {
     setLocationPickerOpen(true);
     return;
   }
   setFocusBrowseSearch(false);
   setCartNotice(null);
   setScreen(name);
   setSelected(null);
   if (name === 'Home' && screen === 'Home') screenScroll.current?.scrollTo({ y: 0, animated: true });
 }
 const goHome = () => goto('Home');
 function openBrowse(nextCategory = 'All', options: { specials?: boolean; focus?: boolean } = {}) {
   if (!preferredLocationId) {
     setLocationPickerOpen(true);
     return;
   }
   setCategory(nextCategory);
   setSearch('');
   setSortMode('featured');
   setInStockOnly(true);
   setSpecialsOnly(!!options.specials);
   goto('Browse');
   setFocusBrowseSearch(!!options.focus);
 }
 const openSettings=()=>{setStoreName(settings.shopName||'BottleFlow');setStoreEmail(settings.supportEmail||'');setStorePhone(settings.supportPhone||'');setSettingsOpen(true);};
 const handleSaveSettings=async()=>{try{setBusy(true);await saveStoreSettings({shopName:storeName,supportEmail:storeEmail,supportPhone:storePhone});setSettingsOpen(false);}catch(e){alertErr('Settings not saved',e);}finally{setBusy(false);}};
 const callSupport=async(url:string)=>{try{await Linking.openURL(url);}catch{Alert.alert('Cannot open contact app','Set up a mail or phone app on your device.');}};
 const handleName=async()=>{try{setBusy(true);await changeName(user.uid,customerName);setNameEdit(false);}catch(e){alertErr('Update failed',e);}finally{setBusy(false);}};
 const handleSupplier=async()=>{try{setBusy(true);await addSupplier(supplierName,supplierEmail,supplierPhone);setSupplierOpen(false);setSupplierName('');setSupplierEmail('');setSupplierPhone('');}catch(e){alertErr('Supplier not saved',e);}finally{setBusy(false);}};
 const screenBody=()=>{
  if (screen === 'Home' && manager) return <>
   <View style={styles.managerOverview}>
     <Text accessibilityRole="header" style={styles.managerTitle}>Store overview</Text>
     <TouchableOpacity accessibilityRole="button" onPress={() => goto('Products')} style={styles.heroCta}>
       <Text style={styles.itemTitle}>Manage products</Text>
     </TouchableOpacity>
   </View>
   <SectionTitle title="Overview"/><View style={styles.stats}><Stat label="Products" value={String(products.filter(p=>p.active).length)}/><Stat label="Pending pickups" value={String(pending.length)}/><Stat label="Low stock" value={String(lowStock.length)}/><Stat label="Recorded sales" value={formatAUD(sumSales(sales))}/></View><SectionTitle title="Quick actions"/><View style={styles.quickActions}>{[['+ Add product','new'],['↑ Receive stock','Stock'],['☷ Suppliers','Suppliers'],['⚙ Store details','Store']].map(([label,to])=><TouchableOpacity key={to} style={styles.quick} onPress={()=>to==='new'?setEditor('new'):to==='Store'?openSettings():goto(to)}><Text style={{color:C.purple,fontWeight:'800'}}>{label}</Text></TouchableOpacity>)}</View><SectionTitle title="Needs attention" right={<Pill label={`${lowStock.length} low stock`} tone={lowStock.length?'red':'green'}/>}/>{lowStock.length?lowStock.slice(0,5).map(p=><ProductCard key={p.id} product={p} onPress={() => showProduct(p)}/>):<Empty title="Stock looks healthy" description="Your low-stock alerts will show here."/>}<PrimaryButton title={busy?'Importing…':'Load real-world product catalogue'} onPress={setupDemo} subtle disabled={busy}/>
  </>;
  if (screen === 'Home') return <>
   <SearchField onOpen={() => openBrowse('All', { focus: true })}/>
   <ShopHero image={brandImages.hero} onShop={() => openBrowse()}/>
   <View style={styles.storefrontSection}>
     <ShopHeading title="Shop by category"/>
     <CategoryShelf categories={storefrontCategories} onSelect={name => openBrowse(name)}/>
   </View>
   {productFeed.loading ? <ActivityIndicator color={C.purple}/> : null}
   {productFeed.error ? <Text style={styles.error}>{productFeed.error}</Text> : null}
   <ProductShelf title="On special" action="All specials" products={featuredSpecials}
     onBrowse={() => openBrowse('All', { specials: true })} onProduct={showProduct}/>
   <ProductShelf title="The cellar" action="Browse cellar" products={collectorPicks}
     onBrowse={() => openBrowse('Premium')} onProduct={showProduct}/>
   <ProductShelf title="Popular picks" products={popularPicks} onProduct={showProduct}/>
  </>;
  if (screen === 'Browse' || screen === 'Products') return <>
   <View style={styles.browseTitle}>
     <ShopHeading title={manager ? 'Inventory catalogue' : 'Browse'}/>
     {manager ? <TouchableOpacity accessibilityRole="button" onPress={() => setEditor('new')}><Pill label="+ New product"/></TouchableOpacity> : null}
   </View>
   <SearchField value={search} onChange={setSearch} autoFocus={focusBrowseSearch}/>
   <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.categoryList}>
     {categories.map(name => <Pressable
       key={name} accessibilityRole="button" accessibilityState={{ selected: name === category }}
       onPress={() => setCategory(name)} style={[styles.category, name === category && styles.categorySelected]}
     ><Text style={[styles.categoryLabel, name === category && styles.categoryLabelActive]}>{name}</Text></Pressable>)}
   </ScrollView>
   <View style={styles.browseTools}>
     <View style={{ flexShrink: 1 }}>
       <Text accessibilityLiveRegion="polite" style={styles.results}>{visibleProducts.length} {visibleProducts.length === 1 ? 'product' : 'products'}</Text>
       {specialsOnly ? <TouchableOpacity accessibilityRole="button" accessibilityLabel="Remove specials filter" onPress={() => setSpecialsOnly(false)} style={styles.activeFilter}>
         <Text style={styles.link}>On special</Text><ShopIcon name="close" color={C.purple}/>
       </TouchableOpacity> : null}
     </View>
     <Pressable accessibilityRole="button" onPress={() => setFiltersOpen(true)} style={styles.filterButton}>
       <ShopIcon name="filters" color={C.purple}/><Text style={styles.filterButtonLabel}>Sort & filters</Text>
     </Pressable>
   </View>
   {productFeed.error ? <Text style={styles.error}>{productFeed.error}</Text> : null}
   {productFeed.loading ? <ActivityIndicator color={C.purple}/> : visibleProducts.length ? <>
     {manager ? displayedProducts.map(product =>
       <ProductCard key={product.id} product={product} onPress={() => showProduct(product)}/>
     ) : <View style={styles.catalogueGrid}>
       {displayedProducts.map(product => <CatalogueTile key={product.id} product={product} onPress={() => showProduct(product)}/>)}
     </View>}
     {displayedProducts.length < visibleProducts.length ? <PrimaryButton
       title={`Show ${Math.min(24, visibleProducts.length - displayedProducts.length)} more`}
       onPress={() => setVisibleLimit(limit => limit + 24)} subtle
     /> : null}
   </> : <><Empty title="No matching products" description="Try a different search or change your filters."/>
     <PrimaryButton title="Clear search and filters" onPress={() => {
       setSearch(''); setCategory('All'); setSortMode('featured'); setInStockOnly(false); setSpecialsOnly(false);
     }} subtle/>
   </>}
  </>;
  if (screen === 'Cart') return <>
   <ShopHeading title="Your cart"/>
   {preferredLocation ? <Pressable accessibilityRole="button" onPress={() => setLocationPickerOpen(true)} style={styles.cartPickup}>
     <ShopIcon name="pin" color={C.purple}/>
     <View style={{ flex: 1 }}>
       <Text style={styles.itemTitle}>Pickup from {preferredLocation.name}</Text>
       <Text style={styles.small}>{preferredLocation.address}</Text>
     </View>
     <ShopIcon name="chevron" color={C.purple}/>
   </Pressable> : null}
   {cartHydration === 'loading' || productFeed.loading ? <ActivityIndicator color={C.purple}/> :
   productFeed.error && !productFeed.data.length ? <Empty title="Your cart is saved" description="The catalogue is unavailable. Try again once the app reconnects."/> :
   cart.length ? <>
     {cartProducts.map(({ product, quantity, option }) => {
       const available = Math.floor(product.stock / option.units);
       return <View key={product.id} style={[styles.card, styles.cartLine]}>
         <View style={styles.cartLineTop}>
           <Thumb product={product} size={66}/>
           <View style={{ flex: 1 }}>
             <Text style={styles.itemTitle}>{product.name}</Text>
             <Text style={styles.small}>{[option.label, product.packSize].filter(Boolean).join(' · ')}</Text>
             {quantity > available ? <Text style={styles.error}>{available ? `Only ${available} available` : 'This pack is unavailable'}</Text> : null}
           </View>
           <Text style={styles.cartLinePrice}>{formatAUD(option.priceCents * quantity)}</Text>
         </View>
         <View style={styles.cartLineActions}>
           <View style={styles.cartStepper}>
             <Pressable accessibilityRole="button" accessibilityLabel={`Decrease quantity of ${product.name}`} onPress={() => adjustCart(product.id, -1)} style={styles.qty}><Text style={styles.itemTitle}>−</Text></Pressable>
             <Text style={styles.itemTitle}>{quantity}</Text>
             <Pressable accessibilityRole="button" accessibilityLabel={`Increase quantity of ${product.name}`} disabled={quantity >= Math.min(20, available)} onPress={() => adjustCart(product.id, 1)} style={[styles.qty, quantity >= Math.min(20, available) && styles.dimmed]}><Text style={styles.itemTitle}>+</Text></Pressable>
           </View>
           <Pressable accessibilityRole="button" accessibilityLabel={`Remove ${product.name}`} onPress={() => setCart(previous => previous.filter(line => line.productId !== product.id))}>
             <Text style={styles.link}>Remove</Text>
           </Pressable>
         </View>
       </View>;
     })}
     {unavailableLines.map(line => <View key={line.productId} style={[styles.card, styles.cartPickup]}>
       <View style={{ flex: 1 }}>
         <Text style={styles.itemTitle}>{products.find(product => product.id === line.productId)?.name || 'Product unavailable'}</Text>
         <Text style={styles.error}>Remove this item to continue.</Text>
       </View>
       <Pressable accessibilityRole="button" onPress={() => setCart(previous => previous.filter(item => item.productId !== line.productId))}>
         <Text style={styles.link}>Remove</Text>
       </Pressable>
     </View>)}
     {projectedWeeklyCents > weeklyBudgetCents ? <WeeklyBudgetCard limit={weeklyBudgetCents} spent={weeklySpentCents} projected={projectedWeeklyCents}/> : null}
     <View style={styles.cartSummary}>
       <View style={styles.cartTotalRow}>
         <View>
           <Text style={styles.itemTitle}>Estimated total</Text>
           <Text style={styles.small}>Pay at pickup</Text>
         </View>
         <Text style={styles.cartTotalPrice}>{formatAUD(estimatedTotal)}</Text>
       </View>
       <PrimaryButton title="Continue to pickup checkout" onPress={() => setCheckoutOpen(true)}
         disabled={busy || cartStockChanged || !!unavailableLines.length || !cartProducts.length}/>
     </View>
   </> : <>
     <Empty title="Your cart is empty" description="Add something to collect at your pickup point."/>
     <PrimaryButton title="Browse products" onPress={() => openBrowse()}/>
   </>}
  </>;
  if (screen === 'Requests') return <>
    <ShopHeading title={manager ? 'WA pickup requests' : 'My pickup requests'}
      action="Pickup demo" onPress={() => setPickupDemoOpen(true)}/>
    {requestFeed.error ? <Text style={styles.error}>{requestFeed.error}</Text> : null}
    {requestFeed.loading ? <ActivityIndicator color={C.purple}/> : requests.length ? requests.map(request => (
      <View key={request.id} style={[styles.card, styles.pickupRequestCard]}>
        <Text accessibilityRole="header" style={styles.itemTitle}>Request #{requestReference(request.id)}</Text>
        <Text style={styles.small}>{nowLabel(request.createdAt)}</Text>
        <PickupProgress status={request.status}/>
        <PickupRequestDetails {...request}/>
        {request.items.map((line, index) => {
          const product = products.find(item => item.id === line.productId);
          const units = line.packUnits || 1;
          const option = product && packOptions(product).find(item => item.units === units);
          const pack = option?.label || (units === 1 ? 'Single' : `Pack of ${units}`);
          return <Text key={`${line.productId}_${index}`} style={styles.small}>
            {line.quantity} × {product ? productLabel(product).name : line.productId} · {pack}
          </Text>;
        })}
        {request.status === 'completed' && typeof request.totalCents === 'number' ?
          <Text style={styles.pickupFinalTotal}>Recorded sale · {formatAUD(request.totalCents)}</Text> : null}
        {manager && request.status === 'pending' ? <View style={styles.pickupRequestActions}>
          <View style={{ flex: 1 }}>
            <PrimaryButton title={busy ? 'Working…' : 'Complete after ID check'} onPress={() => actionRequest(request, true)}
              disabled={busy || !request.collector}/>
          </View>
          <PrimaryButton title="Decline" onPress={() => actionRequest(request, false)} disabled={busy} subtle/>
        </View> : null}
      </View>
    )) : <Empty title="No pickup requests yet" description={manager ? 'New WA pickup requests will appear here.' : 'Your WA pickup requests will appear here.'}/>}
  </>;
  if(screen==='Reports'&&manager)return <><SectionTitle title="Reports" subtitle="Live totals from completed demo sales"/><View style={styles.stats}><Stat label="Sales total" value={formatAUD(sumSales(sales))}/><Stat label="Transactions" value={String(sales.length)}/><Stat label="Active SKUs" value={String(products.filter(p=>p.active).length)}/><Stat label="Low stock" value={String(lowStock.length)}/></View><SectionTitle title="Recent sales"/>{saleFeed.error?<Text style={styles.error}>{saleFeed.error}</Text>:null}{sales.length?sales.slice(0,20).map(s=><View style={[styles.card,{marginBottom:10}]} key={s.id}><View style={{flexDirection:'row',justifyContent:'space-between'}}><Text style={styles.itemTitle}>Sale #{s.id.slice(0,8)}</Text><Text style={{fontWeight:'900',color:C.purple}}>{formatAUD(s.totalCents)}</Text></View><Text style={styles.small}>{nowLabel(s.createdAt)} · {s.items.length} product lines</Text></View>):<Empty title="No completed sales" description="Approve a customer request to record the first sale."/>}<SectionTitle title="Best-selling items"/>{Object.entries(sales.flatMap(s=>s.items).reduce((acc,line)=>({...acc,[line.name]:(acc[line.name]||0)+line.quantity}),{} as Record<string,number>)).sort((a,b)=>b[1]-a[1]).slice(0,5).map(([name,count])=><View key={name} style={[styles.card,{marginBottom:7,flexDirection:'row',justifyContent:'space-between'}]}><Text style={styles.itemTitle}>{name}</Text><Text style={styles.small}>{count} sold</Text></View>)}</>;
  if(screen==='Stock'&&manager)return <><SectionTitle title="Stock movements" subtitle="Delivery receipts and recorded sales"/><PrimaryButton title="Choose product to receive stock" onPress={()=>goto('Products')}/><View style={{height:14}}/>{movementFeed.error?<Text style={styles.error}>{movementFeed.error}</Text>:null}{[...movementFeed.data].sort((a,b)=>(b.createdAt?.toMillis?.()||0)-(a.createdAt?.toMillis?.()||0)).map(m=><View style={[styles.card,{marginBottom:9,flexDirection:'row',alignItems:'center'}]} key={m.id}><View style={{flex:1}}><Text style={styles.itemTitle}>{products.find(p=>p.id===m.productId)?.name||m.productId}</Text><Text style={styles.small}>{m.reason}</Text><Text style={styles.small}>{nowLabel(m.createdAt)}</Text></View><Pill label={`${m.delta>0?'+':''}${m.delta}`} tone={m.delta>0?'green':'red'}/></View>)}{!movementFeed.data.length?<Empty title="No stock history" description="Receive a delivery or complete a request to create a movement."/>:null}</>;
  if(screen==='Suppliers'&&manager)return <><SectionTitle title="Suppliers" subtitle="Supplier contact records" right={<TouchableOpacity onPress={()=>setSupplierOpen(true)}><Pill label="+ Add"/></TouchableOpacity>}/>{supplierFeed.data.map(s=><View key={s.id} style={[styles.card,{marginBottom:11}]}><Text style={styles.itemTitle}>{s.name}</Text><Text style={styles.small}>{s.email||'No email'} · {s.phone||'No phone'}</Text></View>)}{!supplierFeed.data.length?<Empty title="No suppliers yet" description="Add a supplier to maintain your contact list."/>:null}<PrimaryButton title="Add supplier" onPress={()=>setSupplierOpen(true)} subtle/></>;
  if (screen === 'Profile') return <>
   <ShopHeading title="Profile"/>
   <View style={[styles.card, styles.profileAccount]}>
     <View style={styles.profileIcon}><ShopIcon name="account" color={C.purple}/></View>
     <View style={{ flex: 1 }}>
       <Text style={styles.itemTitle}>{profile?.displayName || user.displayName || 'Your account'}</Text>
       <Text style={styles.small}>{profile?.email || user.email}</Text>
       <TouchableOpacity accessibilityRole="button" onPress={() => {
         setCustomerName(profile?.displayName || user.displayName || '');
         setNameEdit(true);
       }} style={styles.profileEdit}><Text style={styles.link}>Edit display name</Text></TouchableOpacity>
     </View>
   </View>
   {!manager ? <>
     <ShopHeading title="Pickup preferences"/>
     <ProfileRow icon="pin" title="Pickup location" detail={preferredLocation?.name || 'Choose a pickup point'} onPress={() => setLocationPickerOpen(true)}/>
     <ProfileRow icon="bag" title="Pickup payment preference" detail={preferredPayment ? pickupPaymentLabel(preferredPayment) : 'Choose a preferred method'} onPress={() => setPaymentPreviewOpen(true)}/>
     <ProfileRow icon="receipt" title="Pickup rules and photo ID" detail="ID checks and nominated collectors" onPress={() => setProfilePolicyOpen(true)}/>
     <View style={{ marginTop: 12 }}><ShopHeading title="Weekly spending"/></View>
     <WeeklyBudgetCard limit={weeklyBudgetCents} spent={weeklySpentCents}/>
     <View style={[styles.card, { marginBottom: 17 }]}>
       <Text style={[styles.itemTitle, { marginBottom: 10 }]}>Set your reminder</Text>
       <View style={styles.checkoutChoices}>
         {[5000, 10000, 15000, 25000, 50000, 100000].map(cents =>
           <Choice key={cents} label={formatAUD(cents)} selected={weeklyBudgetCents === cents} onPress={() => saveWeeklyBudget(cents)}/>
         )}
       </View>
     </View>
   </> : <ProfileRow icon="browse" title="Store configuration" detail="Store name and support contacts" onPress={openSettings}/>}
   <ShopHeading title="Support"/>
   <View style={[styles.card, { marginBottom: 14 }]}>
     {settings.supportEmail || settings.supportPhone ? <>
       {settings.supportEmail ? <PrimaryButton title="Email store" onPress={() => callSupport(`mailto:${settings.supportEmail}`)} subtle/> : null}
       {settings.supportPhone ? <View style={{ marginTop: settings.supportEmail ? 7 : 0 }}>
         <PrimaryButton title="Call store" onPress={() => callSupport(`tel:${settings.supportPhone}`)} subtle/>
       </View> : null}
     </> : <Text style={styles.small}>Store contact details haven’t been added yet.</Text>}
   </View>
   <PrimaryButton title="Sign out" onPress={() => logout().catch(error => alertErr('Sign out failed', error))} subtle/>
   <Text style={styles.demoFoot}>BottleFlow demo · WA pickup only</Text>
  </>;
  return <Empty title="Screen unavailable" description="Return home to continue."/>;
 };
 if(profileLoading)return <SafeAreaView style={[styles.full,{justifyContent:'center'}]}><ActivityIndicator size="large" color={C.purple}/></SafeAreaView>;
 return <SafeAreaView edges={['top', 'bottom']} style={styles.workspace}>
 <StatusBar barStyle="dark-content"/>
 <ShopHeader storeName={shopName} manager={manager} pickupName={preferredLocation?.name}
   onPickup={() => setLocationPickerOpen(true)} onHome={goHome}/>
 <ScrollView ref={screenScroll} key={screen} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled"
   keyboardDismissMode="on-drag" contentContainerStyle={styles.screenContent}>
   {!profile ? <View style={[styles.card, { marginBottom: 14 }]}>
     <Text style={styles.error}>Your account profile could not be loaded.</Text>
   </View> : null}
   {screenBody()}
 </ScrollView>
 {cartNotice ? <View style={styles.cartNotice}>
   <ShopIcon name="check" color={C.gold}/>
   <View style={{ flex: 1 }}>
     <Text accessibilityLiveRegion="polite" style={styles.cartNoticeTitle}>{cartNotice.title}</Text>
     <Text numberOfLines={1} style={styles.cartNoticeName}>{cartNotice.productName}</Text>
   </View>
   <Pressable accessibilityRole="button" onPress={() => goto('Cart')} style={styles.cartNoticeAction}>
     <Text style={styles.cartNoticeActionText}>View cart</Text>
   </Pressable>
 </View> : null}
 <ShopTabs current={screen} manager={manager} cartCount={cartCount(cart)} onSelect={goto}/>
 {selected ? <Popup title="Product details" onClose={() => setSelected(null)}
   homeLink={<ShopHomeLink storeName={shopName} onPress={goHome}/>}>
   <DetailPhoto key={selected.id} product={selected}/>
   <View style={styles.productIntro}>
     <Text style={styles.tileCategory}>{selected.category.toUpperCase()}{isPremium(selected) ? ' · CELLAR' : ''}</Text>
     <Text accessibilityRole="header" style={styles.productTitle}>{productLabel(selected).name}</Text>
     <Text style={styles.small}>{productLabel(selected).description}</Text>
   </View>
   <Text style={styles.stepTitle}>Choose a pack</Text>
   <View style={styles.packGrid}>
     {packOptions(selected).map(option => {
       const current = selectedPackUnits === option.units;
       const available = selected.stock >= option.units;
       return <Pressable key={option.units} accessibilityRole="radio" accessibilityState={{ checked: current }}
         onPress={() => setSelectedPackUnits(option.units)} style={[styles.packTile, current && styles.packSelected]}>
         <Text style={styles.itemTitle}>{option.label}</Text>
         <Text style={[styles.packPrice, !available && styles.dimmed]}>{formatAUD(option.priceCents)}</Text>
         {!available ? <Text style={styles.error}>Unavailable</Text> : null}
       </Pressable>;
     })}
   </View>
   {manager ? <>
     <Text style={[styles.small, { marginBottom: 12 }]}>In stock: {selected.stock} · Minimum: {selected.minStock} · Supplier: {selected.supplier || 'Not entered'}</Text>
     <PrimaryButton title="Edit product" onPress={() => { setEditor(selected); setSelected(null); }}/>
     <View style={{ height: 8 }}/>
     <PrimaryButton title="Receive stock delivery" onPress={() => { setStockEdit(selected); setSelected(null); }} subtle/>
   </> : <>
     <View style={[styles.cartPickup, styles.detailPickup]}>
       <ShopIcon name="pin" color={C.purple}/>
       <View style={{ flex: 1 }}>
         <Text style={styles.itemTitle}>Pickup from {preferredLocation?.name || 'your WA pickup point'}</Text>
         <Text style={styles.small}>Original photo ID required</Text>
       </View>
     </View>
     <PrimaryButton
       title={selected.stock < selectedPackUnits ? 'Pack unavailable' :
         `${changingPack ? 'Change pack' : 'Add to cart'} · ${formatAUD(packOption(selected, selectedPackUnits).priceCents)}`}
       disabled={selected.stock < selectedPackUnits || cartHydration === 'loading'} onPress={() => addToCart(selected, selectedPackUnits)}
     />
   </>}
   {selected.description ? <Text style={styles.productDescription}>{selected.description}</Text> : null}
   {selected.sourceUrl && !/danmurphy/i.test(`${selected.sourceName || ''} ${selected.sourceUrl}`) ?
     <TouchableOpacity accessibilityRole="link" style={{ marginTop: 10 }} onPress={() => callSupport(selected.sourceUrl || '')}>
       <Text style={styles.link}>Product source · {selected.sourceName || 'Open Food Facts'} ↗</Text>
     </TouchableOpacity> : null}
 </Popup> : null}
 {editor!==null?<ProductEditor key={editor==='new'?'new':editor.id} product={editor==='new'?null:editor} done={()=>setEditor(null)} cancel={()=>setEditor(null)}/>:null}
 {stockEdit?<StockEditor product={stockEdit} uid={user.uid} cancel={()=>setStockEdit(null)} done={()=>setStockEdit(null)}/>:null}
 {photoOpen?<PhotoPicker close={()=>setPhotoOpen(false)}/>:null}
 {nameEdit?<Popup title="Edit display name" onClose={()=>setNameEdit(false)}><TxtInput label="Full name" value={customerName} onChangeText={setCustomerName}/><PrimaryButton title={busy?'Saving…':'Save changes'} onPress={handleName} disabled={busy}/></Popup>:null}
 {supplierOpen?<Popup title="Add supplier" onClose={()=>setSupplierOpen(false)}><TxtInput label="Supplier name" value={supplierName} onChangeText={setSupplierName}/><TxtInput label="Contact email" value={supplierEmail} onChangeText={setSupplierEmail} keyboardType="email-address"/><TxtInput label="Phone" value={supplierPhone} onChangeText={setSupplierPhone} keyboardType="phone-pad"/><PrimaryButton title={busy?'Saving…':'Save supplier'} disabled={busy} onPress={handleSupplier}/></Popup>:null}
 {settingsOpen?<Popup title="Store details" onClose={()=>setSettingsOpen(false)}><TxtInput label="Store name" value={storeName} onChangeText={setStoreName}/><TxtInput label="Support email" value={storeEmail} onChangeText={setStoreEmail} keyboardType="email-address" autoCapitalize="none"/><TxtInput label="Support phone" value={storePhone} onChangeText={setStorePhone} keyboardType="phone-pad"/><PrimaryButton title={busy?'Saving…':'Save store settings'} onPress={handleSaveSettings} disabled={busy}/></Popup>:null}
 {checkoutOpen&&preferredLocationId?<CheckoutPopup profileName={profile?.displayName||user.displayName||''} total={estimatedTotal} busy={busy} initialLocationId={preferredLocationId} weeklyLimit={weeklyBudgetCents} weeklySpent={weeklySpentCents} preferredPayment={preferredPayment} onSubmit={checkout} onClose={()=>setCheckoutOpen(false)}/>:null}
 {paymentPreviewOpen ? <Popup title="Pay at pickup" onClose={() => setPaymentPreviewOpen(false)}>
   <PickupPayment selected={preferredPayment} onSelect={savePaymentPreference}/>
   <Text style={[styles.small, { marginBottom: 16 }]}>Your preference is saved on this device and can be changed at checkout.</Text>
   <PrimaryButton title="Done" onPress={() => setPaymentPreviewOpen(false)}/>
 </Popup> : null}
 {profilePolicyOpen ? <Popup title="Pickup rules and photo ID" onClose={() => setProfilePolicyOpen(false)}>
   <PickupPolicyCard/>
   <View style={[styles.card, { marginBottom: 14 }]}>
     <Text style={styles.itemTitle}>Nominate another collector</Text>
     <Text style={[styles.small, { marginTop: 5 }]}>At checkout, enter their full legal name, mobile number and photo ID type. They must be 18 or older and bring original photo ID matching their name.</Text>
   </View>
   <WAComplianceCard/>
 </Popup> : null}
 {locationPickerOpen && !manager ? <PickupLocationPopup current={preferredLocationId} onConfirm={savePreferredLocation}
   onClose={preferredLocationId ? () => setLocationPickerOpen(false) : undefined}/> : null}
 {pickupDemoOpen ? <PickupDemo onClose={() => setPickupDemoOpen(false)}/> : null}
 {filtersOpen ? <CatalogueFilterPopup
   manager={manager} filters={{ sort: sortMode, inStock: inStockOnly, specials: specialsOnly }}
   onClose={() => setFiltersOpen(false)}
   onApply={filters => {
     setSortMode(filters.sort); setInStockOnly(filters.inStock); setSpecialsOnly(filters.specials); setFiltersOpen(false);
   }}
 /> : null}
 </SafeAreaView>;
}
export default App;
const styles=StyleSheet.create({
 workspace: { flex: 1, backgroundColor: SHOP.surface },
 screenContent: { flexGrow: 1, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 25, backgroundColor: C.bg },
 storefrontSection: { marginBottom: 22 },
 shelf: { gap: 10, paddingBottom: 3 },
 shelfTile: { width: 161 },
 saleChip: { position: 'absolute', left: 12, top: 12, paddingHorizontal: 6, paddingVertical: 4, borderRadius: 6, backgroundColor: C.dark },
 saleLabel: { color: C.gold, fontSize: 10, fontWeight: '900' },
 tileView: { width: 26, height: 26, flexShrink: 0, borderRadius: 13, backgroundColor: C.soft, alignItems: 'center', justifyContent: 'center' },
 tilePriceRow: { flexDirection: 'row', alignItems: 'baseline', flexWrap: 'wrap', columnGap: 5 },
 wasPrice: { color: C.muted, fontSize: 10, textDecorationLine: 'line-through' },
 tileMeta: { fontSize: 11, lineHeight: 15, color: C.muted },
 browseTitle: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 },
 categoryList: { gap: 6, paddingVertical: 10 },
 categoryLabel: { color: C.ink, fontSize: 12, fontWeight: '700' },
 categoryLabelActive: { color: C.white },
 browseTools: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, gap: 10 },
 results: { color: C.muted, fontSize: 13, fontWeight: '600' },
 filterButton: { minHeight: 43, flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderColor: C.line, borderRadius: 10, backgroundColor: C.white, paddingHorizontal: 9 },
 filterButtonLabel: { color: C.purple, fontWeight: '800', fontSize: 12 },
 activeFilter: { flexDirection: 'row', alignItems: 'center', gap: 3, alignSelf: 'flex-start', marginTop: 4 },
 filterRadio: { minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderColor: C.line },
 filterSwitch: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginVertical: 6 },
 managerOverview: { backgroundColor: C.dark, padding: 20, borderRadius: 16, marginBottom: 16 },
 managerTitle: { color: C.white, fontFamily: editorialFont, fontSize: 28 },
 detailPhoto: { width: '100%', aspectRatio: 1.30, padding: 8 },
 productIntro: { marginTop: 13, marginBottom: 15 },
 productTitle: { color: C.ink, fontFamily: editorialFont, fontSize: 25, lineHeight: 30, fontWeight: '700', marginBottom: 4 },
 productDescription: { color: C.muted, fontSize: 13, lineHeight: 19, marginTop: 14 },
 packGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
 packTile: { minWidth: '29%', padding: 10, borderWidth: 1, borderColor: C.line, borderRadius: 10, backgroundColor: C.white },
 packSelected: { borderColor: C.purple, backgroundColor: C.soft },
 packPrice: { color: C.purple, fontWeight: '800', fontSize: 13, marginTop: 3 },
 dimmed: { opacity: 0.48 },
 detailPickup: { marginBottom: 12 },
 cartPickup: { flexDirection: 'row', alignItems: 'center', gap: 9, padding: 12, borderWidth: 1, borderColor: C.line, backgroundColor: C.white, borderRadius: 12, marginBottom: 11 },
 cartLine: { marginBottom: 8, padding: 11 },
 cartLineTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
 cartLinePrice: { color: C.purple, fontSize: 15, fontWeight: '800' },
 cartLineActions: { marginTop: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
 cartStepper: { flexDirection: 'row', alignItems: 'center', gap: 10 },
 cartSummary: { padding: 13, marginTop: 5, backgroundColor: C.white, borderWidth: 1, borderColor: C.line, borderRadius: 13 },
 cartTotalRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
 cartTotalPrice: { color: C.purple, fontSize: 24, fontWeight: '900' },
 cartNotice: { flexDirection: 'row', alignItems: 'center', gap: 9, backgroundColor: C.dark, padding: 10, marginHorizontal: 12, marginBottom: 6, borderRadius: 11 },
 cartNoticeTitle: { color: C.white, fontSize: 13, fontWeight: '800' },
 cartNoticeName: { color: '#EADFE6', fontSize: 11 },
 cartNoticeAction: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 10, minHeight: 37, borderRadius: 7, backgroundColor: C.gold },
 cartNoticeActionText: { color: C.dark, fontSize: 12, fontWeight: '800' },
 authScreen: { flex: 1, backgroundColor: C.dark },
 authContent: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 20, paddingVertical: 13, width: '100%', maxWidth: 490, alignSelf: 'center' },
 authHero: { aspectRatio: 2.1, minHeight: 150, backgroundColor: C.dark, overflow: 'hidden', borderTopLeftRadius: 18, borderTopRightRadius: 18, justifyContent: 'center', paddingHorizontal: 18 },
 authHeroTint: { ...StyleSheet.absoluteFill, backgroundColor: '#21102159' },
 authKicker: { color: C.gold, fontSize: 10, letterSpacing: 1.7, fontWeight: '800' },
 authBrand: { color: C.white, fontFamily: editorialFont, fontSize: 34, letterSpacing: -1, marginTop: 5 },
 authCard: { backgroundColor: C.white, padding: 17, borderBottomLeftRadius: 18, borderBottomRightRadius: 18 },
 authTitle: { color: C.ink, fontFamily: editorialFont, fontSize: 25, fontWeight: '700' },
 authIntro: { color: C.muted, fontSize: 13, lineHeight: 19, marginTop: 4, marginBottom: 14 },
 authReset: { alignSelf: 'flex-end', paddingVertical: 9, marginTop: -6, marginBottom: 4 },
 authSwitch: { alignItems: 'center', paddingVertical: 11, marginTop: 6 },
 authFoot: { color: '#E2D4DE', marginTop: 12, textAlign: 'center', fontSize: 11, lineHeight: 16 },
 demoLink: { alignItems: 'center', justifyContent: 'center', minHeight: 44 },
 setupTitle: { color: C.gold, fontWeight: '800', fontSize: 19, marginVertical: 12 },
 setupCopy: { color: '#E6DDF2', lineHeight: 22 },
 pickupDemoBanner: { marginBottom: 12 },
 pickupDemoProduct: { flexDirection: 'row', gap: 12, alignItems: 'center', marginBottom: 14 },
 pickupDemoImage: { width: 72, height: 52 },
 pickupDemoChoices: { paddingBottom: 12 },
 pickupProgress: { gap: 10, paddingVertical: 13 },
 pickupProgressRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
 pickupProgressMark: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: C.soft },
 pickupProgressLabel: { flex: 1 },
 pickupRequestCard: { marginBottom: 12 },
 pickupFinalTotal: { marginTop: 9, fontWeight: '800', color: C.green },
 pickupRequestActions: { flexDirection: 'row', gap: 9, marginTop: 15 },
 productPhoto: { overflow: 'hidden', borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8F6F4' },
 packshotStage: { backgroundColor: '#FFFFFF' },
 packshot: { width: '100%', height: '100%' },
 tilePhoto: { width: '100%', aspectRatio: 0.94, padding: 5 },
 largePhoto: { width: '100%', aspectRatio: 0.72, padding: 8 },
 missingPhoto: { color: '#665C70', fontSize: 11, textAlign: 'center' },
 detailPhotoButton: { width: '100%', position: 'relative' },
 photoCredit: { alignSelf: 'flex-end', paddingTop: 7 },
 photoControl: { backgroundColor: C.dark, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, position: 'absolute', bottom: 8, right: 8 },
 photoControlText: { color: C.white, fontWeight: '800', fontSize: 11 },
 catalogueGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 12, marginBottom: 16 },
 catalogueTile: { width: '48.5%', padding: 6, backgroundColor: C.white, borderRadius: 14, borderWidth: 1, borderColor: C.line },
 tileBody: { flex: 1, paddingHorizontal: 4, paddingTop: 7, paddingBottom: 3 },
 tileCategory: { color: C.purple, fontSize: 10, fontWeight: '900', letterSpacing: 0.8, marginBottom: 4 },
 tileName: { color: C.ink, fontSize: 15, lineHeight: 19, fontWeight: '800', marginBottom: 4 },
 tileFooter: { flex: 1, marginTop: 8, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 4 },
 tilePrice: { color: C.purple, fontWeight: '900', fontSize: 17 },
 tileStock: { color: C.red, fontWeight: '800', fontSize: 11 },
 profileAccount: { flexDirection: 'row', gap: 10, alignItems: 'flex-start', marginBottom: 20 },
 profileRow: { flexDirection: 'row', gap: 10, alignItems: 'center', marginBottom: 8, padding: 11 },
 profileIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center', backgroundColor: C.soft },
 profileEdit: { alignSelf: 'flex-start', paddingTop: 6, paddingBottom: 4 },
 demoFoot: { color: C.muted, fontSize: 11, textAlign: 'center', marginTop: 16 },
 checkoutStep: { color: C.purple, fontSize: 10, letterSpacing: 1.4, fontWeight: '900', marginBottom: 13 },
 checkoutChoices: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginBottom: 16 },
 checkoutSummary: { backgroundColor: C.dark, borderRadius: 18, padding: 17, marginBottom: 18, gap: 5 },
 checkoutSummaryLocation: { color: C.white, fontSize: 20, fontWeight: '900' },
 checkoutSummaryDetail: { color: '#E8DEF2', fontSize: 13, lineHeight: 19 },
 checkoutTotal: { borderTopColor: '#6D5389', borderTopWidth: 1, marginTop: 8, paddingTop: 9, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 4 },
 checkoutAmount: { color: C.gold, fontSize: 23, fontWeight: '900' },
 checkoutBack: { alignSelf: 'center', padding: 14 },
 full:{flex:1,backgroundColor:C.bg},
 card:{backgroundColor:C.white,borderWidth:1,borderColor:C.line,borderRadius:18,padding:15},h2:{color:C.ink,fontWeight:'900',fontSize:19},itemTitle:{color:C.ink,fontWeight:'800',fontSize:15},small:{color:C.muted,fontSize:12,lineHeight:18},error:{color:C.red,fontSize:12,lineHeight:19},
 hero:{backgroundColor:C.dark,borderRadius:22,padding:23,marginBottom:22,overflow:'hidden'},heroTitle:{fontSize:37,color:'white',fontWeight:'900',letterSpacing:-1},heroCta:{alignSelf:'flex-start',backgroundColor:C.gold,borderRadius:12,paddingHorizontal:16,paddingVertical:12,marginTop:21},
 photoHeroImage:{...StyleSheet.absoluteFill,width:'100%',height:'100%'},
 button:{backgroundColor:C.purple,paddingHorizontal:16,paddingVertical:13,minHeight:46,borderRadius:10,alignItems:'center',justifyContent:'center'},buttonText:{color:'white',fontSize:14,fontWeight:'800'},buttonSubtle:{backgroundColor:C.soft,borderWidth:1,borderColor:C.line},
 inputLabel:{fontSize:12,color:C.ink,fontWeight:'800',marginBottom:6},input:{borderWidth:1,borderColor:C.line,borderRadius:12,padding:12,backgroundColor:C.white,fontSize:15,color:C.ink,minHeight:45},passwordToggle:{position:'absolute',right:4,top:3,bottom:3,minWidth:58,alignItems:'center',justifyContent:'center'},link:{color:C.purple,fontWeight:'700',fontSize:13},
 policyCard:{backgroundColor:'#FFF8E8',borderWidth:1,borderColor:'#EED89F',borderRadius:18,padding:15,marginBottom:18},choice:{paddingHorizontal:13,paddingVertical:9,backgroundColor:C.soft,borderWidth:1,borderColor:C.line,borderRadius:99,marginRight:7},choiceSelected:{backgroundColor:C.purple,borderColor:C.purple},stepTitle:{fontSize:14,color:C.ink,fontWeight:'900',marginBottom:9,marginTop:4},confirmRow:{flexDirection:'row',gap:10,alignItems:'flex-start',paddingVertical:8},checkbox:{width:23,height:23,borderRadius:7,borderWidth:2,borderColor:'#A8909B',alignItems:'center',justifyContent:'center',backgroundColor:'white'},checkboxOn:{backgroundColor:C.green,borderColor:C.green},totalRow:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginBottom:8},pickupLocationOption:{flexDirection:'row',alignItems:'center',gap:12,backgroundColor:'white',borderWidth:1,borderColor:C.line,borderRadius:16,padding:15,marginBottom:9},pickupLocationOptionSelected:{borderColor:C.purple,backgroundColor:C.soft},radio:{width:23,height:23,borderRadius:12,borderWidth:2,borderColor:'#B9A8C9',alignItems:'center',justifyContent:'center'},radioOn:{borderColor:C.green},radioDot:{width:11,height:11,borderRadius:6,backgroundColor:C.green},pickupSummary:{backgroundColor:'#F2F8F5',borderWidth:1,borderColor:'#CFE5D9',borderRadius:13,padding:12,marginBottom:10},
 stats:{flexDirection:'row',flexWrap:'wrap',gap:10,justifyContent:'space-between',marginBottom:24},quickActions:{flexDirection:'row',flexWrap:'wrap',justifyContent:'space-between',gap:10,marginBottom:25},quick:{width:'48%',borderRadius:14,padding:16,backgroundColor:'#EEE7F7',minHeight:54,justifyContent:'center'},
 category:{paddingHorizontal:12,minHeight:36,justifyContent:'center',backgroundColor:C.white,borderRadius:20,borderWidth:1,borderColor:C.line},categorySelected:{backgroundColor:C.purple,borderColor:C.purple},empty:{backgroundColor:C.soft,padding:25,borderRadius:15,alignItems:'center',marginVertical:12},
 qty:{width:36,height:36,borderRadius:8,backgroundColor:C.soft,justifyContent:'center',alignItems:'center'},backdrop:{flex:1,backgroundColor:'#241320A8',justifyContent:'flex-end',alignItems:'center'},popup:{borderTopLeftRadius:22,borderTopRightRadius:22,backgroundColor:C.bg,paddingTop:5,maxHeight:'100%'},popupHeader:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',paddingHorizontal:18,minHeight:56,gap:8},
 popupHeading:{flex:1,minWidth:0},
 popupTitle:{flexShrink:1,color:C.ink,fontFamily:editorialFont,fontSize:22,fontWeight:'700'},
 popupClose:{width:44,height:44,alignItems:'center',justifyContent:'center'},
});
