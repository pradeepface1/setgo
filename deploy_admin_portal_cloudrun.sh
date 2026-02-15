#!/bin/bash

# Define Variables
PROJECT_ID="setgo-487018"
SERVICE_NAME="admin-portal"
REGION="asia-south1"

echo "Deploying Admin Portal to Cloud Run..."
echo "Project: $PROJECT_ID"
echo "Region: $REGION"

# Navigate to admin portal directory
cd /Users/pradeep/Desktop/setgo-oncall/admin-portal

# Deploy to Cloud Run (Source Deploy handles build & push)
echo "Deploying Service from Source..."
gcloud run deploy $SERVICE_NAME \
  --source . \
  --project $PROJECT_ID \
  --platform managed \
  --region $REGION \
  --allow-unauthenticated \
  --port 80 \
  -q

echo "Deployment Complete!"
