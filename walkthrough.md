### "Vibrant Operations" Theme Overhaul
Major visual redesign focusing on a premium, high-performance aesthetic.

*   **Design System Update**: Redefined the global color palette in `index.css` with vibrant indigios and emeralds. Integrated **Inter** typography for a modern feel.
*   **Glassmorphism Everywhere**: Implemented semi-transparent surfaces with backdrop-blur across the Sidebar, Header, and Dashboard cards.
*   **Sidebar Transformation**: 
    *   Switched to a deep **Slate-900** background.
    *   Added vibrant **Indigo-600** gradients for active states.
    *   Implemented a glowing **active-bar** and subtle ambient background glows.
*   **Dynamic Brand Identity**: Implemented a custom-engineered **SVG Logo component**:
    *   **Arrow Icon Restoration**: Replaced the abstract 'S' with a high-crisp **Double-Chevron Arrow** placed after "SETGO" with a clean 1-space gap.
    *   **Glowing Line Flare**: Implemented a dual-layer animation—a **diagonal shimmer** across the text and a **horizontal line flare** at the base—giving the brand a premium, high-tech glow.
    *   **Login Branding Cleanup**: Streamlined the login screen by removing redundant text, allowing the primary Logo component to carry the brand identity.
    *   **Vector Performance**: Scales perfectly at any size without pixelation.
    *   **Motion Icons**: Integrated CSS-pulsing highlights and "Speed Lines" to emphasize logistics.
    *   **Interactive Hover**: The logo now features a **Glow & Shimmer** effect when hovered.
    *   **Premium Typography**: Uses a bold, italic brand font with an **"Admin Portal"** tagline for clear identification.
*   **Vibrant Analytics**: 
    *   Redesigned dashboard status cards as "Glass Cards".
    *   Added **glowing status indicators** (Emerald for Online, Amber for Busy) with bold, tabular counts.
*   **Component Refinement**: 
    *   Upgraded `AvailableLorryList` with the new glassmorphic card style and animated status pulses.
    *   Refined the Header with a floating-style search bar and neon notification badges.
*   **Seti Rebranding**: Renamed the AI Admin Assistant to **Seti - AI Bot** and updated its persona and initial greeting for a more professional, automated experience.
*   **UI Cleanup**:
    *   Removed the "System Online" status indicator from the sidebar for a cleaner, more focused operational view.
    *   Removed the theme selection option from the Settings tab to lock the portal into the professional "Vibrant Operations" aesthetic.
    *   Removed the notification button from the Header for a more minimal and focused navigation experience.
*   **Dynamic Typography Selection**:
    *   Implemented a **Global Font Engine** in `SettingsContext` that dynamically loads Google Fonts on the fly.
    *   Added a **Typography Dropdown** in the Settings page with a live preview area.
    *   Curated a list of 8 professional fonts (Inter, Exo 2, Orbitron, JetBrains Mono, etc.) to suit different operational vibes.
    *   Persistence is handled via `localStorage`, ensuring the choice remains consistent across sessions.
*   **Premium Theme System**:
    *   Introduced 5 curated color palettes: **Midnight Neon**, **Arctic Frost**, **Cyber Industrial**, **Deep Forest**, and **Royal Velvet**.
    *   Implemented a CSS variable-driven architecture in `index.css` that dynamically updates Sidebar, Header, and Dashboard layouts.
    *   Included a **Theme Preview** UI in Settings with live color swatches.
    *   Locked the **Slip Formatting** section purely to Org Admins as per operational requirements.

### Bug Fixes & Refinement
*   **Quick Add Lorry Fix**:
    *   Resolved an issue where the "Quick Add Lorry" button appeared non-functional.
    *   Wrapped the `LogisticsTripForm` in a **proper modal overlay** with backdrop-blur, ensuring it is always visible and interactive.
    *   Added a secondary **"Quick Add" button** inside the `AvailableLorryList` empty state for better discoverability.
    *   Upgraded the form action buttons with **vibrant hover effects** and modern styling.
Major architectural upgrade of the dashboard map for high-performance vector rendering.

*   **Engine Migration**: Switched from Leaflet (Raster) to **MapLibre GL JS** (Vector/WebGL).
*   **Vector Style**: Integrated **basemaps.cartocdn.com** Dark Matter for crisp labels at any zoom level.
*   **Performance**: Optimized for high-density marker rendering and smooth, hardware-accelerated movements.
*   **3D Perspective**: Added a **45-degree pitch** to the map view for a modern, perspective-based "Control Hud" experience.
*   **Vector-Aware Markers**: Custom SVG markers now support high-fidelity rotation and scaling.

### Dashboard Map Enhancement: Phase 1 - "Control Center" Upgrade
Transformed the basic dashboard map into a high-fidelity operations hub.

*   **Midnight View**: Implemented **CartoDB Dark Matter** tile layer for a professional, high-contrast aesthetic.
*   **Custom Vehicle Markers**: Developed a `VehicleMarker` component using **SVG paths** for Trucks/Cabs.
    *   **Status-based Colors**: Green (Online), Amber (Busy), Gray (Offline).
    *   **Animated Pulse**: Online vehicles have a rotating status ring.
*   **Marker Clustering**: Integrated `react-leaflet-cluster` to group assets in high-density areas, improving performance and clarity.
*   **Glassmorphism HUD**: Added floating, semi-transparent UI overlays for the Fleet Legend and Live Feed status.

### Hand Loan & Direct Collection Implementation
Implemented logic to handle scenarios where the driver collects the full payment (Rate + Commission) from the consignor at the loading/unloading point.

*   **Backend Support**: Added `DIRECT_TO_DRIVER` to the `Trip.js` model for advanced and balance payment modes.
*   **Auto-Calculated Commission Tracking**: When "DIRECT TO DRIVER (Hand Loan)" is selected in the Billing section, the system automatically:
    *   Flags the `Pending With` field to **DRIVER**.
    *   Calculates the expected margin the driver must return to the company account.

![Direct Collection Logic Verified](file:///Users/pradeep/.gemini/antigravity/brain/e3f6b1e2-5fff-42cd-820f-fd587962066f/commission_tracking_pending_driver_1772007507234.png)

### Commission Tracking Fix
A `TypeError` crash occurred when opening the "New Trip" form due to uninitialized `commission` and `handLoan` objects. This has been fixed by:
1.  Ensuring all nested state objects are initialized in the `reset` block of `LogisticsTripForm`.
2.  Adding optional chaining (`?.`) to all JSX accesses of these objects.

![Commission Tracking Fixed](file:///Users/pradeep/.gemini/antigravity/brain/e3f6b1e2-5fff-42cd-820f-fd587962066f/.system_generated/click_feedback/click_feedback_1772004859696.png)

### Database & Maintenance
*   **Database Reset**: Executed a full cleanup of the local database to restore a "Day 0" state.
    *   Cleared **1145 Drivers**, **210 Consignors**, and **1625 Trips**.
    *   Removed **5 Organizations** and **55 Users**.
    *   Preserved the **Superadmin** account (`admin`) for uninterrupted access.

## Prerequisites
- Node.js (v18+)
- MongoDB (Running locally or connection string)
- Flutter SDK (for mobile apps)

## 1. Backend Setup
1. Navigate to `backend/`
2. Install dependencies: `npm install`
3. Start the server:
   ```bash
   npm run start
   ```
   > Server runs on port 5000. Ensure MongoDB is running.

## 2. Admin Portal Setup
1. Navigate to `admin-portal/`
2. Install dependencies: `npm install`
3. Start the dev server:
   ```bash
   npm run dev
   ```
4. Open browser at `http://localhost:5173`

### Workflows to Test
- **Trip Intake**: Use the "Paste Text" feature with the following sample:
  ```text
  Request: Alice
  Date: 2026-03-01 10:00
  Pickup: Central Station
  Drop: Tech Park
  Vehicle: Sedan Premium
  ```
- **Assignment**: Click "Assign" on a pending trip to open the modal and select a driver.

## 3. Mobile Apps (Flutter)
1. Navigate to `mobile-app/`
2. Run the app:
   ```bash
   flutter run
   ```
   > Select a simulator/emulator.

### Features
- **Driver Mode**: Login -> Toggle "Online" -> wait for trips (Simulated polling will show a trip after 5s).
- **Commuter Mode**: Click "Login as Commuter" to set vehicle preferences.

## Notes
- Real-time updates via Socket.io are partially implemented on backend but simulated via polling in Frontend for MVP stability.
- Google Maps and WhatsApp API integration are mocked.

## 4. Rostering (Taxi Platform)
We have implemented a corporate Rostering system for pre-scheduling duties.

### Manual Verification Scenarios
1. **Define Shift**: Navigate to **Rosters** -> **Shift Templates**. Create a "Morning Shift" (06:00 - 14:00).
2. **Assign Duty**: Go back to **Duty Grid**. Click the **+ ASSIGN** button for any driver on today's date in the "Morning Shift" row.
3. **Verify State**: The cell should turn blue. Refresh the page to ensure the assignment persists.
4. **Week Navigation**: Use the **<** and **>** buttons to verify date shifting in the grid.
