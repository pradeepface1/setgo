# Flutter & Production Deployment Plan

## Current Status
The enhancements (Pickup Context, Dropdown, Google Location) are implemented in the **Web React Apps** and **Backend**. To reflect these changes on the **Android Apps** and **Production Admin Portal**, the following steps are required.

## 1. Flutter Commuter App (`setgo_commuter`)
**Goal**: Replicate the "Enhanced Booking Flow" in the native Android app.

### Proposed Changes
#### [MODIFY] `lib/screens/booking_screen.dart` (or equivalent)
*   **UI Additions**:
    *   Add `DropdownButton<String>` for `Pickup Type` (Airport, Railway Station, Bus Stand, Others).
    *   Add conditional `TextFormField` for Context:
        *   If Airport selected -> Show "Flight Number".
        *   If Railway/Bus -> Show "Train/Bus Details".
    *   Add optional `TextFormField` for `Google Location`.
*   **Logic**:
    *   Update `submitTrip()` function to include:
        *   `pickupType`
        *   `pickupContext` (Object)
        *   `googleLocation`
    *   Validate mandatory fields before submission.

#### [MODIFY] `lib/models/trip.dart`
*   Add new fields to the `Trip` model class:
    *   `String? pickupType`
    *   `Map<String, dynamic>? pickupContext`
    *   `String? googleLocation`
*   Update `toJson()` method to serialize these fields for the API.

---

## 2. Flutter Driver App (`setgo_driver`)
**Goal**: Display the new trip details to the driver.

### Proposed Changes
#### [MODIFY] `lib/widgets/trip_card.dart`
*   **UI Updates**:
    *   Display `Pickup Type` badge next to location.
    *   Show `Flight/Train/Bus No` details below pickup location.
    *   Make `Customer Phone` tappable (`launchUrl('tel:...')`).
    *   Add `Navigate to Pickup` button (`launchUrl(googleLocation)`).

#### [MODIFY] `lib/models/trip.dart`
*   Add fields: `pickupType`, `pickupContext`, `googleLocation`.
*   Update `fromJson()` method to deserialize API response.

---

## 3. Production Deployment
**Goal**: Make changes live for Admin users.

### Admin Portal (`admin-portal`)
*   **Build**: Run `npm run build` to generate production assets.
*   **Deploy**: Deploy to Firebase Hosting (or current host).

### Android Apps
*   **Build**: Run `flutter build apk --release`.
*   **Distribute**: Re-install on devices/emulator.

## Verification
1.  **Emulator**: Launch updated Flutter apps.
2.  **Flow**: Create trip in Commuter App (Flutter) -> Verify in Driver App (Flutter) & Admin Portal (Prod).
