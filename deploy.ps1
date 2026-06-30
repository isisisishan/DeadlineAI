# Google Cloud Run Deployment Script
$ProjectID = "ishan-proj"
$Region = "us-central1"
$ServiceName = "momentum-ai"

Write-Host "Setting Google Cloud Project to $ProjectID..."
gcloud config set project $ProjectID

Write-Host "Enabling necessary APIs..."
gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com

Write-Host "Deploying directly to Google Cloud Run from source..."
# Since we have a Dockerfile, gcloud run deploy --source . will build and deploy the container automatically
gcloud run deploy $ServiceName --source . --region $Region --allow-unauthenticated --quiet

Write-Host "Deployment complete! Application should be live."
