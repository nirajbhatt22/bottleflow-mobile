# BottleFlow mobile prototype

**New to this code? Open `START_HERE.md` first.** It explains only the five important files in plain English.

**Student:** Niraj Bhatt  
**Unit:** ITC502  
**Assessment:** Project 2 - React Native Mobile Application  
**GitHub:** https://github.com/nirajbhatt22/bottleflow-mobile

BottleFlow is a mobile-first bottle shop prototype created for ITC502 Project 2. It turns the Project 1 Figma concept into a React Native app while responding to feedback about the incomplete shopping journey, age assurance and responsible alcohol use.

## What is included

- Splash screen and secure-age-verification concept
- Improved login with validation, back navigation, create-account and password-recovery prototype flows
- Searchable and filterable customer home
- Product details with ABV and standard-drink information
- Working add-to-cart, quantity update and remove actions
- Delivery or Click & Collect, selectable times and simulated payment choices
- Connected local order confirmation with order number, total and progress
- Account order history, session spending reminder and responsible-use controls
- Reusable buttons, inputs, cards, navigation, notices and quantity controls
- React Navigation stack and local React Context state
- Inter typography plus the same `#5B2C83` purple, `#F2B84B` gold and 393 px mobile-first geometry used in Figma

The age check is intentionally marked as a simulation. A real product would integrate an accredited Digital ID or identity-verification provider, retain only the minimum 18+ outcome, complete privacy and legal review, and still require ID at delivery or collection.

## Run the app

Requirements: Node.js, npm and the Expo Go app or an Android/iOS simulator.

```bash
cd bottleflow-mobile
npm install
npx expo start
```

Then press `a` for Android, `i` for iOS (macOS only), `w` for web, or scan the Expo QR code with a supported device.

To check the TypeScript source after installing dependencies:

```bash
npm run typecheck
```

## Suggested presentation journey

1. Splash automatically opens the age-verification screen.
2. Choose Digital ID and explain that the prototype simulates an accredited provider.
3. Sign in with the pre-filled demonstration details.
4. Filter to Zero Alcohol or open a product.
5. Add a product, change its quantity and continue to checkout.
6. Choose Delivery or Click & Collect, select a time and demo payment method.
7. Accept the two handover checks and place the order.
8. Show the same order number, total and status in Confirmation and Account.
9. Demonstrate hide-promotions, spending reminder and pause-purchases controls.

## Project structure

```text
bottleflow-mobile/
├── App.tsx
├── src/
│   ├── assets/
│   ├── components/
│   ├── context/
│   ├── data/
│   ├── navigation/
│   ├── screens/
│   └── theme/
├── app.json
├── package.json
└── tsconfig.json
```

## Simple code guide

- `App.tsx` starts the application and loads navigation.
- `src/screens` contains one file for each app screen.
- `src/data/products.ts` contains the product names, prices and image links.
- `src/components/ProductCard.tsx` displays a normal shop product card.
- `src/components/FeatureCard.tsx` displays the larger featured-product card.
- `src/context/CartContext.tsx` stores the cart items and calculates the total.
- `src/context/OrderContext.tsx` saves placed orders locally for Confirmation and Account.
- `src/assets/images` contains simple local files: `hero.png`, `zero.png`, `beer.png`, `wine.png`, `spirit.png` and the app icons.

The main coding pattern is straightforward: data comes from `products.ts`, a screen maps over that data, reusable cards display it, and button functions update the cart or navigate to another screen.

## ITC502 Project 2 alignment

- Uses Expo, React Native and TypeScript.
- Separates components, screens, assets, navigation, data, state and theme.
- Includes Splash and Login plus a complete core customer flow.
- Uses React Navigation for working screen transitions.
- Reuses components and follows the Figma purple/gold visual system.
- Includes meaningful interactions through search, empty results, category filters, cart state, fulfilment and payment choices, order status and account settings.

The prototype has been tested with an Android emulator. The submission ZIP excludes `node_modules`, `.expo` and other restorable or generated files.

## Current prototype limitations

- Product and order data are local demonstration data and reset when the app restarts.
- Authentication and Digital ID are simulated; no personal ID data is collected.
- Payment, live stock, delivery allocation and external support links are not connected.
- Responsible-use settings are local demonstration controls. Hide promotions, the spending reminder and pause-purchases now affect the live prototype, but are not persisted after the app closes.
