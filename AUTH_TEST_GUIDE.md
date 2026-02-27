# Authentication System - Quick Test Guide

## 🎯 Quick Start Testing

### Demo Credentials (Pre-registered)
```
Email: demo@example.com
Password: DemoPass123!

Email: test@example.com
Password: TestPass123!
```

---

## ✅ Test Scenarios

### Scenario 1: New User Registration (Email)

**Steps**:
1. Open `index.html`
2. Click "Get Started" button
3. Click "Continue with Email"
4. Enter email: `newuser@test.com`
5. Check "I'm not a robot" checkbox
6. Click "Send OTP"
7. **Check browser console** for mock OTP (printed for testing)
8. Enter 6-digit OTP from console
9. System auto-verifies when all 6 digits entered
10. Fill account setup form:
    - Name: "Test User"
    - DOB: "2000-01-15"
    - Password: `SecurePass123!`
    - Confirm Password: `SecurePass123!`
    - Check "I agree to terms"
11. Click "Create Account"
12. **Expected Result**: 
    - ✓ Toast: "Account created successfully!"
    - ✓ Auto-redirect to profile.html (1.5s delay)

---

### Scenario 2: New User - Complete Profile

**Prerequisites**: Completed registration from Scenario 1

**Steps**:
1. Land on `profile.html` after account creation
2. **Observe**:
   - Email shows as verified (green badge)
   - Name, Email, DOB are LOCKED (disabled fields)
   - Completion bar shows 0%
3. Fill in required fields:
   - Phone: `+91 9876543210`
   - Address: `123 Eco Street`
   - City: `New York`
   - State: `NY`
   - Country: `USA`
   - Postal Code: `10001`
4. **Observe**: Completion bar updates to ~67%
5. (Optional) Fill in optional fields:
   - Emergency Contact: `+91 9999999999`
   - Preferred Transport: `Bus`
6. Click "Save Changes"
7. **Expected Result**:
   - ✓ Toast: "✅ Profile saved successfully!"
   - ✓ Auto-redirect to dashboard.html
   - ✓ Welcome message shows user name
   - ✓ Eco points displayed

---

### Scenario 3: Returning User Login (Email)

**Prerequisites**: Completed profile from Scenario 2

**Steps**:
1. Open `login.html`
2. Enter:
   - Email: `newuser@test.com`
   - Password: `SecurePass123!`
3. Click "Login"
4. **Expected Result**:
   - ✓ Redirect to dashboard.html (profile already complete)
   - ✓ User greeted by name

**If Profile Incomplete**:
- Redirect to profile.html instead
- Must complete profile before accessing dashboard

---

### Scenario 4: Invalid Login

**Steps**:
1. Open `login.html`
2. Try:
   - Email: `newuser@test.com`
   - Password: `WrongPassword`
3. Click "Login"
4. **Expected Result**:
   - ✓ Error toast: "Invalid password. Please try again."

**Try non-existent email**:
1. Enter email: `nonexistent@test.com`
2. Click "Login"
3. **Expected Result**:
   - ✓ Error toast: "Email not found. Please check or create a new account."

---

### Scenario 5: Password Strength Validation

**Steps**:
1. Go to `account-setup.html` (via registration flow)
2. Try these passwords and observe strength meter:

| Password | Strength | Result |
|----------|----------|--------|
| `Pass1` | ❌ Weak | < 8 chars - fails |
| `Password1` | ❌ Weak | No special char |
| `Pass@Word` | ❌ Weak | No number |
| `Password1!` | ✅ Strong | All requirements met |

3. Watch rules checklist update in real-time
4. Color changes: Red → Yellow → Green

---

### Scenario 6: Profile Field Validation

**Steps**:
1. Go to profile.html (any user)
2. Try saving with empty required fields
3. **Expected Result**:
   - ✓ Error toast: "Please fill in: [field names]"
4. Enter phone: `12345` (only 5 digits)
5. Try saving
6. **Expected Result**:
   - ✓ Error toast: "Phone number must have at least 10 digits"

---

### Scenario 7: Edit Profile (Existing User)

**Steps**:
1. Login to dashboard
2. Click profile button (👤) in header
3. Modify a field (e.g., address)
4. Click "Save Changes"
5. **Expected Result**:
   - ✓ Toast: "✅ Profile saved successfully!"
   - ✓ Redirect back to dashboard.html
6. Click profile button again
7. **Expected Result**: Modified data is persisted

---

### Scenario 8: OTP Resend

**Steps**:
1. Go through email registration to OTP step
2. Click "Resend" button immediately
3. **Expected Result**: Button is DISABLED
4. Observe countdown timer (30s)
5. Wait for timer to complete
6. **Expected Result**: Button becomes ENABLED
7. Click "Resend"
8. **Expected Result**: Toast "✓ OTP resent successfully!"

---

### Scenario 9: Locked Fields Verification

**Steps**:
1. Go to profile.html (any logged-in user)
2. Try clicking on "Full Name" field
3. **Expected Result**: Field is disabled (gray, unclickable)
4. Observe lock icon (🔒) with "Cannot be edited"
5. Try clicking "Email Address"
6. **Expected Result**: Same - field is disabled
7. Try "Date of Birth"
8. **Expected Result**: Same - field is disabled

---

### Scenario 10: Session Persistence

**Steps**:
1. Complete registration and login
2. Open browser DevTools (F12)
3. Go to Application → localStorage
4. **Find keys**:
   - `ecoroute_user` (current session)
   - `ecoroute_users` (all users database)
5. Click on `ecoroute_user`
6. **Verify content**:
   - ✓ name field present
   - ✓ email field present
   - ✓ profileCompleted: true/false
   - ✓ All profile fields present
7. Refresh page
8. **Expected Result**: Data persists, no re-login needed

---

## 🔍 Browser Console Testing

### View Mock OTP
```javascript
// During email registration, open console and you'll see:
// "Demo OTP: 123456"
// Use this OTP in the verification form
```

### Check Current User
```javascript
// In console, run:
JSON.parse(localStorage.getItem('ecoroute_user'))

// Should return:
{
  name: "User Name",
  email: "user@example.com",
  profileCompleted: true/false,
  ...
}
```

### View All Users
```javascript
// In console, run:
JSON.parse(localStorage.getItem('ecoroute_users'))

// Should return object with all registered users
```

### Clear Session (for testing logout)
```javascript
localStorage.removeItem('ecoroute_user')
// Now you're logged out, trying to access dashboard will redirect to login
```

### Clear All Auth Data
```javascript
localStorage.clear()
// Removes all stored data (be careful!)
```

---

## 🚨 Error Scenarios to Test

| Scenario | Expected Error | How to Trigger |
|----------|----------------|----------------|
| Email already exists | "Email already registered" | Register twice with same email |
| Invalid email format | "Please enter valid email" | Enter `notanemail` |
| Password too short | "Must be 8+ characters" | Enter `Pass1!` (7 chars) |
| Passwords don't match | "Passwords do not match" | Different in password fields |
| Missing required field | "Please fill in: [field]" | Leave required field empty |
| Invalid OTP | "Invalid OTP. Try again." | Enter wrong 6-digit code |
| Phone < 10 digits | "10+ digits required" | Enter `123456` |
| No CAPTCHA check | "Verify you're not a robot" | Try sending OTP without checking |

---

## 📊 Flow Verification Checklist

### Email Registration Flow
- [ ] entry.html loads with two buttons
- [ ] "Continue with Email" goes to email-verify.html
- [ ] CAPTCHA checkbox required
- [ ] OTP sent to console (demo)
- [ ] OTP verification works
- [ ] Redirects to account-setup.html
- [ ] Password strength indicator works
- [ ] All 5 password rules show and validate
- [ ] Account created and user logged in
- [ ] Redirected to profile.html
- [ ] Profile completion required
- [ ] After profile save, redirected to dashboard

### Login Flow
- [ ] login.html loads correctly
- [ ] "Sign in here" link works
- [ ] Valid credentials allowed
- [ ] Invalid password shows error
- [ ] Nonexistent email shows error
- [ ] Successful login redirects correctly
- [ ] Profile incomplete users go to profile.html
- [ ] Profile complete users go to dashboard.html

### Profile Management
- [ ] Locked fields cannot be edited
- [ ] Completion bar updates in real-time
- [ ] 6 required fields enforced
- [ ] Phone validation (10+ digits)
- [ ] Save button works
- [ ] Data persists in localStorage
- [ ] Changes show after refresh

---

## 🔐 Security Testing

### Test: Direct Dashboard Access
```
1. Go directly to: /dashboard.html (without login)
2. Expected: Redirect to login.html
3. Test passes: ✓
```

### Test: Incomplete Profile Block
```
1. Edit localStorage:
   ecoroute_user.profileCompleted = false
2. Refresh page (in dashboard)
3. Expected: Redirect to profile.html
4. Test passes: ✓
```

### Test: Password Strength
```
1. Try creating account with weak password
2. Try: "Weak1" (no special)
3. Try: "STRONG!" (no number)
4. Try: "StrongPass123!" (all requirements)
5. Only the last should succeed
6. Test passes: ✓
```

---

## 📱 Mobile Testing

Test all pages on mobile:

```
1. Open DevTools (F12)
2. Click device toolbar (mobile view)
3. Test common screen sizes:
   - iPhone SE (375px)
   - iPhone 12 (390px)
   - Samsung Galaxy (412px)
   - Tablet (768px)

Check:
- [ ] Buttons are tap-able (48px+)
- [ ] Text is readable
- [ ] Forms stack properly
- [ ] No horizontal scroll
- [ ] Input fields are accessible
- [ ] OTP input fields work
```

---

## 🐛 Debugging Tips

### If OTP not appearing:
1. Check browser console (F12)
2. Look for message: "Demo OTP: XXXXXX"
3. Copy the 6-digit number

### If profile doesn't save:
1. Check console for errors
2. Verify all 6 required fields filled
3. Check phone is 10+ digits
4. Try in incognito mode

### If stuck on login:
1. Clear localStorage: `localStorage.clear()`
2. Refresh page
3. Start fresh registration

### If "Email already registered":
1. Use different email: `test2@example.com`
2. Or clear localStorage first

---

## ✨ Expected Outcomes

### New User Complete Flow
```
entry.html
  ↓
email-verify.html (Email + OTP)
  ↓
account-setup.html (Name + Password)
  ↓ [Auto login + redirect]
profile.html (Complete profile)
  ↓ [Save & redirect]
dashboard.html ✓ (Full access)
```

### Returning User Flow
```
login.html
  ↓ [Enter credentials]
dashboard.html ✓ (if profile complete)
   or
profile.html (if profile incomplete)
```

---

**Ready to test!** Start with Scenario 1 for a complete user journey.
