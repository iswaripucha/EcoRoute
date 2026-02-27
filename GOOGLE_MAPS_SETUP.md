# Google Maps API Setup Guide

## Overview
Eco-Route has been upgraded to use **Google Maps APIs** for improved accuracy in India, replacing OpenStreetMap (Leaflet) and OpenRouteService (ORS).

## What Changed
- **Map Display**: Now uses Google Maps JavaScript API
- **Routing**: Google Directions API provides real-time traffic data
- **Distance & Duration**: Accurate calculations with India traffic models
- **No More**: Leaflet, OpenStreetMap, OpenRouteService

## Setup Steps

### 1. Get Google Maps API Keys

#### Option A: Google Cloud Console (Recommended)
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable these APIs:
   - **Maps JavaScript API**
   - **Directions API**
4. Create an API Key:
   - Go to "Credentials" → "Create Credentials" → "API Key"
   - Restrict the key to:
     - **Application restrictions**: HTTP referrers (for web)
     - **API restrictions**: Select only Maps JavaScript API & Directions API

#### Option B: Google Maps Platform
1. Visit [Google Maps Platform](https://cloud.google.com/maps-platform)
2. Click "Get Started"
3. Enable Maps JavaScript API and Directions API
4. Copy your API Key

### 2. Configure Environment Variables

#### Create or Update `.env` file in project root:
```bash
GOOGLE_MAPS_API_KEY=your_api_key_here
SECRET_KEY=your_secret_key
```

#### Or set environment variables in your deployment:
```bash
export GOOGLE_MAPS_API_KEY="YOUR_API_KEY"
```

### 3. Verify Setup

**Test in Python:**
```bash
python -c "import os; from dotenv import load_dotenv; load_dotenv(); print('API Key:', os.environ.get('GOOGLE_MAPS_API_KEY'))"
```

**Test in Browser Console (after login):**
```javascript
// Check if Google Maps loads
console.log(google.maps);
// Should return Maps object if loaded successfully
```

## API Features Used

### Maps JavaScript API
- Interactive map display
- Route visualization with DirectionsRenderer
- Real-time traffic layer
- Centered on India (20.5937°N, 78.9629°E)

### Directions API
- **Travel Mode**: DRIVING
- **Traffic Model**: BEST_GUESS (India-optimized)
- **Departure Time**: Current time (for accurate traffic)
- **Returns**:
  - Distance (meters)
  - Duration (seconds - normal)
  - Duration in Traffic (seconds - with traffic)
  - Route polyline (encoded)

## Data Flow

### Frontend → Backend → Google API → Response
1. User enters source & destination
2. Frontend sends `/predict-route` POST request
3. Backend calls Google Directions API with:
   ```json
   {
     "origin": "source location",
     "destination": "destination location",
     "mode": "driving",
     "departure_time": "now",
     "traffic_model": "best_guess"
   }
   ```
4. Backend extracts:
   - `distance_km` = distance/1000
   - `duration_min` = duration/60
   - `traffic_duration_min` = duration_in_traffic/60 (India traffic-aware)
5. Frontend receives and displays:
   - Distance and time estimates
   - Map with route polyline
   - Transport recommendations
   - CO₂ and cost calculations

## Troubleshooting

### "Google Maps API key is not defined"
- Check `.env` file has `GOOGLE_MAPS_API_KEY`
- Restart Flask server
- Clear browser cache

### Map doesn't load
- Verify API Key is correct
- Check Google Cloud Console quota usage
- Ensure "Maps JavaScript API" is enabled

### Directions return error
- Verify "Directions API" is enabled
- Check location names are valid in India
- Ensure API Key has API restrictions set correctly
- Check [Google Directions API docs](https://developers.google.com/maps/documentation/directions)

### Rate limiting issues
- Google Maps has generous free tier
- Monitor quota at [Google Cloud Console](https://console.cloud.google.com/iam-admin/quotas)

## Cost Estimation

**Google Maps pricing** (as of 2024):
- Maps JavaScript API: $7 per 1000 requests
- Directions API: $5 per 1000 requests
- Free tier includes $200/month credits

**Example cost for 10,000 user queries/month:**
- Maps JS: $70
- Directions: $50
- **Total: ~$120/month (covered by free tier)**

## Billing Setup

1. Enable billing in Google Cloud Console
2. Set up a billing account
3. Monitor usage in "Billing" → "Reports"
4. Optional: Set budget alerts

## Support & Documentation

- [Google Maps JavaScript API Docs](https://developers.google.com/maps/documentation/javascript)
- [Google Directions API Docs](https://developers.google.com/maps/documentation/directions)
- [API Keys & Authentication](https://developers.google.com/maps/gmp-get-started)

## Migration Notes

Removed code related to:
- OpenStreetMap tiles
- Leaflet map library
- OpenRouteService API calls
- Manual geocoding

All routing now goes through Google Directions API for better India coverage.
