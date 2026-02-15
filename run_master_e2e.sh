#!/bin/bash

echo "🚀 Starting Master E2E Test Suite..."

# Step 1: Infrastructure Setup (Admin Portal)
echo "\n[Stage 1] Setting up Organization, Admin, Drivers, and Commuters..."
cd admin-portal
npx playwright test tests/e2e/01_setup_infrastructure.spec.js
if [ $? -ne 0 ]; then
    echo "❌ Stage 1 Failed. Aborting."
    exit 1
fi
cd ..

# Step 2: Driver Go Online (Driver App - Maestro)
echo "\n[Stage 2] Activating Driver..."
maestro test setgo_driver/e2e_go_online.yaml
if [ $? -ne 0 ]; then
    echo "❌ Stage 2 Failed. Aborting."
    exit 1
fi

# Step 3: Request Trip (Commuter App - Maestro)
echo "\n[Stage 3] Requesting Trip..."
maestro test setgo_commuter/e2e_request_trip.yaml
if [ $? -ne 0 ]; then
    echo "❌ Stage 3 Failed. Aborting."
    exit 1
fi

# Step 4: Admin Assignment (Admin Portal)
echo "\n[Stage 4] Assigning Trip..."
cd admin-portal
npx playwright test tests/e2e/04_assign_trip.spec.js
if [ $? -ne 0 ]; then
    echo "❌ Stage 4 Failed. Aborting."
    exit 1
fi
cd ..

# Step 5: Complete Trip (Driver App - Maestro)
echo "\n[Stage 5] Completing Trip..."
maestro test setgo_driver/e2e_complete_trip.yaml
if [ $? -ne 0 ]; then
    echo "❌ Stage 5 Failed. Aborting."
    exit 1
fi

# Step 6: Verify Reports (Admin Portal)
echo "\n[Stage 6] Verifying Reports..."
cd admin-portal
npx playwright test tests/e2e/06_verify_reports.spec.js
if [ $? -ne 0 ]; then
    echo "❌ Stage 6 Failed. Aborting."
    exit 1
fi
cd ..

echo "\n✅ Master E2E Suite Completed Successfully!"
