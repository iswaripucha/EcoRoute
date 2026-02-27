# Quick Start: Testing India-Specific Calculations

## 🚀 Quick Test

### Option 1: Run Calculation Tests

```bash
cd "d:\python\ecomart TE\Eco-route (latest) - Copy"
python test_india_calculations.py
```

**Expected Output:**
```
ALL TESTS PASSED ✅

📊 SUMMARY OF INDIA-SPECIFIC CALCULATIONS:
Train Fares (Distance Slabs):
  ≤10km: ₹5 | ≤15km: ₹10 | ≤30km: ₹15 | ≤45km: ₹20 | ≤60km: ₹25 | >60km: ₹30

Bus Fares (Formula: distance × 1.2, min ₹10, max ₹50)

Car Costs (Fuel-based: distance/15 × 105)
  Mileage: 15 km/liter | Petrol: ₹105/liter

CO₂ Factors (per km per person):
  Train: 25 g/km | Bus: 68 g/km | Car: 120 g/km

Eco Score Formula (0-100):
  (0.5 × CO₂_score) + (0.3 × Cost_score) + (0.2 × Time_score)
```

---

### Option 2: Test in Web Application

1. **Start the Flask server:**
   ```bash
   cd "d:\python\ecomart TE\Eco-route (latest) - Copy"
   python app.py
   ```

2. **Open browser:** http://localhost:5000

3. **Test routes:**

   **Route 1: Panvel → CSMT (23km)**
   - Expected costs:
     - Train: ₹15
     - Bus: ~₹28
     - Car: ~₹161
   - Expected CO₂:
     - Train: ~0.58 kg
     - Bus: ~1.56 kg
     - Car: ~2.76 kg
   - Expected best: Train (highest eco score)

   **Route 2: Mumbai → Pune (150km)**
   - Expected costs:
     - Train: ₹30
     - Bus: ₹50 (capped at max)
     - Car: ~₹1050
   - Expected CO₂:
     - Train: ~3.75 kg
     - Bus: ~10.2 kg
     - Car: ~18 kg
   - Expected best: Train (lowest emissions, reasonable price)

   **Route 3: Short distance (5km)**
   - Expected costs:
     - Train: ₹5
     - Bus: ₹10 (clamped to min)
     - Car: ~₹35
   - Note: Walking/cycling should be options

---

## 📊 What You'll See

### Result Cards Display:

```
🚆 Train
Score: 87/100
Eco: 88/100
Time: 110 mins
⏱️ Real-time traffic data from Google Maps (Estimated costs using Indian transport standards)
Cost: ₹15
CO₂: 0.575 kg/person
📊 Estimated using Indian transport standards
```

✅ **Cost comes from backend** (not hardcoded)
✅ **CO₂ is calculated** (not random)
✅ **Score reflects weighted formula** (eco-first)
✅ **Disclaimer shows transparency** (honest labeling)

---

## 🔍 How to Verify

### 1. Check Backend Response

Open DevTools (F12) → Network tab → Filter "predict-route":

```json
{
  "cost_inr": {
    "train": 15.0,
    "bus": 27.6,
    "car": 161.0,
    "carpool": 53.67,
    "walking": 0.0,
    "cycling": 0.0
  },
  "co2_kg_per_person": {
    "train": 0.575,
    "bus": 1.564,
    "car": 2.76,
    "carpool": 0.92,
    "walking": 0.0,
    "cycling": 0.0
  },
  "scores": {
    "train": 0.874,
    "bus": 0.878,
    "car": 0.37
  },
  "time_note": "Real-time traffic data from Google Maps (Estimated costs using Indian transport standards)"
}
```

✅ Values should match calculated values
✅ Scores should be 0-1 (multiply by 100 for display)

### 2. Check Calculations

For Panvel→CSMT (23km):
- Train: ₹15 (slab for ≤30km)
- Bus: 23 × 1.2 = ₹27.60
- Car: (23/15) × 105 = ₹161.00
- Train CO₂: 23 × 25 ÷ 1000 = 0.575 kg
- Bus CO₂: 23 × 68 ÷ 1000 = 1.564 kg
- Car CO₂: 23 × 120 ÷ 1000 = 2.760 kg

### 3. Verify Display

Result cards should show:
- ✅ Cost from `cost_inr` (not hardcoded)
- ✅ CO₂ from `co2_kg_per_person` (not random)
- ✅ Score from `scores` (weighted formula)
- ✅ Disclaimer: "Estimated using Indian..."
- ✅ Time from Google: real-time traffic estimate

---

## ⚙️ Configuration

All India-specific values are in:

**Backend (app.py, lines 118-270):**
- `calculate_train_cost()` - Distance slabs
- `calculate_bus_cost()` - Formula: distance × 1.2
- `calculate_car_cost()` - Mileage: 15 km/l, Price: ₹105/l
- `calculate_co2_emissions()` - Factors: 25/68/120 g/km
- `calculate_eco_score()` - Weights: 50/30/20

**Frontend (dashboard.js, lines 195-330):**
- JavaScript equivalents for fallback
- `transportOptions` - UI metadata only

---

## 📚 Files Reference

| File | Purpose |
|---|---|
| `test_india_calculations.py` | Run to verify all calculations |
| `INDIA_CALCULATIONS_GUIDE.md` | Detailed formula explanations |
| `IMPLEMENTATION_COMPLETE_INDIA_CALCS.md` | Implementation summary |
| `app.py` | Backend calculations (lines 118-270, 330+) |
| `static/js/dashboard.js` | Frontend display (lines 195-620) |

---

## 🎯 Validation Checklist

- [ ] Test script runs: `python test_india_calculations.py` ✅
- [ ] All 5 test cases pass ✅
- [ ] Train cost matches slab logic ✅
- [ ] Bus cost matches formula (distance × 1.2) ✅
- [ ] Car cost is fuel-based ✅
- [ ] CO₂ factors are India standard ✅
- [ ] Eco score is weighted formula ✅
- [ ] Web UI shows backend values ✅
- [ ] Disclaimers visible ("Estimated...") ✅
- [ ] Results make sense for India routes ✅

---

## 🚨 Troubleshooting

### Issue: Calculation results don't match

**Solution:** 
1. Check Python test: `python test_india_calculations.py`
2. Verify formulas in app.py lines 118-270
3. Check console (F12) for backend response
4. Compare expected vs actual

### Issue: Web page shows old values

**Solution:**
1. Hard refresh: Ctrl+Shift+R (Windows) / Cmd+Shift+R (Mac)
2. Clear browser cache
3. Restart Flask server
4. Check DevTools Network → predict-route response

### Issue: Google Maps API error

**Solution:**
1. Verify GOOGLE_MAPS_API_KEY in .env
2. Check API is enabled in Google Cloud Console
3. Verify API restrictions (if any)
4. See: GOOGLE_MAPS_SETUP.md

---

## 📞 Need Help?

1. **For calculation questions:**
   - See: `INDIA_CALCULATIONS_GUIDE.md`
   - Run: `python test_india_calculations.py`
   - Check: app.py lines 118-270

2. **For frontend issues:**
   - See: DevTools Console (F12)
   - Check: dashboard.js lines 195-620
   - Verify: API response in Network tab

3. **For setup issues:**
   - See: `GOOGLE_MAPS_SETUP.md`
   - See: `QUICK_START.md`
   - Check: .env file configuration

---

## ✅ You're Ready!

The India-specific calculations are now fully integrated and tested:

✅ Backend provides calculated costs (not hardcoded)
✅ Frontend displays backend values (with fallback)
✅ All costs are realistic for India routes
✅ CO₂ emissions use India standards
✅ Eco scores use weighted formula
✅ Users see "Estimated" disclaimer

**Start testing by:** Running `python test_india_calculations.py`

---

**Version:** 1.0
**Status:** ✅ READY
**Last Updated:** 2024
