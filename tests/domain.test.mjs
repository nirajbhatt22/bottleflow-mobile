import test from 'node:test';
import assert from 'node:assert/strict';
import { formatAUD, parsePrice, parseWhole, readableError, skuId, cartCount, lineTotal, sumSales, packOptions, packageCount, regularPackOption, specialPercent, startOfLocalWeek } from '../src/domain.ts';
import { validatePickupDetails, WA_PICKUP_LOCATIONS, PICKUP_WINDOWS, PHOTO_ID_TYPES } from '../src/pickup.ts';
test('currency in cents',()=>{assert.equal(formatAUD(1234),'$12.34'); assert.equal(formatAUD(5),'$0.05');});
test('currency precision',()=>{assert.equal(parsePrice('12.5'),1250); assert.equal(parsePrice('0.99'),99); assert.throws(()=>parsePrice('1.235')); assert.throws(()=>parsePrice('-2'));});
test('stock validation',()=>{assert.equal(parseWhole(' 12 ','Stock'),12); assert.throws(()=>parseWhole('-1','Stock')); assert.throws(()=>parseWhole('2.5','Stock'));});
test('SKU normalized and safe',()=>{assert.equal(skuId('item-123'),'ITEM-123'); assert.throws(()=>skuId('bad/id'));});
test('cart and reporting totals',()=>{assert.equal(cartCount([{quantity:2},{quantity:3}]),5); assert.equal(lineTotal(1295,3),3885); assert.equal(sumSales([{totalCents:3885},{totalCents:120}]),4005);});
test('pack pricing supports single, 2, 4, 6 and carton formats',()=>{
 assert.equal(packageCount('6 × 375mL cans'),6);
 const options=packOptions({category:'Beer',priceCents:2400,packSize:'6 × 375mL cans'});
 assert.deepEqual(options.map(option=>option.units),[1,2,4,6,24]);
 assert.equal(options[0].priceCents,400);
 assert.ok(options.at(-1).priceCents < options[0].priceCents*24);
});
test('wine and spirits offer bottle, twin and case formats',()=>{
 assert.deepEqual(packOptions({category:'Wine',priceCents:12000,packSize:'750mL'}).map(option=>option.units),[1,2,6]);
});
test('weekly spending period starts Monday local time',()=>{
 const start=startOfLocalWeek(new Date(2026,10,24,12));
 assert.equal(start.getDay(),1); assert.equal(start.getHours(),0); assert.equal(start.getDate(),23);
});
test('featured beer, wine and spirits specials use deterministic discounts',()=>{
 const product={sku:'SPECIAL-ABC',name:'Same Beer',category:'Beer',priceCents:1000,packSize:'1 can'};
 const percent=specialPercent(product);
 assert.ok([0,15,20].includes(percent));
 if(percent)assert.ok(packOptions(product)[0].priceCents<regularPackOption(product,1).priceCents);
 assert.equal(specialPercent({...product,category:'Soft Drinks'}),0);
 assert.equal(specialPercent({...product,sku:'DIFFERENT-SKU'}),percent);
 assert.equal(specialPercent({...product,premium:true,priceCents:12000}),0);
 assert.equal(specialPercent({sku:'BF-GN-ORIGINAL-6',name:'Great Northern Original Lager Cans',category:'Beer',priceCents:2195}),15);
});
test('WA pickup requires matching location, adult confirmation and photo ID',()=>{
 const location=WA_PICKUP_LOCATIONS[0];
 const details={locationId:location.id,locationName:location.name,locationAddress:location.address,window:PICKUP_WINDOWS[0],collector:{type:'self',fullName:'Taylor Example',phone:'',idType:PHOTO_ID_TYPES[0]},waPickupOnly:true,photoIdRequired:true,ageConfirmed:true};
 assert.equal(validatePickupDetails(details).locationAddress,'Perth WA 6000');
 assert.throws(()=>validatePickupDetails({...details,locationAddress:'Sydney NSW 2000'}));
 assert.throws(()=>validatePickupDetails({...details,photoIdRequired:false}));
});
test('nominated collector must provide a valid mobile number',()=>{
 const location=WA_PICKUP_LOCATIONS[1];
 const details={locationId:location.id,locationName:location.name,locationAddress:location.address,window:PICKUP_WINDOWS[1],collector:{type:'nominee',fullName:'Morgan Example',phone:'0400 123 456',idType:PHOTO_ID_TYPES[1]},waPickupOnly:true,photoIdRequired:true,ageConfirmed:true};
 assert.equal(validatePickupDetails(details).collector.phone,'0400 123 456');
 assert.throws(()=>validatePickupDetails({...details,collector:{...details.collector,phone:'123'}}));
});
test('mobile login errors explain credentials and connectivity',()=>{
 assert.match(readableError({code:'auth/invalid-credential'}),/password is incorrect/i);
 assert.match(readableError({code:'auth/network-request-failed'}),/cannot reach Firebase/i);
 assert.match(readableError({code:'auth/too-many-requests'}),/wait a few minutes/i);
});
