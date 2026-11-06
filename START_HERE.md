# BottleFlow — start here

You do **not** need to understand every file. The project is separated into small files so each file has one clear job.

## Read these five files first

1. `App.tsx` — starts the app.
2. `src/navigation/AppNavigator.tsx` — lists the screens and connects them.
3. `src/data/products.ts` — contains the four product records.
4. `src/screens/HomeScreen.tsx` — displays and filters the products.
5. `src/context/CartContext.tsx` — remembers products added to the cart.

That is enough to explain the basic app.

## The main flow

```text
products.ts
    ↓
HomeScreen.tsx
    ↓ add product
CartContext.tsx
    ↓ checkout
CheckoutScreen.tsx
    ↓ save order
OrderContext.tsx
    ↓
OrderConfirmationScreen.tsx
```

## Folder names in simple English

| Folder | Simple meaning |
|---|---|
| `screens` | Full app pages |
| `components` | Small reusable design pieces, such as a button |
| `context` | Temporary app memory for the cart, user settings and orders |
| `data` | Product information |
| `navigation` | The list of screens and links between them |
| `theme` | Colours, spacing and text sizes |
| `assets` | Images |

The login-related pages are easy to find in `src/screens`: `LoginScreen.tsx`, `CreateAccountScreen.tsx` and `ForgotPasswordScreen.tsx`.

## Files you can ignore

- `node_modules` — downloaded libraries; never edit this folder.
- `.expo` — temporary Expo information.
- `package-lock.json` — generated dependency list.
- `babel.config.js` and `tsconfig.json` — tool configuration.
- Image files — visual assets, not code.

These generated folders are hidden in VS Code to make the Explorer easier to read.

## Easy explanation for class

“BottleFlow is built with React Native and TypeScript. Each screen is kept in its own file. Product information comes from one data file. React Context stores the cart, responsible-use settings and demo orders. React Navigation moves the user between screens. Reusable components keep the design consistent.”

## Safe places to practise

- Change product names or prices in `src/data/products.ts`.
- Change colours in `src/theme/theme.ts`.
- Change page text inside the matching file in `src/screens`.

Run the app with:

```bash
npx expo start --localhost --clear
```

Then press `a` for Android.
