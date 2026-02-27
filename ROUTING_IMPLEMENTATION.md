# Real Road-Based Routing Implementation

## Overview

Eco-Route now uses **OpenStreetMap (OSM)** and **OpenRouteService (ORS) API** for accurate, real-world route calculations instead of estimated formulas.

### Key Features Implemented

1. **Real Road Routing** - Actual distance and travel time from OSM road network
2. **Interactive Maps** - Leaflet.js + OpenStreetMap tiles for route visualization
3. **Multiple Transport Modes** - Car, Bus, Train, Metro, Bike, Walking
4. **India-Specific Data** - Accurate costs (INR) and emissions for Indian context
5. **No Hardcoded Estimates** - Removed mock calculations, uses live API data

---

## Backend Implementation

### 1. OpenRouteService API Functions

Located in `app.py`:

#### `ors_geocode(text)` → `(lon, lat)`
Converts place names (e.g., "Mumbai", "Delhi Airport") to geographic coordinates using ORS Geocoding API.

```python
def ors_geocode(text):
    """Return (lon, lat) for a text place using OpenRouteService geocode API."""
```

**Returns:**
- `(longitude, latitude)` tuple or `None` if not found

---

#### `ors_directions(coord_from, coord_to, profile)` → `(distance_m, duration_s, geometry)`
Fetches actual road-based routing from ORS Directions API.

```python
def ors_directions(coord_from, coord_to, profile='driving-car'):
    """Return (distance_m, duration_s, geometry) using ORS directions endpoint."""
```

**Profiles:**
- `'driving-car'` - Car routing (default)
- `'cycling-regular'` - Bike routing
- `'foot-walking'` - Walking paths

**Returns:**
- `distance_m`: Distance in meters
- `duration_s`: Travel time in seconds
- `geometry`: GeoJSON LineString with route polyline

---

#### `get_distance_time(source, destination)` → `dict`
Main routing function that combines geocoding + direction queries for all transport modes.

```python
def get_distance_time(source, destination):
    """Return real distance, duration, and route geometry using OpenRouteService API."""
```

**Returns:**
```json
{
  "distance_km": 45.2,
  "duration_min": 62.5,
  "geometry": { "type": "LineString", "coordinates": [...] },
  "from_coord": [72.8479, 19.0176],
  "to_coord": [73.1234, 19.5678],
  "per_mode": {
    "car": { "distance_km": 45.2, "duration_min": 62.5 },
    "bike": { "distance_km": 48.1, "duration_min": 145.2 },
    "walking": { "distance_km": 45.2, "duration_min": 540.0 }
  }
}
```

---

### 2. Updated `/predict-route` Endpoint

**Request:**
```json
{
  "source": "Mumbai Central",
  "destination": "Colaba",
  "people": 2
}
```

**Response:**
```json
{
  "source": "Mumbai Central",
  "destination": "Colaba",
  "distance_km": 8.2,
  "duration_min": 15.3,
  "time_note": "Estimated (based on real roads, no live traffic)",
  "people": 2,
  "best_option": "train",
  "eco_score": 0.15,
  "co2_kg_per_person": {
    "car": 1.148,
    "bus": 0.41,
    "train": 0.246,
    "metro": 0.287,
    "bike": 0.0,
    "carpool": 0.574
  },
  "cost_inr": {
    "car": 98.4,
    "bus": 20.5,
    "train": 12.3,
    "metro": 28.7,
    "bike": 4.1,
    "carpool": 49.2
  },
  "route_geometry": {
    "type": "LineString",
    "coordinates": [[72.8479, 19.0176], [...], [73.0234, 19.0178]]
  },
  "start_coords": [72.8479, 19.0176],
  "end_coords": [73.0234, 19.0178],
  "per_mode": { ... },
  "co2_saved_pct_vs_car": 78.5,
  "reason": "Lower emission per person"
}
```

---

## Frontend Implementation

### 1. Leaflet.js Map Integration

**HTML Changes** (dashboard.html):

```html
<!-- Leaflet CSS -->
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css" />
<script src="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js"></script>

<!-- Map container -->
<div id="routeMap"></div>
```

---

### 2. Map Display Function (dashboard.js)

```javascript
function displayRouteOnMap(routeData) {
  const { route_geometry, start_coords, end_coords } = routeData;
  
  // Initialize Leaflet map (once)
  if (!routeLeafletMap) {
    routeLeafletMap = L.map('routeMap').setView([20.5937, 78.9629], 5);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(routeLeafletMap);
  }
  
  // Add start marker (green)
  L.circleMarker([start_coords[1], start_coords[0]], {
    radius: 8,
    fillColor: '#4CAF50',
    color: '#2E7D32',
    weight: 2
  }).bindPopup(`Start: ${routeData.source}`).addTo(routeLeafletMap);
  
  // Add end marker (red)
  L.circleMarker([end_coords[1], end_coords[0]], {
    radius: 8,
    fillColor: '#F44336',
    color: '#C62828',
    weight: 2
  }).bindPopup(`Destination: ${routeData.destination}`).addTo(routeLeafletMap);
  
  // Draw route polyline (blue)
  const coordinates = route_geometry.coordinates.map(c => [c[1], c[0]]);
  L.polyline(coordinates, {
    color: '#2196F3',
    weight: 3,
    opacity: 0.8
  }).addTo(routeLeafletMap);
  
  // Fit map to route bounds
  routeLeafletMap.fitBounds(bounds, { padding: [50, 50] });
}
```

---

### 3. Form Submission Flow

Changed from hardcoded calculations to API-based:

```javascript
travelForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const source = sourceInput.value.trim();
  const destination = destInput.value.trim();
  const people = parseInt(peopleInput.value) || 1;
  
  // Call backend API for real routing
  const response = await fetch('/predict-route', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ source, destination, people })
  });
  
  const apiData = await response.json();
  
  // Display map with real route geometry
  displayRouteOnMap(apiData);
  
  // Calculate recommendations using REAL distance
  const distance = apiData.distance_km;
  // ... rest of calculation using real data
});
```

---

## Environment Configuration

### .env File

The ORS API key is stored in `.env`:

```
ORS_API_KEY=your_actual_api_key_here
```

**Important:**
- Never commit `.env` to Git
- Get free API key from: https://openrouteservice.org/
- Free tier: 40 requests/min, 2,500 requests/day

---

## India-Specific Data

### Emission Factors (g CO₂/km per person)

```
car:      140 g  (petrol cars in Indian traffic)
bus:       50 g  (high occupancy)
metro:     35 g  (electric, efficient)
train:     30 g  (Indian Railways, most eco-friendly)
bike:       0 g  (zero emissions)
carpool:   70 g  (per person, shared vehicle)
```

### Cost Factors (₹ per km per person)

```
car:       12.0  (fuel + maintenance)
bus:        2.5  (most affordable public transport)
metro:      3.5  (city-dependent pricing)
train:      1.5  (cheapest long-distance)
bike:       0.5  (minimal cost)
carpool:    6.0  (per person, shared cost)
```

---

## API Key Setup

### Option 1: Free ORS Account

1. Visit https://openrouteservice.org/dev/#/signup
2. Sign up for free account
3. Copy your API key
4. Add to `.env` file:
   ```
   ORS_API_KEY=your_api_key_here
   ```

### Option 2: Docker (Self-hosted)

For advanced users who want to self-host ORS:

```bash
docker run -d --name ors -p 8080:8080 openrouteservice/openrouteservice:latest
```

Then update backend to use local endpoint.

---

## Accuracy & Limitations

### What's Accurate

✅ **Real road distances** - Based on actual OSM road network  
✅ **Travel times** - Calculated by road length + average speeds  
✅ **Route geometry** - Actual path via OpenRouteService  
✅ **Multiple transport modes** - Different profiles (car, bike, walking)  
✅ **Emission calculations** - Based on real distances  

### What's NOT Included

❌ **Live traffic** - No real-time traffic data (free tier limitation)  
❌ **Toll costs** - Not included in cost calculations  
❌ **Wait times** - Station waiting, traffic signals not modeled  
❌ **Weather impact** - Assumes standard conditions  
❌ **Surge pricing** - Fixed costs, not dynamic  

---

## Testing the Implementation

### 1. Start Flask Server

```bash
cd "d:\python\ecomart TE\Eco-route"
python app.py
```

### 2. Open Dashboard

```
http://127.0.0.1:5000/dashboard
```

### 3. Test Route Calculation

- **Source:** "Mumbai Central"
- **Destination:** "Colaba"
- **People:** 2

Expected: Map shows route, recommendations include trains as best option

### 4. Verify API Response

Open browser DevTools → Network tab → Look for `/predict-route` requests

Should see:
- `distance_km`: Real distance
- `route_geometry`: LineString with coordinates
- `cost_inr`: Prices in Indian Rupees
- `time_note`: "Estimated (based on real roads, no live traffic)"

---

## Code Comments & Documentation

All functions include:
- Purpose description
- Parameter documentation
- Return value specification
- Error handling

Example:

```python
def ors_directions(coord_from, coord_to, profile='driving-car'):
    """
    Return (distance_m, duration_s, geometry) using ORS directions endpoint.
    
    Args:
        coord_from (tuple): (lon, lat) starting coordinates
        coord_to (tuple): (lon, lat) ending coordinates
        profile (str): ORS routing profile ('driving-car', 'cycling-regular', 'foot-walking')
    
    Returns:
        tuple: (distance_m, duration_s, geometry_geojson) or (None, None, None) on error
    """
```

---

## File Changes Summary

### Backend Files Modified

| File | Changes |
|------|---------|
| `app.py` | Updated routing functions, added geometry return, enhanced `/predict-route` endpoint |
| `ml_model.py` | Updated emission factors for accuracy |

### Frontend Files Modified

| File | Changes |
|------|---------|
| `templates/dashboard.html` | Added Leaflet CDN, created map container |
| `static/js/dashboard.js` | Integrated Leaflet map, API-based routing, async form handler |

### Files NOT Modified

- CSS files (styling unchanged)
- Authentication files
- Profile functionality

---

## Performance Considerations

### API Calls

- **Per request:** 1-3 API calls (geocoding + direction queries)
- **Latency:** ~1-2 seconds (depends on ORS server)
- **Rate limit:** 40 requests/min for free tier

### Optimization Tips

1. **Cache results** - Store calculated routes in localStorage
2. **Debounce input** - Prevent multiple API calls while user typing
3. **Batch geocoding** - When calculating multiple routes, queue requests

---

## Future Enhancements

1. **Live Traffic** - Integrate with paid ORS traffic API
2. **Multi-waypoint routes** - Support intermediate stops
3. **Public Transport API** - Integrate real-time bus/train schedules
4. **Offline maps** - Download OSM tiles for offline usage
5. **Route alternatives** - Show multiple route options with different trade-offs

---

## Troubleshooting

### "No route found" Error

**Cause:** Invalid place names or locations outside India  
**Solution:** Use full place names (e.g., "Mumbai Central Railway Station" instead of "Mumbai")

### API returns 401 error

**Cause:** Invalid or expired ORS API key  
**Solution:** Check `.env` file, regenerate key from ORS dashboard

### Map not displaying

**Cause:** Leaflet CDN not loaded or JS errors  
**Solution:** Check browser console for errors, verify network connectivity

### Slow API responses

**Cause:** ORS free tier rate limiting or server load  
**Solution:** Implement caching, reduce request frequency, consider paid tier

---

## Contact & Support

For issues with:
- **Eco-Route app:** Check project documentation
- **OpenRouteService API:** https://openrouteservice.org/services/
- **Leaflet.js:** https://leafletjs.com/

