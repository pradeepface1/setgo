# Jubilant MVP Walkthrough

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
