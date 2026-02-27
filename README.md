# SetGo OnCall - Project Overview

## 📱 Mobile App Development Protocol (STRICT)

**WARNING:** Do NOT edit the code in `roadpilot_mobile`, `setgo_driver`, or `setgo_commuter` directly.

### 1. Local-First Workflow
We maintain separate folders for **Local (Dev)** and **Staging (Cloud)** environments to prevent configuration accidents.

-   **Local Folders (`*_local`)**: Use these for ALL development and testing. They are hardcoded to point to `http://10.0.2.2:5001/api`.
-   **Staging Folders (Original)**: These are for Staging/Production builds ONLY. They point to the Cloud Backend.

### 2. How to Make Changes
1.  **Edit Code** in the `_local` folder (e.g., `roadpilot_mobile_local`).
2.  **Test** using the script: `./mobile_manager.sh roadpilot local run`.
3.  **Promote** using the script: `./promote_to_staging.sh roadpilot`.
    *   *This script safely copies your code to the staging folder while preserving the staging API configuration.*
4.  **Build Staging** using: `./mobile_manager.sh roadpilot staging build`.

### 3. Helper Scripts
-   `./mobile_manager.sh`: Unified command to run or build any app in any environment.
-   `./promote_to_staging.sh`: Automates the sync from Local -> Staging.

---

## 📂 Directory Structure
-   `admin-portal/`: React Admin Dashboard
-   `backend/`: Node.js/Express Backend
-   `roadpilot_mobile/`: Roadpilot App (STAGING)
-   `roadpilot_mobile_local/`: Roadpilot App (LOCAL DEV)
-   `setgo_driver/`: Driver App (STAGING)
-   `setgo_driver_local/`: Driver App (LOCAL DEV)
-   `setgo_commuter/`: Commuter App (STAGING)
-   `setgo_commuter_local/`: Commuter App (LOCAL DEV)
