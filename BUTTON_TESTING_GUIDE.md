# Eco-Route Dashboard - Complete Button Testing Guide

## 🧪 How to Test Each Button

### Prerequisites
- ✅ Flask app running on http://127.0.0.1:5000
- ✅ Browser console open (F12) to watch for errors

---

## 1️⃣ **LOGIN/SIGNUP FLOW** (First Time)

### Test Email Signup:
```
1. Go to http://127.0.0.1:5000/entry
2. Click "Continue with Email"
3. Enter test email: user@example.com
4. View console - should not show errors
5. Enter OTP when prompted (any 6 digits work in demo)
6. Click "Create Account"
7. Fill form:
   - Name: Test User
   - DOB: 01/01/1990
   - Password: TestPass123!
8. Click "Sign Up"
✅ Should redirect to Profile Page
```

### Test Returning Login:
```
1. Go to http://127.0.0.1:5000/login
2. Enter email: user@example.com (from signup)
3. Enter password: TestPass123!
4. Click "Login"
✅ Should redirect to Profile (if not completed) or Dashboard (if completed)
```

---

## 2️⃣ **PROFILE PAGE BUTTONS**

### Test Save Changes Button:
```
1. Already at Profile page from signup
2. Scroll to "Contact Details" section
3. Fill required fields:
   ✅ Phone: +91 9876543210
   ✅ Address: 123 Main St, Downtown
   ✅ City: Mumbai
   ✅ State: MH
   ✅ Country: India
   ✅ Postal Code: 400001
4. Optional:
   - Emergency Contact: +91 9999999999
   - Preferred Transport: Bus
   - Priority: Eco-Friendly
5. Click "Save Changes" button
✅ Green success toast appears: "✅ Profile saved successfully!"
✅ Auto-redirects to Dashboard after 1.5 seconds
```

### Test Cancel Button:
```
1. At Profile page
2. Make some changes to fields
3. Click "Cancel" button
✅ Redirects back to Dashboard
```

### Test Back Button:
```
1. At Profile page
2. Click "← Back to Dashboard" at top
✅ Navigates to Dashboard (no form submission)
```

---

## 3️⃣ **DASHBOARD HEADER BUTTONS**

### Test Logout Button:
```
1. At Dashboard
2. Click "Logout" button
✅ localStorage clears
✅ Session clears (API call)
✅ Redirects to Login page
```

### Test Profile Button (👤):
```
1. At Dashboard
2. Click "👤" button in header
✅ Navigates to Profile page
```

### Test Welcome Message:
```
1. Dashboard loaded
2. Check header: "Welcome back, Test User! 👋"
✅ Should show logged-in user's name (not "User")
✅ Eco Points should show: "🌱 0 pts"
```

---

## 4️⃣ **PREFERENCES SECTION**

### Test Edit Preferences Button:
```
1. At Dashboard - look for "Your Preferences" section
2. Click "Edit" button
✅ Modal opens with title "Edit Your Preferences"
3. Check current values are loaded:
   - Priority Type: [should be from profile]
   - Budget Range: [text field]
   - Preferred Transport: [dropdown]
   - Notifications: [On/Off toggle]
   - Walking distance limit: [number field]
4. Change values:
   - Priority: "💰 Low Cost"
   - Budget: "Medium"
   - Transport: "🚌 Public Bus"
   - Notifications: "Off"
   - Walking limit: "3"
5. Click "Save Preferences" button
✅ Toast: "✓ Preferences saved!"
✅ Modal closes
✅ Preference cards update with new values
```

### Test Modal Close (X button):
```
1. Open preferences modal (Edit button)
2. Click "×" button (top right of modal)
✅ Modal closes without saving
```

---

## 5️⃣ **ROUTE PLANNING FORM**

### Test Find Best Route Button:
```
1. At Dashboard - scroll to "Plan Your Journey" section
2. Enter:
   - Source: "Mumbai Central"
   - Destination: "Gateway of India"
   - People: 2
3. Select Priority: "🌱 Eco-Friendly" (click button)
✅ Button becomes highlighted/active
4. Click "Find Best Route 🚀" button
✅ Loading toast: "🔄 Fetching real route data from OpenStreetMap..."
✅ Results section expands
✅ Shows multiple transport options with scores
✅ Map appears with route drawn
✅ Metrics section shows: CO₂, Fuel, Cost, Time
✅ "Recommended Routes" heading appears
```

### Test Priority Buttons (Eco/Cost/Time):
```
1. At Plan Your Journey section
2. Try each button:
   - Click "🌱 Eco-Friendly" → Button highlights
   - Click "💰 Low Cost" → Button highlights (highlights switch)
   - Click "⚡ Fastest" → Button highlights (highlights switch)
3. Fill form and click "Find Best Route"
✅ Results should be sorted differently based on priority
```

### Test Number of People Field:
```
1. Source: "Mumbai Central"
2. Destination: "Gateway of India"
3. People field: Try values
   - 1 (default)
   - 5
   - 10
4. Results should show different costs (total * number of people)
✅ Carpool cost = cost per person
✅ Fuel/CO₂ may adjust based on person count
```

---

## 6️⃣ **ROUTE RESULTS SECTION**

### Test Result Cards (Click):
```
1. After getting results (5+ cards shown)
2. First card is already selected (highlighted)
3. Click on second card (e.g., "🚌 Public Bus")
✅ Card becomes highlighted
✅ First card loses highlight
✅ Metrics section updates:
   - CO₂ changes
   - Fuel changes
   - Cost changes
   - Time changes
```

### Test Map Display:
```
1. After getting route results
2. Scroll down - should see "Route Map (OpenStreetMap)" section
✅ Map is visible with:
   - Green marker at start (Mumbai Central)
   - Red marker at end (Gateway of India)
   - Green line showing route
   - Click route line - popup shows distance & time
```

### Test Eco Comparison Chart:
```
1. After getting results
2. Look for bar chart labeled "Eco Comparison — This Trip"
✅ Chart shows bars for each transport mode
✅ Compares CO₂ (green bars) and Fuel (lighter bars)
✅ Legend shows "CO₂ (kg)" and "Fuel (L × 10)"
```

---

## 7️⃣ **METRICS & FEEDBACK SECTION**

### Test Metrics Display:
```
1. After route calculation (results visible)
2. Look for "Impact Metrics" section with 4 cards:
   - 🌱 CO₂ Saved: X kg
   - ⛽ Fuel Saved: X L
   - 💵 Cost Estimate: ₹X
   - ⏱️ Travel Time: X mins
✅ All values should update when you click different result cards
```

### Test Feedback Buttons:
```
1. Route results visible
2. Scroll to "Share Your Feedback" section
3. Test each button:
   - Click "👍 Useful"
     ✅ Button becomes highlighted
     ✅ Toast: "✓ Feedback saved: useful"
   
   - Click "👎 Not Suitable"
     ✅ Button becomes highlighted (old one unhighlights)
     ✅ Toast: "✓ Feedback saved: not-useful"
   
   - Click "🔄 Try Again"
     ✅ Button becomes highlighted
     ✅ Toast: "✓ Feedback saved: try-again"
```

---

## 8️⃣ **ADDITIONAL FEATURES**

### Test Empty State:
```
1. Dashboard first loads
2. No routes calculated yet
3. Should see message at bottom:
   "👇 Enter your journey details above and click 
    "Find Best Route" to see results and comparison charts"
✅ Message disappears once routes are shown
```

### Test Error Handling:
```
1. Try invalid locations:
   - Source: "XYZ12345InvalidCity"
   - Destination: "NoSuchPlace99999"
2. Click "Find Best Route"
✅ Toast shows error message
✅ Results section remains visible
✅ Previous results still show (if any)
```

### Test Recent Journeys (if feature enabled):
```
1. After calculating a route
2. Scroll to "Recent Journeys" section
3. Should show previous journeys with "Recalculate" buttons
4. Click "Recalculate" on a journey
✅ Form fields populate with old journey data
✅ Page scrolls to form
✅ Route is automatically recalculated
```

---

## ✅ BUTTON TEST CHECKLIST

- [ ] Logout button → Clears data & redirects to login
- [ ] Profile button → Navigates to profile page
- [ ] Edit Preferences → Opens modal & saves settings
- [ ] Find Best Route 🚀 → Calculates and shows results
- [ ] Priority buttons (Eco/Cost/Time) → Highlight correctly
- [ ] Result cards → Highlight when clicked & metrics update
- [ ] Map → Shows with markers and route line
- [ ] Feedback buttons → Highlight and save feedback
- [ ] Recalculate button → Repopulates form with old journey
- [ ] Modal X button → Closes without saving
- [ ] Back to Dashboard → Returns to dashboard
- [ ] Save Changes (profile) → Redirects to dashboard

---

## 🎯 EXPECTED RESULTS

### ✅ All Buttons Should:
- Respond immediately (no lag)
- Show visual feedback (highlight/active state)
- Display appropriate toast messages
- Not show console errors
- Navigate or update page correctly

### ✅ No Console Errors Should Appear:
- Type F12 → Console tab
- Perform all button tests above
- Should be clean (no red error messages)

### ✅ Data Should Persist:
- Save preferences → Reload page → Values still there
- Complete profile → Logout & login → Welcome message shows name
- Calculate route → Close browser → Recent journeys save

---

## 🔧 TROUBLESHOOTING

### Button not responding?
1. Check browser console (F12) for errors
2. Verify Flask app is running: `curl http://127.0.0.1:5000/health`
3. Try hard refresh: Ctrl+Shift+R

### Toast not showing?
- Check if modal is open (may be behind)
- Look for CSS conflicts
- Check browser console for JavaScript errors

### Map not appearing?
- Ensure Leaflet CDN is loaded (check Network tab)
- Verify route data returned from API
- Check for console errors about L.map

### Preferences not saving?
- Both localStorage AND API should be updated
- Refresh page - values should persist from localStorage
- Check Network tab to see if POST request succeeded

---

**Testing Date:** ___________  
**Tester Name:** ___________  
**Issues Found:** ___________

