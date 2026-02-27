# Eco-Route Profile System - Quick Test Guide

## 🎯 How to Test the Profile System

### Test 1: First-Time User Flow
**Objective**: Verify new users are redirected to profile setup

1. Open `signup.html`
2. Enter:
   - Name: "John Doe"
   - Email: "john@test.com"
   - Password: "test123"
3. Click "Sign Up"
4. **Expected Result**: Automatically redirected to `profile.html`
5. Fill in the form:
   - Phone: "+91 9876543210"
   - Address: "123 Main Street"
   - City: "New York"
   - State: "NY"
   - Country: "USA"
   - Postal Code: "10001"
6. Click "Save Changes"
7. **Expected Result**: 
   - See toast: "✅ Profile saved successfully!"
   - Redirected to dashboard after 1.5 seconds
   - Eco points displayed in header
   - Welcome message shows user name

### Test 2: Login with Incomplete Profile
**Objective**: Verify profile block works after signup

1. Log out from dashboard (click 🚪 button)
2. Go to `login.html`
3. Enter same email: "john@test.com"
4. Enter password: "test123"
5. Click "Login"
6. **Expected Result**: Redirected to `profile.html` again (profile still incomplete flag)

### Test 3: Edit Profile from Dashboard
**Objective**: Verify profile can be edited from dashboard

1. After completing profile, you'll be on dashboard
2. Click the profile button (👤) in top header
3. **Expected Result**: Opens profile page with all saved data pre-filled
4. Edit a field (e.g., change phone number)
5. Click "Save Changes"
6. **Expected Result**: 
   - Toast shows success
   - Redirected back to dashboard
   - Data persisted (click profile button again to verify)

### Test 4: Profile Completion Tracking
**Objective**: Verify completion bar works correctly

1. Open `profile.html` (via profile button)
2. **Observe completion bar**:
   - Initially shows current completion %
   - Updates in real-time as you type
   - Changes color:
     - Gray (0-49%)
     - Yellow-Orange (50-79%)
     - Green (80%+)
3. Fill different numbers of required fields
4. **Expected Result**: Bar updates with correct percentage

### Test 5: Field Validation
**Objective**: Verify form validation works

1. Open profile from dashboard
2. Try clicking "Save Changes" without filling fields
3. **Expected Result**: Toast error: "Please fill in: [missing fields]"
4. Enter a phone number with only 5 digits
5. Click "Save Changes"
6. **Expected Result**: Toast error: "Phone number must have at least 10 digits"

### Test 6: Read-Only Fields
**Objective**: Verify locked fields cannot be edited

1. Open profile page
2. Try clicking on Name, Email, or DOB input fields
3. **Expected Result**: Fields are disabled (gray background, can't type)
4. See 🔒 icon with "Cannot be edited" note

### Test 7: Prevent Dashboard Access
**Objective**: Verify profile forces completion

1. Complete profile normally
2. Edit browser localStorage (via console):
   ```javascript
   const user = JSON.parse(localStorage.getItem('ecoroute_user'));
   user.profileCompleted = false;
   localStorage.setItem('ecoroute_user', JSON.stringify(user));
   ```
3. Refresh page or navigate to `dashboard.html`
4. **Expected Result**: Automatically redirected to `profile.html`

### Test 8: localStorage Persistence
**Objective**: Verify all data is saved correctly

1. Complete or update profile
2. Open browser Developer Tools (F12)
3. Go to Application → localStorage
4. Find "ecoroute_user" key
5. **Expected Result**: 
   - See all fields you entered: phone, address, city, state, country, pincode, etc.
   - `profileCompleted: true` is set
   - `profileCompletedAt` timestamp exists

### Test 9: Navigation
**Objective**: Verify back button works

1. Open profile from dashboard
2. Click "← Back to Dashboard" or "Cancel" button
3. **Expected Result**: Returns to dashboard without saving

### Test 10: Toast Notifications
**Objective**: Verify all toast types show correctly

1. **Success Toast**: Save valid profile → green toast with ✅
2. **Error Toast**: Try saving with missing fields → red toast with error
3. **Auto-hide**: Toasts disappear after 3 seconds
4. **Position**: Toasts appear at bottom-center of screen

## 📋 Demo Test User Credentials

```
Email: demo@test.com
Password: demo123

(Demo mode allows any login - profile will be marked incomplete)
```

## 🔍 Troubleshooting

| Issue | Solution |
|-------|----------|
| Profile page doesn't load | Check profile.html exists in frontend folder |
| Fields don't populate | Check localStorage has ecoroute_user key |
| Can't save profile | Ensure all 6 required fields are filled with 10+ digit phone |
| Redirects to login | Check auth.js has correct login logic |
| Can access dashboard without profile | Clear localStorage and log in fresh |
| Completion bar doesn't update | Check profile.js is loaded after HTML |

## 🚀 Expected Workflow

```
New User:
Signup → Profile Page (forced) → Fill Form → Save → Dashboard

Returning User (Complete):
Login → Dashboard (direct)

Returning User (Incomplete):
Login → Profile Page (forced) → Fill/Complete → Save → Dashboard

Edit Profile:
Dashboard → Click 👤 → Profile Page → Edit → Save → Dashboard
```

## ✅ Verification Checklist

- [ ] profile.html file exists
- [ ] profile.js file exists
- [ ] auth.js has profile redirect logic
- [ ] dashboard.js checks profileCompleted flag
- [ ] Profile button (👤) works from dashboard
- [ ] First-time users redirected to profile
- [ ] Profile saves to localStorage correctly
- [ ] All form validations work
- [ ] Completion bar updates in real-time
- [ ] Toast notifications display
- [ ] Users can edit profile and return to dashboard

---

**Ready to test!** Start with Test 1 for a complete flow verification.
