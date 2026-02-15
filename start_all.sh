#!/bin/bash

# Kill any processes running on the ports
lsof -ti:5001,5173,5174,5175 | xargs kill -9 2>/dev/null

# Start Backend
cd backend && npm start &
echo "Backend started on port 5001"

# Start Admin Portal
cd admin-portal && npm run dev -- --port 5173 &
echo "Admin Portal started on port 5173"

# Start Commuter App
cd commuter-app && npm run dev -- --port 5174 &
echo "Commuter App started on port 5174"

# Start Driver App
cd driver-app && npm run dev -- --port 5175 &
echo "Driver App started on port 5175"

echo "All portals started! Press Ctrl+C to stop."
wait
