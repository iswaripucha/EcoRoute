// Authentication system with new email/Google flow
document.addEventListener('DOMContentLoaded', () => {
  // No form event listeners needed - forms handle themselves
  // Global logout function
  window.ecoLogout = async function() {
    // Clear localStorage
    localStorage.removeItem('ecoroute_user');
    
    // Clear server session if exists
    try {
      await fetch('/api/logout', { method: 'POST' });
    } catch (e) {
      // Ignore errors
    }
    
    window.location.href = '/login';
  };

  // Initialize profile completion check on dashboard
  const isDashboard = window.location.pathname.includes('/dashboard');
  if (isDashboard) {
    const currentUser = JSON.parse(localStorage.getItem('ecoroute_user') || 'null');
    if (currentUser && !currentUser.profileCompleted) {
      window.location.href = '/profile';
    }
  }
});

// Google Sign-In Callback (to be integrated with actual Google SDK)
function handleGoogleCallback(response) {
  // This function is called by Google after user authenticates
  const credential = response.credential;
  
  // Decode JWT token (in production, verify on backend)
  const base64Url = credential.split('.')[1];
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const jsonPayload = decodeURIComponent(atob(base64).split('').map((c) => {
    return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
  }).join(''));

  const googleUser = JSON.parse(jsonPayload);

  // Check if user exists in localStorage
  const users = JSON.parse(localStorage.getItem('ecoroute_users') || '{}');
  const email = googleUser.email.toLowerCase();

  let currentUser;

  if (users[email]) {
    // Existing user - login
    currentUser = {
      name: users[email].name,
      email: email,
      dob: users[email].dob || '',
      authMethod: 'google',
      profileCompleted: users[email].profileCompleted !== false,
      preferences: users[email].preferences || { priority: 'eco' }
    };
  } else {
    // New user - create account
    const newUser = {
      name: googleUser.name,
      email: email,
      dob: googleUser.birthdate || '',
      authMethod: 'google',
      profileCompleted: false,
      registrationDate: new Date().toISOString(),
      preferences: { priority: 'eco' }
    };

    users[email] = newUser;
    localStorage.setItem('ecoroute_users', JSON.stringify(users));

    currentUser = newUser;
  }

  // Set current user
  localStorage.setItem('ecoroute_user', JSON.stringify(currentUser));

  // Redirect based on profile completion
  if (!currentUser.profileCompleted) {
    window.location.href = '/profile';
  } else {
    window.location.href = '/dashboard';
  }
}

// Utility function to check if user is authenticated
function isUserLoggedIn() {
  const user = localStorage.getItem('ecoroute_user');
  return user !== null;
}

// Utility function to get current user
function getCurrentUser() {
  const userStr = localStorage.getItem('ecoroute_user');
  return userStr ? JSON.parse(userStr) : null;
}

// Redirect to email signup/login page
function redirectToEmailEntry() {
  window.location.href = '/email-verify';
}
