# BottleFlow — ITC502 Project 3

**WA pickup-only bottle-shop prototype** · React Native / Expo SDK 58 · Firebase Authentication · Cloud Firestore

**Author:** Niraj Bhatt

**Academic purpose:** ITC502 Project 3 (individual work)

**GitHub:** https://github.com/nirajbhatt22/bottleflow-mobile

## Project summary

BottleFlow manages a real-world sample catalogue, incoming Western Australian pickup requests, stock receipts, completed sales and reports. A customer must first choose and save a WA pickup point before browsing. The selected location remains visible in the header and Home screen, can be changed later, and pre-fills checkout. The customer can then browse live stock, add items to a local cart, choose a collection window, and name either themselves or another adult as collector. The collector must present original government-issued photo ID that matches the request.

BottleFlow has **no delivery workflow**. Customers can try choosing debit or credit card, cash, Apple Pay or Google Pay for the counter in the checkout or Profile. The preference is saved on the device and is not a payment or part of the Firestore request. A manager completes a pickup only after confirming the named collector is 18+ and their photo ID matches. Completion uses one Firestore transaction to record the sale, update inventory and write auditable stock movements. The app rejects insufficient stock and duplicate completion attempts.

This remains an academic prototype, not a licensed public alcohol-sales service. The ID workflow records the required in-person check; it does not scan, store or automatically verify identity documents.

## Screens / features

| Customer | Manager | Shared |
|---|---|---|
| Create account, sign in, password reset | Product catalogue, add/edit/deactivate SKUs | Persistent account sessions |
| 150+ photo-backed products, search/category/sort filters | Receive stock with movement history | Live Firestore subscriptions |
| Product details and persistent local cart | ID-checked pickup completion or decline | Role-based Firestore rules |
| Required, persistent WA location selection before browsing | Sales overview and low-stock alerts | Pickup location visible throughout |
| Nominate another adult collector | Suppliers, support-contact settings | Edit name, sign out |

Customers browse a photo grid and can enlarge images on product pages. The catalogue bundles verified full-pack photos and Open Food Facts contributor images. See [catalogue attribution](docs/OPEN_DATA_ATTRIBUTION.md) for source details. Managers can add an HTTPS image URL to a product.

Tap **Requests → Pickup demo**, or **Try pickup demo** from sign-in, to rehearse a WA pickup and photo-ID handover with sample data. See the [presentation guide](docs/PRESENTATION_SCRIPT.md).

## Prerequisites

- Node.js 22 or newer (Expo SDK 58 baseline; see Expo docs for compatible versions)
- A Mac, Windows or Linux computer with npm and VS Code
- Android phone with compatible Expo Go, Android emulator, or iOS simulator on macOS
- A Firebase project with Email/Password Authentication and Cloud Firestore
- Internet connectivity for npm packages, Expo and Firebase

## 1. Connect YOUR Firebase project

1. In [Firebase Console](https://console.firebase.google.com), open your project.
2. **Build > Authentication > Sign-in method**: enable **Email/Password**.
3. **Build > Firestore Database > Create database**: create a Standard database in **production mode** (Sydney region is a reasonable selection for an Australian project). Do not use public test rules.
4. Open **Project settings > Your apps**. Register a **Web** app (the Firebase JS SDK in Expo uses the Web app config). Copy the config fields.
5. Rename `.env.example` to `.env` and replace all `replace-me` values with the config values. Variables begin `EXPO_PUBLIC_`. These are client configuration values, not service-account private keys. **Never put a service-account JSON, password or secret signing key in this project.**
6. In Firestore > **Rules**, replace the default rules with the full contents of `firebase/firestore.rules`, then **Publish**. Alternatively, use Firebase CLI: `firebase login`, `firebase use --add`, `firebase deploy --only firestore:rules`. Review the rules before deployment.
7. If Expo was already running, stop it and restart `npx expo start --clear` after changing `.env`.

Expected `.env` format:

```dotenv
EXPO_PUBLIC_FIREBASE_API_KEY=your-firebase-web-api-key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=1234567890
EXPO_PUBLIC_FIREBASE_APP_ID=1:1234567890:web:abcdef
```

Use `.env.example` to configure your local Firebase project. Without a configuration, BottleFlow opens the setup screen and offers the local pickup demo.

## 2. Install and start

```bash
npm install
npx expo install --fix
npm run check:config
npx expo start --clear
```

Scan the QR code with Expo Go on Android, or press `a` in the Expo terminal if an Android emulator is installed. To start directly on an emulator, run `npm run android`. For iOS, use a supported macOS iOS Simulator. The configuration-free setup screen is expected until your `.env` has been supplied.

**Compatibility:** The code targets Expo SDK 58 / React Native 0.88. If Expo warns about package versions, run `npx expo install --fix` (the Expo CLI selects matching native-module versions). This archive does not contain `node_modules`, a lockfile, native binary builds or emulator-generated screenshots.

## 3. Create accounts and grant manager access

1. Open the app and select **Create a free account**. Register with email/password. It creates a Firebase Authentication user and `users/{uid}` Firestore profile with role **`customer`**.
2. Open Firebase Console > Authentication > Users and copy that account's **UID**.
3. Open Firestore > Data > `users` > the document with that UID. Edit the `role` field from `customer` to **`manager`**. (This privileged bootstrap is done in the Firebase Console; it cannot be done from the public sign-up screen.)
4. The app's profile listener updates to manager mode in real time. You can then tap **Load real-world product catalogue**, create additional SKUs, configure support details and record stock.
5. Register a second account and leave it as `customer` to test browsing and live collection requests.

**Important:** Never let a new account choose `manager` at sign-up. Firestore security rules explicitly prevent self-promotion. Do not simply create an insecure `allow read, write: if true` rule.

## 4. Demonstrate end-to-end real-time behaviour

1. Manager signs in and imports the 150-product photo-backed catalogue. Repeating the import safely skips existing SKUs.
2. Customer signs in on another device and must choose a WA pickup point before browsing. The choice is stored locally and remains visible in the header.
3. Customer browses products, adds items to the pickup cart, then confirms the preselected pickup point, preferred window, collector and accepted photo-ID type. A nominated collector also requires a mobile number.
4. Customer reviews the estimate, selects a counter payment preference and confirms that the collector is 18+ and will bring original photo ID for WA pickup. Submitting sends a pickup request and does not take payment.
5. Manager checks the named collector's original photo ID at the counter and taps **Complete after ID check**. A Firestore transaction rechecks current prices and quantities, subtracts stock, records a `sales/{requestId}` document and stock movements, and updates the request status.
6. The customer's Requests tab changes to **COMPLETED**; manager totals and stock counts update live.
7. If insufficient stock exists, the transaction fails instead of selling negative stock. Declining a request leaves stock unchanged.

### Data model

- `users/{uid}` — name, email, customer/manager role
- `products/{SKU}` — catalogue, local image key or HTTPS image, pack size, ABV, descriptions, unit prices in integer cents, quantities, low-stock thresholds and active state
- `requests/{id}` — customer UID, product IDs/quantities, WA pickup point/window, named collector, ID type, compulsory confirmations, status and final amount
- `sales/{requestId}` — completed items (price snapshots), manager UID, final total
- `movements/{id}` — positive receipts and negative sale deductions
- `suppliers/{id}` — supplier contact list
- `settings/store` — shop name and optional support contacts

**Data integrity:** The manager writes product stock changes and sale documents in a Firestore transaction. The backend checks stock again at approval time rather than trusting a customer-side cart price. Firestore automatically retries conflicts. Customer-submitted request prices are never trusted. Product SKUs are unique document IDs; prices are integer AUD cents. Deactivated products remain for transaction history.

### Security rules

`firebase/firestore.rules` enforces:
- A user may create only their own **customer** profile and modify only their own name.
- Customers read only active products and their own request records; they cannot approve sales or change stock/roles.
- Managers may manage products, process requests, view reports, and configure the shop.
- Unknown collection paths deny all access. Firebase Console administrators are privileged and bypass client security rules.

The academic prototype assumes managers are trusted staff. For production, add dedicated server-side validation for every manager write, structured audit logs, anti-abuse controls, verified roles via custom claims and a full rules-emulator test suite.

## 5. Test checklist (run on emulator AND phone)

- [ ] Wrong password shows error without crash
- [ ] Create customer account; user appears in Firebase Authentication and Firestore
- [ ] Logout/login retains account properly
- [ ] Password reset email arrives
- [ ] New customer cannot create/edit products or read another customer's requests
- [ ] Manager profile promotion updates tabs without re-installing
- [ ] Manager creates product; customer sees it live
- [ ] Manager restocks; stock movement and customer quantity update
- [ ] Customer cannot submit without a WA pickup point, window and all three confirmations
- [ ] Self-collector request records the account holder and selected ID type
- [ ] Nominated collector requires full legal name, valid mobile and selected ID type
- [ ] Request card shows WA location, window, collector and compulsory ID warning
- [ ] Manager sees an explicit photo-ID confirmation before completing handover
- [ ] Manager completes pickup; stock decreases once, sale recorded once, customer status updates
- [ ] Second attempt to approve already completed request is blocked
- [ ] Out-of-stock approval fails without a partial sale
- [ ] No delivery option or non-WA location appears anywhere in checkout
- [ ] Six bundled featured photographs render without network access
- [ ] Imported Open Food Facts photographs render with network access and failed images fall back to category artwork
- [ ] Small Android screen / tablet layout remains usable
- [ ] No uncaught console warnings, permission denials or navigation errors

The automated suite includes currency, stock, SKU, reporting and catalogue-integrity tests plus WA-location, photo-ID confirmation and nominated-collector validation. Run the commands below before presenting and record the real emulator/device outcome rather than claiming an unperformed test.

Run the unit tests:

```bash
npm test
```

## 6. GitHub and Moodle submission

Use the [BottleFlow repository](https://github.com/nirajbhatt22/bottleflow-mobile) for the Moodle GitHub link. The repository contains the Expo app, Firestore rules, tests, and [presentation guide](docs/PRESENTATION_SCRIPT.md).

Add real emulator or phone screenshots to `docs/screenshots/` before submission. Include source, rules and documentation in `Niraj_Bhatt_BottleFlow_ITC502_Project3.zip`.

## Remaining integrations / honest limitations

- The checkout records and enforces an in-person photo-ID step in the workflow, but it deliberately does not upload, scan or automatically validate identity documents.
- Store cards use WA suburb/postcode pickup areas. A production operator must replace them with licensed premises, exact counter addresses and verified opening hours.
- Sample prices and availability are not a live retailer feed and must be maintained by a manager.
- The app does not take payments, offer delivery, send push notifications, ingest supplier invoices or provide automated legal-compliance certification.
- Imported product records are community-contributed Open Food Facts data and may be incomplete. The app links every imported record to its source and provides the required open-data attribution. Six separately bundled prototype images should still be reviewed or replaced with licensed supplier media before public distribution.

## Reference documentation

- Expo Firebase setup: https://docs.expo.dev/guides/using-firebase/
- Expo ImagePicker: https://docs.expo.dev/versions/latest/sdk/imagepicker/
- Firebase Authentication: https://firebase.google.com/docs/auth
- Cloud Firestore: https://firebase.google.com/docs/firestore
- Firestore security rules: https://firebase.google.com/docs/firestore/security/get-started
- Open Food Facts licensing: https://openfoodfacts.github.io/documentation/docs/Product-Opener/api/tutorials/license-be-on-the-legal-side/
