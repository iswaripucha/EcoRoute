# Quick Setup - Google Maps API Integration

## 1️⃣ Get Google Maps API Key (5 minutes)

### Option A: Google Cloud Console (Recommended)
```bash
1. Visit: https://console.cloud.google.com/
2. Click: "Create Project"
3. Enable APIs:
   - Maps JavaScript API
   - Directions API
4. Create API Key:
   - Go to Credentials → Create Credentials → API Key
   - Restrict to:
     ✓ Application: HTTP referrers
     ✓ APIs: Maps JavaScript API & Directions API
5. Copy key
```

### Option B: Google Maps Platform
```bash
1. Visit: https://cloud.google.com/maps-platform
2. Click: "Get Started" → Select APIs
3. Enable:
   - Maps JavaScript API
   - Directions API
4. Copy API Key
```

## 2️⃣ Configure Environment (2 minutes)

### Update `.env` file:
```bash
GOOGLE_MAPS_API_KEY=paste_your_key_here
SECRET_KEY=your_secret_key_here
```

### Or set environment variable:
```bash
export GOOGLE_MAPS_API_KEY="your_key_here"
```

## 3️⃣ Verify Setup (1 minute)

### Check Python:
```bash
python -c "import os; from dotenv import load_dotenv; load_dotenv(); print('Key:', os.environ.get('GOOGLE_MAPS_API_KEY'))"
```

Should show your API key (or None if not set).

## 4️⃣ Start Application (1 minute)

```bash
python app.py
```

Server should start on `http://localhost:5000`

## 5️⃣ Test Route (2 minutes)

1. Go to Dashboard: `http://localhost:5000/dashboard`
2. Login if needed
3. Enter route:
   - **Source**: Delhi
   - **Destination**: Mumbai
   - **People**: 1
4. Click: "Find Best Route 🚀"
5. Verify:
   - ✅ Google Map appears with route
   - ✅ Distance shows (e.g., "1500 km")
   - ✅ Time estimates show (e.g., "20 hours")
   - ✅ Route recommendations appear
   - ✅ No errors in console

## 6️⃣ Troubleshooting

### Map doesn't load:
```
Check:
1. Browser console for errors (F12 → Console)
2. API Key is correct in .env
3. API Key has Maps JS API enabled
4. Restart Flask: Ctrl+C, then python app.py
```

### "ZERO_RESULTS" error:
```
Try:
- Different city names (e.g., "New Delhi" instead of "Delhi")
- Both in India (Google default is India region)
- Check spelling
```

### API quota exceeded:
```
Check:
- Google Cloud Console → APIs & Services → Quotas
- Verify usage is within free tier
- Contact Google support for quota increase
```

## 7️⃣ What's Different?

| Old | New |
|-----|-----|
| OpenStreetMap (Leaflet) | Google Maps |
| OpenRouteService | Google Directions API |
| Static time estimate | Real-time traffic |
| Limited India coverage | Full India coverage |
| Slower response | Faster response |

## 8️⃣ Features Now Available

✅ Real-time traffic data  
✅ Accurate India routing  
✅ Traffic-aware duration (`traffic_duration_min`)  
✅ Interactive Google Map  
✅ Fast API responses  
✅ Better location detection  

## 9️⃣ Files Changed

- `app.py` - Backend routing logic
- `templates/dashboard.html` - HTML map container
- `static/js/dashboard.js` - Frontend map visualization
- `.env` - Configuration
- `GOOGLE_MAPS_SETUP.md` - Detailed setup guide
- `GOOGLE_MAPS_MIGRATION.md` - Complete migration details

## 🔟 Cost (Optional)

**Free tier includes:**
- $200/month credits
- ~10,000 requests/month free
- Directions API: $5 per 1000 requests
- Maps JS API: $7 per 1000 requests

**Example:** 10,000 queries/month ≈ $120 (covered by free tier)

## ✅ Deployment Checklist

- [ ] Get Google Maps API Key
- [ ] Update `.env` with GOOGLE_MAPS_API_KEY
- [ ] Restart Flask server
- [ ] Test with sample route
- [ ] Verify map displays
- [ ] Verify traffic data works
- [ ] Check browser console for errors
- [ ] Test with multiple routes
- [ ] Verify mobile responsiveness
- [ ] Deploy to production

## 📞 Support

If issues arise:
1. Check `GOOGLE_MAPS_SETUP.md` for detailed troubleshooting
2. Check `GOOGLE_MAPS_MIGRATION.md` for technical details
3. Check [Google API docs](https://developers.google.com/maps)
4. Check browser console (F12) for errors
5. Verify API Key and quotas in Google Cloud Console

## 🚀 You're Ready!

Your Eco-Route app now uses Google Maps for better India routing accuracy.

**Next Steps:**
1. Login to dashboard
2. Plan a route
3. See real-time traffic estimates
4. Get eco-friendly recommendations

Happy routing! 🌍
