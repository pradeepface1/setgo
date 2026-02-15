# SetGo OnCall - Multi-Tenant Transportation Platform

This project consists of four main components:

1.  **Backend API**: Node.js/Express server with MongoDB.
2.  **Admin Portal**: React Admin Dashboard for Org/Super Admins.
3.  **Driver App**: Mobile-first Web App for Drivers.
4.  **Commuter App**: Mobile-first Web App for Employees/Commuters.

## Prerequisites

-   Node.js (v18+)
-   MongoDB (Running locally on default port 27017)

## How to Run

You need to run each component in a separate terminal window.

### 1. Backend Server
```bash
cd backend
npm install
npm start
```
*Port: 5001*

### 2. Admin Portal
```bash
cd admin-portal
npm install
npm run dev
```
*Port: 5173 (http://localhost:5173)*

### 3. Commuter App
```bash
cd commuter-app
npm install
npm run dev
```
*Port: 5174 (http://localhost:5174)*

### 4. Driver App
```bash
cd driver-app
npm install
npm run dev
```
*Port: 5175 (http://localhost:5175)*

## Features

-   **Super Admin**: Manage multiple Organizations.
-   **Org Admin**: Manage Drivers, Trips, and Users for a specific Organization.
-   **Driver Trip Flow**: Accept, Start (OTP), and Complete trips (with image upload).
-   **Commuter App**: View assigned trips and history.

## Environment Variables

Ensure each folder has its `.env` file configured.
-   **Backend**: `MONGO_URI`, `JWT_SECRET`, `PORT=5001`
-   **Frontend Apps**: `VITE_API_URL=http://localhost:5001/api`
