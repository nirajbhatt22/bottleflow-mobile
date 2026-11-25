import { useEffect, useState } from 'react';
import { createUserWithEmailAndPassword, sendPasswordResetEmail, signInWithEmailAndPassword, signOut, updateProfile } from 'firebase/auth';
import { addDoc, collection, deleteField, doc, getDocs, onSnapshot, query, runTransaction, serverTimestamp, setDoc, updateDoc, where, writeBatch, type DocumentData, type QueryConstraint } from 'firebase/firestore';
import { auth, db } from './firebase';
import { CATALOG_PRODUCTS } from './catalog';
import { PREMIUM_OVERRIDES, PREMIUM_PRODUCTS } from './premium-catalog';
import { deduplicateProducts, MARKET_PRODUCTS, productIdentityKey, productImageIdentity, withMarketPrice } from './pricing-benchmarks';
import { packOption, parsePrice, parseWhole, skuId } from './domain';
import { validatePickupDetails } from './pickup';
import type { CartLine, Product, CollectionRequest, StoreSettings, Sale, Movement, Supplier, PickupDetails } from './types';
function needFirebase() { if (!auth || !db) throw new Error('Firebase configuration is missing.'); return { auth, db }; }
export function useLiveDocs<T extends {id: string}>(path: string, enabled: boolean, filter?: {field: string; value: string | boolean}) {
 const [data, setData] = useState<T[]>([]); const [loading, setLoading] = useState(true); const [error, setError] = useState('');
 useEffect(()=>{
  if(!enabled || !db){ setData([]);setLoading(false);return; }
  setLoading(true);setError('');
  const constraints: QueryConstraint[] = filter ? [where(filter.field,'==',filter.value)] : [];
  const q = query(collection(db,path),...constraints);
  return onSnapshot(q,snap=>{setData(snap.docs.map(item=>({...(item.data() as DocumentData),id:item.id}) as T));setLoading(false);}, e=>{setError(e.message);setLoading(false);});
 },[path,enabled,filter?.field,filter?.value]);
 return {data,loading,error};
}
export async function register(name: string,email: string,password: string) {
 const {auth,db}=needFirebase();
 const displayName=name.trim();if(displayName.length<2) throw new Error('Enter your full name.');
 if(password.length<6) throw new Error('Password must contain at least 6 characters.');
 const cred=await createUserWithEmailAndPassword(auth,email.trim().toLowerCase(),password);
 // Failed profile creation is reported to the user; signed-in session remains for retry from Firebase Console.
 await updateProfile(cred.user,{displayName});
 await setDoc(doc(db,'users',cred.user.uid), {displayName,email:cred.user.email || email.trim().toLowerCase(),role:'customer',createdAt:serverTimestamp()});
}
export async function login(email: string,password: string) { const {auth}=needFirebase();const normalizedEmail=email.trim().toLowerCase();if(!/^\S+@\S+\.\S+$/.test(normalizedEmail))throw new Error('Enter a valid email address.');if(!password)throw new Error('Enter your password.');await signInWithEmailAndPassword(auth,normalizedEmail,password); }
export async function resetPassword(email: string) {const {auth}=needFirebase();const normalizedEmail=email.trim().toLowerCase();if(!/^\S+@\S+\.\S+$/.test(normalizedEmail))throw new Error('Enter a valid email address first.');await sendPasswordResetEmail(auth,normalizedEmail);}
export async function logout() {const {auth}=needFirebase(); await signOut(auth);}
export async function changeName(uid: string,name: string){const {db}=needFirebase();if(name.trim().length<2)throw new Error('Name must contain at least 2 characters.');await updateDoc(doc(db,'users',uid),{displayName:name.trim()});}
export async function createProduct(input: {sku: string;name: string;category:string;price:string;stock:string;minStock:string;supplier:string;imageUrl:string;imageKey?:string;packSize?:string;abv?:string;description?:string}) {
 const {db}=needFirebase();const sku=skuId(input.sku);const name=input.name.trim();if(name.length<2)throw new Error('Product name must contain at least 2 characters.');
 const priceCents=parsePrice(input.price);const stock=parseWhole(input.stock,'Stock');const minStock=parseWhole(input.minStock,'Minimum stock');
 const ref=doc(db,'products',sku);
 await runTransaction(db,async tx=>{const before=await tx.get(ref);if(before.exists())throw new Error('That SKU already exists.');tx.set(ref,{sku,name,category:input.category.trim()||'Other',priceCents,stock,minStock,supplier:input.supplier.trim(),imageUrl:input.imageUrl.trim(),imageKey:input.imageKey?.trim()||'',packSize:input.packSize?.trim()||'',abv:input.abv?.trim()||'',description:input.description?.trim()||'',active:true,createdAt:serverTimestamp(),updatedAt:serverTimestamp()});});
}
export async function editProduct(id:string,input: {name:string;category:string;price:string;minStock:string;supplier:string;imageUrl:string;packSize:string;abv:string;description:string;active:boolean}) {
 const {db}=needFirebase();if(input.name.trim().length<2)throw new Error('Enter a product name.');
 await updateDoc(doc(db,'products',id),{name:input.name.trim(),category:input.category.trim()||'Other',priceCents:parsePrice(input.price),minStock:parseWhole(input.minStock,'Minimum stock'),supplier:input.supplier.trim(),imageUrl:input.imageUrl.trim(),packSize:input.packSize.trim(),abv:input.abv.trim(),description:input.description.trim(),active:input.active,updatedAt:serverTimestamp()});
}
export async function receiveStock(product:Product,quantityText:string,reason:string,uid:string) {
 const {db}=needFirebase();const qty=parseWhole(quantityText,'Delivery quantity',1,999999);
 const movement=doc(collection(db,'movements'));
 await runTransaction(db,async tx=>{const productRef=doc(db,'products',product.id);const snap=await tx.get(productRef);if(!snap.exists())throw new Error('Product no longer exists.');const next=Number(snap.data().stock)+qty;if(!Number.isSafeInteger(next)||next>9999999)throw new Error('Stock exceeds the permitted limit.');tx.update(productRef,{stock:next,updatedAt:serverTimestamp()});tx.set(movement,{productId:product.id,delta:qty,reason:reason.trim()||'Delivery received',userId:uid,createdAt:serverTimestamp()});});
}
export async function submitRequest(uid:string,cart:CartLine[],pickup:PickupDetails) {
 const {db}=needFirebase();if(!cart.length)throw new Error('Add products before submitting.');if(cart.length>20)throw new Error('Maximum 20 different products per request.');
 if(!cart.every(v=>/^[A-Z0-9_-]{2,30}$/.test(v.productId)&&Number.isSafeInteger(v.quantity)&&v.quantity>=1&&v.quantity<=20&&[1,2,4,6,24].includes(v.packUnits||1)))throw new Error('Cart contains an invalid item, pack size or quantity.');
 const verifiedPickup=validatePickupDetails(pickup);
 const ref=await addDoc(collection(db,'requests'),{userId:uid,items:cart,status:'pending',...verifiedPickup,createdAt:serverTimestamp()});return ref.id;
}
export async function declineRequest(requestId:string) {const {db}=needFirebase();await runTransaction(db,async tx=>{const ref=doc(db,'requests',requestId);const snap=await tx.get(ref);if(!snap.exists()||snap.data().status!=='pending')throw new Error('This request has already been handled.');tx.update(ref,{status:'declined',processedAt:serverTimestamp()});});}
export async function completeRequest(request:CollectionRequest,managerId:string) {
 const {db}=needFirebase();
 const requestRef=doc(db,'requests',request.id);const saleRef=doc(db,'sales',request.id);
 // All product reads happen before the transaction performs writes. Firestore retries on conflicts.
 return runTransaction(db,async tx=>{
  const requestSnap=await tx.get(requestRef);
  if(!requestSnap.exists()||requestSnap.data().status!=='pending')throw new Error('This request has already been processed.');
  const fresh=requestSnap.data() as CollectionRequest;
  if(!Array.isArray(fresh.items)||fresh.items.length===0||fresh.items.length>20)throw new Error('Invalid request items.');
  const seen=new Set<string>();
  for(const item of fresh.items){if(!item||typeof item.productId!=='string'||seen.has(item.productId)||!Number.isSafeInteger(item.quantity)||item.quantity<1||item.quantity>20||![1,2,4,6,24].includes(item.packUnits||1))throw new Error('Invalid request quantities or pack sizes.');seen.add(item.productId);}
  const refs=fresh.items.map(item=>doc(db,'products',item.productId));
  const snaps=await Promise.all(refs.map(ref=>tx.get(ref)));
  const lines=fresh.items.map((item,i)=>{
   const snapshot=snaps[i];if(!snapshot.exists())throw new Error(`${item.productId} is unavailable.`);
   const p=snapshot.data() as Product;
   if(!p.active)throw new Error(`${p.name} is inactive.`);
   const option=packOption(p,item.packUnits||1);const requiredUnits=item.quantity*option.units;
   if(!Number.isSafeInteger(p.stock)||p.stock<requiredUnits)throw new Error(`Insufficient stock for ${p.name} ${option.label}.`);
   if(!Number.isSafeInteger(p.priceCents)||p.priceCents<0)throw new Error(`Invalid price for ${p.name}.`);
   return {productId:item.productId,name:p.name,quantity:item.quantity,priceCents:option.priceCents,packUnits:option.units,packLabel:option.label,requiredUnits};
  });
  const totalCents=lines.reduce((sum,item)=>sum+item.quantity*item.priceCents,0);
  if(!Number.isSafeInteger(totalCents)) throw new Error('Total is too large.');
  lines.forEach((line,i)=>{
    tx.update(refs[i],{stock:(snaps[i].data() as Product).stock-line.requiredUnits,updatedAt:serverTimestamp()});
    tx.set(doc(db,'movements',`${request.id}_${line.productId}`),{productId:line.productId,delta:-line.requiredUnits,reason:`Request ${request.id} · ${line.packLabel}`,userId:managerId,createdAt:serverTimestamp()});
  });
  tx.set(saleRef,{requestId:request.id,userId:fresh.userId,items:lines.map(({requiredUnits,...line})=>line),totalCents,fulfilledBy:managerId,createdAt:serverTimestamp()});
  tx.update(requestRef,{status:'completed',totalCents,processedAt:serverTimestamp()});
  return totalCents;
 });
}
export async function addSupplier(name:string,email:string,phone:string) {const {db}=needFirebase();if(name.trim().length<2)throw new Error('Supplier name is too short.');await addDoc(collection(db,'suppliers'),{name:name.trim(),email:email.trim(),phone:phone.trim()});}
export async function saveStoreSettings(settings:StoreSettings) {const {db}=needFirebase();await setDoc(doc(db,'settings','store'),{shopName:(settings.shopName||'BottleFlow').trim(),supportEmail:(settings.supportEmail||'').trim(),supportPhone:(settings.supportPhone||'').trim()},{merge:true});}
export async function seedCatalogProducts() {
 const {db}=needFirebase();
 const snapshot=await getDocs(collection(db,'products'));
 const existing=new Set(snapshot.docs.map(item=>item.id));
 const enhanced=CATALOG_PRODUCTS.map(product=>({...withMarketPrice(product),...PREMIUM_OVERRIDES[product.sku]}));
 // Curated photo-backed records come first so an older open-data duplicate is
 // retired instead of appearing as a second product with a different price.
 const catalogue=deduplicateProducts([...MARKET_PRODUCTS,...PREMIUM_PRODUCTS,...enhanced]);
 const canonicalByIdentity=new Map(catalogue.map(product=>[productIdentityKey(product),product.sku]));
 const canonicalByImage=new Map<string,string>(catalogue.map(product=>[productImageIdentity(product),product.sku] as [string,string]).filter(([key])=>!!key));
 const canonicalIds=new Set(catalogue.map(product=>product.sku));
 const batch=writeBatch(db);let created=0;
 let updated=0;
 let retired=0;
 for(const item of snapshot.docs){
  const product=item.data() as Product;
  const replacementId=canonicalByIdentity.get(productIdentityKey(product))||canonicalByImage.get(productImageIdentity(product));
  if(replacementId&&replacementId!==item.id&&!canonicalIds.has(item.id)){
   batch.set(item.ref,{active:false,replacedBy:replacementId,comparisonPriceCents:deleteField(),comparisonPackUnits:deleteField(),comparisonLabel:deleteField(),comparisonRetailer:deleteField(),comparisonUrl:deleteField(),priceCheckedAt:deleteField(),updatedAt:serverTimestamp()},{merge:true});
   retired++;
  }
 }
 for(const product of catalogue){
  const ref=doc(db,'products',product.sku);
  const cleanComparison={comparisonPriceCents:deleteField(),comparisonPackUnits:deleteField(),comparisonLabel:deleteField(),comparisonRetailer:deleteField(),comparisonUrl:deleteField(),priceCheckedAt:deleteField()};
  const cleanOldReference='sourceName' in product?{}:{sourceName:deleteField(),sourceUrl:deleteField()};
  if(existing.has(product.sku)){batch.set(ref,{...product,...cleanComparison,...cleanOldReference,active:true,updatedAt:serverTimestamp()},{merge:true});updated++;}
  else {batch.set(ref,{...product,active:true,createdAt:serverTimestamp(),updatedAt:serverTimestamp()});created++;}
 }
 if(created||updated||retired)await batch.commit();
 return {created,updated,retired,total:catalogue.length};
}
export function useStoreSettings(): {settings:StoreSettings;error:string} {const [settings,setSettings]=useState<StoreSettings>({shopName:'BottleFlow'});const [error,setError]=useState('');useEffect(()=>{if(!db)return;return onSnapshot(doc(db,'settings','store'),snapshot=>{if(snapshot.exists())setSettings(snapshot.data() as StoreSettings);},e=>setError(e.message));},[]);return {settings,error};}
