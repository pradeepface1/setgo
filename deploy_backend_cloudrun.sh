#!/bin/bash

# Deploy Backend to Cloud Run
echo "Deploying Backend to Cloud Run..."

# Set Project ID
PROJECT_ID="setgo-487018"
REGION="asia-south1"
SERVICE_NAME="backend"

# Deploy
gcloud run deploy $SERVICE_NAME \
  --source . \
  --project $PROJECT_ID \
  --region $REGION \
  --allow-unauthenticated \
  --quiet

echo "Deployment Complete!"
