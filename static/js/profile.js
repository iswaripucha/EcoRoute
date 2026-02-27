// Profile.js - Handles user profile loading, editing, and saving

// Load user profile when page loads
document.addEventListener('DOMContentLoaded', function() {
  loadUserProfile();
  updateCompletionBar();
});

// Load user data from localStorage and populate form
function loadUserProfile() {
  // Check if user is logged in
  const currentUserStr = localStorage.getItem('ecoroute_user');
  
  if (!currentUserStr) {
    // Not logged in, redirect to login
    window.location.href = '/login';
    return;
  }

  try {
    const currentUser = JSON.parse(currentUserStr);
    
    // Populate basic info (read-only)
    document.getElementById('nameInput').value = currentUser.name || '';
    document.getElementById('emailInput').value = currentUser.email || '';
    document.getElementById('dobInput').value = currentUser.dob || '';
    
    // Populate contact details (editable)
    document.getElementById('phoneInput').value = currentUser.phone || '';
    document.getElementById('addressInput').value = currentUser.address || '';
    document.getElementById('cityInput').value = currentUser.city || '';
    document.getElementById('stateInput').value = currentUser.state || '';
    document.getElementById('countryInput').value = currentUser.country || '';
    document.getElementById('pincodeInput').value = currentUser.pincode || '';
    document.getElementById('emergencyInput').value = currentUser.emergency || '';
    
    // Populate preferences
    document.getElementById('transportInput').value = currentUser.preferredTransport || '';
    document.getElementById('priorityInput').value = currentUser.priority || 'eco';
    
  } catch (error) {
    console.error('Error loading profile:', error);
    showToast('Error loading profile. Please refresh the page.', 'error');
  }
}

// Calculate profile completion percentage
function calculateCompletion() {
  const requiredFields = [
    'phoneInput',
    'addressInput',
    'cityInput',
    'stateInput',
    'countryInput',
    'pincodeInput'
  ];
  
  let filledCount = 0;
  requiredFields.forEach(fieldId => {
    const value = document.getElementById(fieldId).value.trim();
    if (value.length > 0) {
      filledCount++;
    }
  });
  
  // Required fields: 6 (phone, address, city, state, country, pincode)
  // Optional: emergency contact, transport, priority
  const completion = Math.round((filledCount / requiredFields.length) * 100);
  return Math.min(completion, 100);
}

// Update completion bar visually
function updateCompletionBar() { 
  const completion = calculateCompletion();
  const fillEl = document.getElementById('completionFill');
  const textEl = document.getElementById('completionText');
  
  fillEl.style.width = completion + '%';
  textEl.textContent = `Profile ${completion}% complete`;
  
  // Change color based on completion
  if (completion >= 80) {
    fillEl.style.background = 'linear-gradient(90deg, #76C893 0%, #2F7D4F 100%)';
  } else if (completion >= 50) {
    fillEl.style.background = 'linear-gradient(90deg, #FFD700 0%, #FFA500 100%)';
  }
}

// Monitor input changes and update completion
document.addEventListener('input', function() {
  updateCompletionBar();
}, { passive: true });

// Validate profile fields
function validateProfile() {
  const requiredFields = [
    { id: 'phoneInput', label: 'Phone Number' },
    { id: 'addressInput', label: 'Address' },
    { id: 'cityInput', label: 'City' },
    { id: 'stateInput', label: 'State' },
    { id: 'countryInput', label: 'Country' },
    { id: 'pincodeInput', label: 'Postal Code' }
  ];
  
  const errors = [];
  
  requiredFields.forEach(field => {
    const value = document.getElementById(field.id).value.trim();
    if (!value) {
      errors.push(field.label);
    }
  });
  
  // Validate phone format (basic check)
  const phone = document.getElementById('phoneInput').value.trim();
  if (phone && phone.replace(/\D/g, '').length < 10) {
    errors.push('Phone number must have at least 10 digits');
  }
  
  return { valid: errors.length === 0, errors };
}

// Save profile changes
function saveProfile() {
  console.log('saveProfile() called');
  
  // Validate first
  const validation = validateProfile();
  console.log('Validation result:', validation);
  
  if (!validation.valid) {
    const errorMsg = validation.errors.length === 1 
      ? `Please fill in: ${validation.errors[0]}`
      : `Please fill in: ${validation.errors.join(', ')}`;
    console.log('Validation failed:', errorMsg);
    showToast(errorMsg, 'error');
    return;
  }
  console.log('Validation passed, proceeding to save');
  
  
  try {
    // Get current user from localStorage
    const currentUserStr = localStorage.getItem('ecoroute_user');
    console.log('Current user from localStorage:', currentUserStr);
    
    if (!currentUserStr) {
      console.error('No user data in localStorage!');
      showToast('User data not found. Please login again.', 'error');
      return;
    }
    
    const currentUser = JSON.parse(currentUserStr);
    console.log('Parsed user object:', currentUser);
    
    // Update user object with new values
    currentUser.phone = document.getElementById('phoneInput').value.trim();
    currentUser.address = document.getElementById('addressInput').value.trim();
    currentUser.city = document.getElementById('cityInput').value.trim();
    currentUser.state = document.getElementById('stateInput').value.trim();
    currentUser.country = document.getElementById('countryInput').value.trim();
    currentUser.pincode = document.getElementById('pincodeInput').value.trim();
    currentUser.emergency = document.getElementById('emergencyInput').value.trim();
    currentUser.preferredTransport = document.getElementById('transportInput').value;
    currentUser.priority = document.getElementById('priorityInput').value;
    
    // Mark profile as completed (for first-time users)
    currentUser.profileCompleted = true;
    currentUser.profileCompletedAt = new Date().toISOString();
    
    console.log('Updated user object:', currentUser);
    
    // Save back to localStorage
    localStorage.setItem('ecoroute_user', JSON.stringify(currentUser));
    console.log('Saved to localStorage successfully');
    
    // Show success message and redirect
    showToast('✅ Profile saved successfully! Redirecting...', 'success');
    console.log('Showing toast and preparing redirect to /dashboard');
    
    // Redirect back to dashboard after short delay to ensure save is complete
    setTimeout(() => {
      console.log('Redirecting to /dashboard for user:', currentUser.name);
      window.location.href = '/dashboard';
    }, 1000);
    
  } catch (error) {
    console.error('Error saving profile:', error);
    console.error('Error stack:', error.stack);
    showToast('Error saving profile. Please try again.', 'error');
  }
}

// Toast notification function
function showToast(message, type = 'info') {
  // Check if toast already exists
  let toast = document.getElementById('toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    toast.style.cssText = `
      position: fixed;
      bottom: 24px;
      left: 50%;
      transform: translateX(-50%);
      background: white;
      padding: 14px 20px;
      border-radius: 10px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.15);
      font-weight: 600;
      font-size: 14px;
      z-index: 1000;
      animation: slideUp 0.3s ease;
      border-left: 4px solid #2F7D4F;
    `;
    document.body.appendChild(toast);
  }
  
  // Set content and styling based on type
  toast.textContent = message;
  switch(type) {
    case 'success':
      toast.style.borderLeftColor = '#2F7D4F';
      toast.style.background = '#F0F9F5';
      toast.style.color = '#2F7D4F';
      break;
    case 'error':
      toast.style.borderLeftColor = '#E74C3C';
      toast.style.background = '#FFF5F5';
      toast.style.color = '#E74C3C';
      break;
    case 'info':
      toast.style.borderLeftColor = '#3498DB';
      toast.style.background = '#F0F8FF';
      toast.style.color = '#3498DB';
      break;
  }
  
  toast.style.display = 'block';
  
  // Auto-hide after 3 seconds
  setTimeout(() => { 
    toast.style.display = 'none';
  }, 3000);
}

// Add CSS animation for toast
const style = document.createElement('style');
style.textContent = `
  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateX(-50%) translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateX(-50%) translateY(0);
    }
  }
`;
document.head.appendChild(style);
