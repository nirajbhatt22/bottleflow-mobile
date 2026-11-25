# BottleFlow presentation guide

**Niraj Bhatt · ITC502 Project 3 · 10 minutes**

## Opening · 0:00–0:45

“BottleFlow is a mobile prototype for a WA pickup-only bottle shop. It gives customers one place to choose a pickup point, compare pack sizes and track their request. Staff use the same request to check who is collecting and record the handover.”

## Customer walkthrough · 0:45–3:30

1. Open **Home** and point out the pickup location in the top-right. Explain that a customer selects a WA pickup point before browsing.
2. Tap **Browse**, search for **Great Northern Super Crisp**, and open the **330 mL bottle**. Show the full product photo, 3.5% ABV and pack prices. Tap the **BottleFlow** logo to show that it returns Home.
3. Open **Cart** if you prepared a sample cart on a dedicated demo account. In checkout, point out the pickup window, who will collect and the payment preference. Select **Nominate another adult** to show the extra details the app asks for.

Say: “The named adult brings original photo ID, including when someone else collects. A payment preference is saved on the device for the counter. The app does not charge a card.”

## Pickup handover · 3:30–5:30

1. Open **Requests → Pickup demo**. On the sign-in screen, the same walkthrough is available through **Try pickup demo**.
2. Choose **Fremantle**, keep **Another adult** selected and tap **Preview sample request**. Point out **Awaiting pickup**, the address and the named collector.
3. Tap **Simulate ID check and pickup**. Show **Pickup completed**, then use **Start again** if you need to repeat it.

Say: “This is a practice example. A live request appears for the customer and the store team. In the live staff view, staff check the ID in person and then tap **Complete after ID check**.”

If you have permission to use a separate test environment and two dedicated demo accounts, you can show that live handover instead. Open and check both accounts before presenting. Use the example when you need a repeatable walkthrough with zero stock, payment or request changes.

## How it works · 5:30–7:30

- **React Native and Expo** render the phone screens and bundle the product images.
- **Firebase Authentication** handles accounts. **Cloud Firestore** listeners refresh requests and stock.
- **Firestore rules** separate customer and staff access. Store staff complete a pickup after confirming the photo ID in person.
- The completion transaction rechecks stock and writes the stock change, sale, movement history and request status together. If there is insufficient stock or the request is already processed, completion fails.

## Evidence and conclusion · 7:30–10:00

- Show the Android rehearsal screenshots. The project’s 24 automated tests and the TypeScript check passed. The Android pickup demo was checked with a nominated collector and, in a separate build with Firebase configuration disabled, with the account-holder example.
- If you have published the repository, open your actual GitHub URL. Point to `App.tsx` for the screens, `src/data.ts` for the pickup transaction and `firebase/firestore.rules` for role access.
- Finish with: “The feature I wanted to make clearest is pickup handover. A customer can see where to go, who must bring ID and whether collection has been completed.”

## Quick answers

**Does the demo need an account?** The practice walkthrough runs locally once the app is open. Live profiles, stock and requests use Firebase.

**Does the app verify identity?** Staff check the original document in person. BottleFlow records staff confirmation and does not scan or store an ID image.

**What happens if the same pickup is completed twice?** The completion transaction checks that the request is still pending and rejects a second completion.

**Does the weekly reminder stop a purchase?** It is a voluntary budget reminder. The customer can acknowledge it and continue.

**What should I do if the internet drops?** Use the practice walkthrough if the app is already open. Keep screenshots of the waiting and completed screens available so you can finish the presentation if Expo cannot start.

## Five minutes before presenting

- Open the app on the Android emulator and share only the emulator window.
- Rehearse the route once, including the **Preview sample request** and **Simulate ID check and pickup** buttons.
- Keep the rehearsal screenshots and presenter notes open separately.
