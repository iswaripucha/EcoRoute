// Dashboard functionality
let currentUser = null;

document.addEventListener('DOMContentLoaded', async () => {
  // Check if user is logged in - try server session first, then localStorage
  try {
    const response = await fetch('/api/session');
    if (response.ok) {
      const data = await response.json();
      currentUser = data.user;
    } else {
      // Fall back to localStorage
      const storedUser = localStorage.getItem('ecoroute_user');
      if (!storedUser) {
        window.location.href = '/login';
        return;
      }
      currentUser = JSON.parse(storedUser);
      // Ensure required properties exist - check both camelCase and snake_case for compatibility
      if (!currentUser.profileCompleted && !currentUser.profile_completed) {
        window.location.href = '/profile';
        return;
      }
    }
  } catch (e) {
    // Fall back to localStorage
    const storedUser = localStorage.getItem('ecoroute_user');
    if (!storedUser) {
      window.location.href = '/login';
      return;
    }
    currentUser = JSON.parse(storedUser);
    if (!currentUser.profileCompleted && !currentUser.profile_completed) {
      window.location.href = '/profile';
      return;
    }
  }

  // Ensure currentUser has necessary properties
  if (!currentUser.name) {
    window.location.href = '/login';
    return;
  }

  // ===== DOM ELEMENTS =====
  const welcomeMsg = document.getElementById('welcomeMsg');
  const welcomeTitle = document.getElementById('welcomeTitle');
  const logoutBtn = document.getElementById('logoutBtn');
  const profileBtn = document.getElementById('profileBtn');
  const travelForm = document.getElementById('travelForm');
  const sourceInput = document.getElementById('source');
  const destInput = document.getElementById('destination');
  const distanceInput = document.getElementById('distance');
  const peopleInput = document.getElementById('people');
  const priorityBtns = document.querySelectorAll('.priority-btn');
  const resultsSection = document.getElementById('resultsSection');
  const resultsGrid = document.getElementById('resultsGrid');
  const metricsSection = document.getElementById('metricsSection');
  const feedbackSection = document.getElementById('feedbackSection');
  const prefSection = document.getElementById('prefSection');
  const editPrefsBtn = document.getElementById('editPrefsBtn');
  const prefModal = document.getElementById('prefModal');
  const closePrefModal = document.getElementById('closePrefModal');
  const prefForm = document.getElementById('prefForm');
  const prefPriority = document.getElementById('prefPriority');
  const prefBudget = document.getElementById('prefBudget');
  const prefTransport = document.getElementById('prefTransport');
  const ecoPointsEl = document.getElementById('ecoPoints');
  const bestRouteCard = document.getElementById('bestRouteCard');
  const miniComparison = document.getElementById('miniComparison');
  const routeMap = document.getElementById('routeMap');
  const mapPreview = document.getElementById('mapPreview');
  const alertsEl = document.getElementById('alerts');
  const ecoImpactSummary = document.getElementById('ecoImpactSummary');
  const recentJourneysEl = document.getElementById('recentJourneys');
  const smartSuggestionsEl = document.getElementById('smartSuggestions');
  const notifySelect = document.getElementById('notifySelect');
  const walkLimitInput = document.getElementById('walkLimitInput');
  const ecoComparisonChartEl = document.getElementById('ecoComparisonChart');
  const chartContainer = document.getElementById('chartContainer');
  let ecoComparisonChart = null;
const TIME_NOTE = "Real-time traffic data from Google Maps";

  // ===== WELCOME MESSAGE =====
  welcomeMsg.textContent = `Welcome back, ${currentUser.name || 'User'}! 👋`;
  welcomeTitle.textContent = `Welcome ${currentUser.name || 'User'}! 🚀`;

  // ===== PREFERENCES DISPLAY & EDIT =====
  const displayPreferences = () => {
    const prefs = currentUser.preferences || {};
    const priorityLabels = { eco: '🌱 Eco-Friendly', cost: '💰 Low Cost', time: '⚡ Fastest' };
    prefPriority.textContent = priorityLabels[prefs.priority] || 'Eco-Friendly';
    prefBudget.textContent = prefs.budget || 'Any';
    const transportLabels = { walk: '🚶 Walking', cycle: '🚴 Cycling', bus: '🚌 Bus', train: '🚆 Train', carpool: '🚗 Carpool' };
    prefTransport.textContent = transportLabels[prefs.transport] || 'Not set';
    // notifications & walk limit
    if (notifySelect && prefs.notify !== undefined) notifySelect.value = prefs.notify;
    if (walkLimitInput && prefs.walkLimit !== undefined) walkLimitInput.value = prefs.walkLimit;
    // eco points
    const pts = currentUser.points || 0;
    if (ecoPointsEl) ecoPointsEl.textContent = `🌱 ${pts} pts`;
    // render recent journeys
    renderRecentJourneys();
  };

  displayPreferences();

  editPrefsBtn.addEventListener('click', () => {
    prefModal.classList.add('show');
    document.getElementById('prioritySelect').value = currentUser.preferences?.priority || 'eco';
    document.getElementById('budgetInput').value = currentUser.preferences?.budget || '';
    document.getElementById('transportSelect').value = currentUser.preferences?.transport || '';
    if (notifySelect) notifySelect.value = currentUser.preferences?.notify || 'on';
    if (walkLimitInput) walkLimitInput.value = currentUser.preferences?.walkLimit || 5;
  });

  closePrefModal.addEventListener('click', () => {
    prefModal.classList.remove('show');
  });

  prefForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const prefData = {
      priority: document.getElementById('prioritySelect').value,
      budget: document.getElementById('budgetInput').value,
      transport_preference: document.getElementById('transportSelect').value,
      notifications_enabled: notifySelect ? notifySelect.value === 'on' : true,
      walking_distance_limit: walkLimitInput ? parseFloat(walkLimitInput.value) || 0 : 0
    };
    
    try {
      // Try to save via API
      const response = await fetch(`/api/user/${currentUser.id || currentUser.email}/preferences`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(prefData)
      });
      
      // Also save to localStorage for offline access
      currentUser.preferences = prefData;
      localStorage.setItem('ecoroute_user', JSON.stringify(currentUser));
      
      if (response.ok || !response.ok) { // Save success either way since we have localStorage
        showToast('✓ Preferences saved!');
        prefModal.classList.remove('show');
        displayPreferences();
      }
    } catch (error) {
      console.error('Error:', error);
      // Save to localStorage anyway
      currentUser.preferences = prefData;
      localStorage.setItem('ecoroute_user', JSON.stringify(currentUser));
      showToast('✓ Preferences saved!');
      prefModal.classList.remove('show');
      displayPreferences();
    }
  });

  // ===== LOGOUT =====
  logoutBtn.addEventListener('click', () => {
    window.ecoLogout();
  });

  // ===== PROFILE BUTTON =====
 if (profileBtn) {
  profileBtn.addEventListener('click', () => {
    window.location.href = '/profile';
  });
}


  // ===== PRIORITY SELECTION =====
  let selectedPriority = currentUser.preferences?.priority || 'eco';
  
  priorityBtns.forEach(btn => {
    if (btn.dataset.priority === selectedPriority) {
      btn.classList.add('active');
    }
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      priorityBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedPriority = btn.dataset.priority;
    });
  });

  // ===== INDIA-SPECIFIC TRANSPORT COST & EMISSIONS HELPERS =====
  
  /**
   * Calculate local train fare (Mumbai Suburban Logic - Distance Slabs)
   * Returns fare in INR per person for single journey
   */
  function calculateTrainCost(distKm) {
    if (distKm <= 10) return 5;
    else if (distKm <= 15) return 10;
    else if (distKm <= 30) return 15;
    else if (distKm <= 45) return 20;
    else if (distKm <= 60) return 25;
    else return 30;
  }
  
  /**
   * Calculate bus fare (India city transport approximation)
   * Formula: cost = distance_km * 1.2, with min ₹10, max ₹50
   */
  function calculateBusCost(distKm) {
    let cost = distKm * 1.2;
    cost = Math.max(10, Math.min(50, cost)); // Clamp between ₹10 and ₹50
    return Math.round(cost * 100) / 100;
  }
  
  /**
   * Calculate car cost (fuel-based)
   * mileage = 15 km/l, petrol = ₹105/litre
   */
  function calculateCarCost(distKm) {
    const mileage = 15; // km per liter
    const petrolPrice = 105; // ₹ per liter
    const fuelUsed = distKm / mileage;
    const cost = fuelUsed * petrolPrice;
    return Math.round(cost * 100) / 100;
  }
  
  /**
   * Calculate carpool cost (shared car cost per person)
   */
  function calculateCarpoolCost(distKm, people) {
    if (people < 1) people = 1;
    const carCost = calculateCarCost(distKm);
    const costPerPerson = carCost / people;
    return Math.round(costPerPerson * 100) / 100;
  }
  
  /**
   * Calculate CO₂ emissions (kg per person)
   * Factors: Train=25, Bus=68, Car=120, Carpool=120 (g CO₂/km)
   */
  function calculateCO2(distKm, mode, people) {
    const factors = {
      train: 25,
      bus: 68,
      car: 120,
      carpool: 120,
      walking: 0,
      cycling: 0
    };
    
    const factor = factors[mode] || 0;
    let totalGrams;
    
    if (mode === 'carpool' && people > 1) {
      totalGrams = (distKm * factor) / people;
    } else {
      totalGrams = distKm * factor;
    }
    
    // Convert grams to kg
    return Math.round(totalGrams / 1000 * 1000) / 1000;
  }

  // ===== TRANSPORT OPTIONS DATABASE (Using API Data) =====
  const transportOptions = {
    walking: {
      name: '🚶 Walking',
      emoji: '🚶',
      cost: () => 0,
      co2: () => 0,
      fuel: () => 0,
      description: 'Zero emissions, best for health',
      isBest: (dist) => dist <= 5
    },
    cycling: {
      name: '🚴 Cycling',
      emoji: '🚴',
      cost: () => 0,
      co2: () => 0,
      fuel: () => 0,
      description: 'Eco-friendly & free transport',
      isBest: (dist) => dist <= 15
    },
    bus: {
      name: '🚌 Public Bus',
      emoji: '🚌',
      cost: (dist, people) => calculateBusCost(dist) * people,
      co2: (dist, people) => calculateCO2(dist, 'bus', people),
      fuel: (dist, people) => Math.round(dist * 0.006 / people * 100) / 100,
      description: 'Affordable & significantly reduces emissions',
      isBest: () => true
    },
    train: {
      name: '🚆 Train',
      emoji: '🚆',
      cost: (dist, people) => calculateTrainCost(dist) * people,
      co2: (dist, people) => calculateCO2(dist, 'train', people),
      fuel: (dist, people) => Math.round(dist * 0.002 / people * 100) / 100,
      description: 'Most eco-friendly & affordable long distance option',
      isBest: () => true
    },
    carpool: {
      name: '🚗 Carpool',
      emoji: '🚗',
      cost: (dist, people) => calculateCarpoolCost(dist, people) * people,
      co2: (dist, people) => calculateCO2(dist, 'carpool', people),
      fuel: (dist, people) => Math.round(dist * 0.008 / people * 100) / 100,
      description: 'Shared ride reduces per-person impact',
      isBest: () => true
    },
    car: {
      name: '🚗 Personal Car',
      emoji: '🏎️',
      cost: (dist, people) => calculateCarCost(dist) * people,
      co2: (dist, people) => calculateCO2(dist, 'car', people),
      fuel: (dist, people) => Math.round(dist * 0.008 / people * 100) / 100,
      description: 'Highest emissions, not recommended',
      isBest: () => false
    }
  };

  // ===== GOOGLE MAPS INITIALIZATION =====
  let routeGoogleMap = null;  // Global map instance
  let directionsRenderer = null;  // Google Directions renderer
  let directionsService = null;  // Google Directions service
  
  /**
   * Decode Google's encoded polyline format
   */
  function decodePolyline(encoded) {
    if (!encoded) return [];
    const inv = 1.0 / 1e5;
    const decoded = [];
    let previous = [0, 0];
    let i = 0;
    
    while (i < encoded.length) {
      const ll = [0, 0];
      for (let j = 0; j < 2; j++) {
        let shift = 0;
        let result = 0;
        while (true) {
          const byte = encoded.charCodeAt(i) - 63;
          i++;
          result |= (byte & 0x1f) << shift;
          shift += 5;
          if (!(byte >= 0x20)) break;
        }
        if (result & 1) {
          ll[j] = previous[j] + ~(result >> 1);
        } else {
          ll[j] = previous[j] + (result >> 1);
        }
        previous[j] = ll[j];
      }
      decoded.push([ll[0] * inv, ll[1] * inv]);
    }
    return decoded;
  }
  
  /**
   * Initialize or update the Google Map with route polyline
   * @param {Object} routeData - Response from /predict-route endpoint
   */
  function displayRouteOnMap(routeData) {
    const { route_polyline, start_lat, start_lng, end_lat, end_lng, source, destination } = routeData;
    
    if (!start_lat || !start_lng || !end_lat || !end_lng) {
      console.warn('Missing coordinate data');
      return;
    }

    mapPreview.style.display = 'block';

    // Initialize map
    if (!routeGoogleMap) {
      routeGoogleMap = new google.maps.Map(document.getElementById('routeMap'), {
        zoom: 12,
        center: { lat: 20.5937, lng: 78.9629 },  // Center on India
        mapTypeId: 'roadmap',
        styles: [
          {
            elementType: 'geometry',
            stylers: [{ color: '#f5f5f5' }]
          },
          {
            elementType: 'labels.text.stroke',
            stylers: [{ color: '#ffffff' }]
          }
        ]
      });
      
      directionsService = new google.maps.DirectionsService();
      directionsRenderer = new google.maps.DirectionsRenderer({
        map: routeGoogleMap,
        suppressMarkers: false,
        polylineOptions: {
          color: '#2196F3',
          weight: 4,
          opacity: 0.8
        }
      });
    }

    // Request directions from Google
    const request = {
      origin: { lat: start_lat, lng: start_lng },
      destination: { lat: end_lat, lng: end_lng },
      travelMode: google.maps.TravelMode.DRIVING,
      drivingOptions: {
        departureTime: new Date(),
        trafficModel: google.maps.TrafficModel.BEST_GUESS
      }
    };

    directionsService.route(request, (response, status) => {
      if (status === google.maps.DirectionsStatus.OK) {
        directionsRenderer.setDirections(response);
        
        // Calculate bounds and center map
        const bounds = new google.maps.LatLngBounds();
        bounds.extend({ lat: start_lat, lng: start_lng });
        bounds.extend({ lat: end_lat, lng: end_lng });
        routeGoogleMap.fitBounds(bounds, 50);
      } else {
        console.error('Directions request failed:', status);
        
        // Fallback: show basic route using polyline
        if (route_polyline) {
          const decodedPath = decodePolyline(route_polyline);
          
          // Clear previous polyline
          if (window.fallbackPolyline) {
            window.fallbackPolyline.setMap(null);
          }
          
          window.fallbackPolyline = new google.maps.Polyline({
            path: decodedPath,
            geodesic: true,
            strokeColor: '#2196F3',
            strokeOpacity: 0.8,
            strokeWeight: 4,
            map: routeGoogleMap
          });
          
          // Add markers
          new google.maps.Marker({
            position: { lat: start_lat, lng: start_lng },
            map: routeGoogleMap,
            title: `Start: ${source}`,
            icon: 'http://maps.google.com/mapfiles/ms/icons/green-dot.png'
          });
          
          new google.maps.Marker({
            position: { lat: end_lat, lng: end_lng },
            map: routeGoogleMap,
            title: `Destination: ${destination}`,
            icon: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png'
          });
          
          // Fit bounds
          const bounds = new google.maps.LatLngBounds();
          bounds.extend({ lat: start_lat, lng: start_lng });
          bounds.extend({ lat: end_lat, lng: end_lng });
          routeGoogleMap.fitBounds(bounds, 50);
        }
      }
    });
  }

  // ===== CALCULATE ROUTE & SHOW RESULTS =====
  travelForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const source = sourceInput.value.trim();
    const destination = destInput.value.trim();
    const people = parseInt(peopleInput.value) || 1;
    const priority = selectedPriority;

    if (!source || !destination) {
      showToast('⚠️ Please enter source and destination');
      return;
    }

    showToast('🔄 Fetching real route data from Google Maps...');

    try {
      // Call backend API to get real routing data
      const response = await fetch('/predict-route', {
        method: 'POST',

        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source, destination, people, priority })
      });

      if (!response.ok) {
        let errorMsg = 'Route calculation failed';
        try {
          const error = await response.json();
          errorMsg = error.error || errorMsg;
        } catch (e) {
          // Response is not JSON (likely HTML error page)
          errorMsg = `Server error (${response.status}): ${response.statusText}`;
        }
        showToast(`❌ Error: ${errorMsg}`);
        return;
      }

      const apiData = await response.json();
      const distance = apiData.distance_km;

      // Display map with real route geometry (will be shown in displayRouteOnMap)
      displayRouteOnMap(apiData);

      // ===== CALCULATE RECOMMENDATIONS USING API DATA =====
      const recommendations = [];

      // Use backend-calculated costs and emissions (India-specific standards)
      // API returns: cost_inr[mode], co2_kg_per_person[mode], scores[mode]
      const backendCosts = apiData.cost_inr || {};
      const backendCO2 = apiData.co2_kg_per_person || {};
      const backendScores = apiData.scores || {};

      // Filter options based on real distance
      let availableOptions = ['walking', 'cycling', 'bus', 'train', 'carpool', 'car'];
      if (distance > 5) availableOptions = availableOptions.filter(o => o !== 'walking');
      if (distance > 15) availableOptions = availableOptions.filter(o => o !== 'cycling');
      if (distance < 30) availableOptions = availableOptions.filter(o => o !== 'train');

      // Build recommendations from backend data
      availableOptions.forEach(optionKey => {
        const opt = transportOptions[optionKey];
        
        // Use backend data if available, fallback to local calculation
        let cost = backendCosts[optionKey] !== undefined ? backendCosts[optionKey] : opt.cost(distance, people);
        let co2 = backendCO2[optionKey] !== undefined ? backendCO2[optionKey] : opt.co2(distance, people);
        
        // Get time from API if available
        let time;
        if (apiData.per_mode && apiData.per_mode[optionKey] && apiData.per_mode[optionKey].duration_min) {
          time = Math.round(apiData.per_mode[optionKey].duration_min);
        } else {
          // Fallback: use distance-based estimate
          const speeds = { walking: 5, cycling: 15, bus: 20, train: 30, carpool: 50, car: 60 };
          const speed = speeds[optionKey] || 30;
          time = Math.round((distance / speed) * 60);
        }

        // Get score from backend if available, otherwise calculate locally
        let score;
        let ecoScoreVal;
        
        if (backendScores[optionKey] !== undefined) {
          // Backend returns score already calculated (0-100)
          score = Math.round(backendScores[optionKey]);
          // For ecoScore display, we'll use a simplified version based on CO2
          ecoScoreVal = Math.max(0, Math.min(100, 100 - (co2 * 30)));
        } else {
          // Fallback: calculate locally using minimum-value normalization
          // Find min values across all available options
          const allCO2 = availableOptions.map(k => {
            const backendVal = backendCO2[k];
            return backendVal !== undefined ? backendVal : opt.co2(distance, people);
          }).filter(v => v > 0);
          
          const allCosts = availableOptions.map(k => {
            const backendVal = backendCosts[k];
            return backendVal !== undefined ? backendVal : opt.cost(distance, people);
          }).filter(v => v > 0);
          
          const allTimes = availableOptions.map(k => {
            if (apiData.per_mode && apiData.per_mode[k] && apiData.per_mode[k].duration_min) {
              return Math.round(apiData.per_mode[k].duration_min);
            } else {
              const speeds = { walking: 5, cycling: 15, bus: 20, train: 30, carpool: 50, car: 60 };
              const speed = speeds[k] || 30;
              return Math.round((distance / speed) * 60);
            }
          }).filter(v => v > 0);
          
          const minCO2 = Math.min(...allCO2) || 0.1;
          const minCost = Math.min(...allCosts) || 10;
          const minTime = Math.min(...allTimes) || 10;
          
          // Minimum-value normalization: score = 100 * (min / value)
          const ecoScore = co2 > 0 ? Math.min(100, (minCO2 / co2) * 100) : 100;
          const costScore = cost > 0 ? (minCost / cost) * 100 : 100;
          const timeScore = time > 0 ? (minTime / time) * 100 : 100;
          
          // Apply priority-based weighting
          let finalScore = 0;
          if (priority === 'eco') {
            finalScore = (0.5 * ecoScore) + (0.3 * costScore) + (0.2 * timeScore);
          } else if (priority === 'cost') {
            finalScore = (0.6 * costScore) + (0.25 * ecoScore) + (0.15 * timeScore);
          } else if (priority === 'time') {
            finalScore = (0.6 * timeScore) + (0.25 * ecoScore) + (0.15 * costScore);
          } else {
            finalScore = (0.5 * ecoScore) + (0.3 * costScore) + (0.2 * timeScore);
          }
          
          score = Math.round(Math.max(0, Math.min(100, finalScore)));
          ecoScoreVal = Math.round(ecoScore);
        }

        recommendations.push({
          key: optionKey,
          name: opt.name,
          emoji: opt.emoji,
          time,
          cost: Math.round(cost * 100) / 100,
          co2: Math.round(co2 * 100) / 100,
          fuel: opt.fuel(distance, people),
          description: opt.description,
          score,
          ecoScore: ecoScoreVal
        });
      });

      // Sort by score
      recommendations.sort((a, b) => b.score - a.score);

      // ===== DISPLAY RESULTS =====
      resultsGrid.innerHTML = '';
      recommendations.forEach((rec, idx) => {
        const card = document.createElement('div');
        card.className = 'result-card' + (idx === 0 ? ' selected' : '');
        card.setAttribute('data-key', rec.key);
        card.innerHTML = `
          <div class="emoji">${rec.emoji}</div>
          <h4>${rec.name}</h4>
          <div class="result-info">
            <span style="font-weight:bold;font-size:14px;">Score: ${rec.score}/100</span>
            <br>Eco: ${rec.ecoScore}/100
            <br>Time: ${rec.time} mins
            <br><small style="color:#6b7280;">⏱️ ${apiData.time_note}</small>
            <br>Cost: ₹${rec.cost}
            <br>CO₂: ${rec.co2} kg/person
            <br><small style="color:#6b7280;">📊 Estimated using Indian transport standards</small>
            <br><small style="color:#4b5563;margin-top:6px;display:block;">${apiData.score_explanation || 'Score based on your priority'}</small>
            <br><em>"${rec.description}"</em>
          </div>
        `;
        card.addEventListener('click', () => {
          document.querySelectorAll('.result-card').forEach(c => c.classList.remove('selected'));
          card.classList.add('selected');
          updateMetrics(rec, distance);
        });
        resultsGrid.appendChild(card);
      });

      // Select most eco-friendly option
      if (recommendations.length > 0) {
        const maxCo2 = Math.max(...recommendations.map(r => r.co2), 1);
        const maxFuel = Math.max(...recommendations.map(r => r.fuel), 1);

        const prefWeight = (currentUser.preferences && currentUser.preferences.ecoWeight !== undefined) ? parseInt(currentUser.preferences.ecoWeight, 10) : 60;
        const co2Weight = Math.max(0, Math.min(100, prefWeight)) / 100;
        const fuelWeight = 1 - co2Weight;

        let ecoBest = null;
        recommendations.forEach(r => {
          const normCo2 = r.co2 / maxCo2;
          const normFuel = r.fuel / maxFuel;
          r.ecoIndex = normCo2 * co2Weight + normFuel * fuelWeight;
          if (!ecoBest || r.ecoIndex < ecoBest.ecoIndex) ecoBest = r;
        });

        const ecoEl = document.getElementById('ecoSuggestion');
        if (ecoEl && ecoBest) {
          ecoEl.style.display = 'block';
          ecoEl.innerHTML = `
            <strong>Most Eco-Friendly:</strong> ${ecoBest.emoji} <strong>${ecoBest.name}</strong>
            — Estimated CO₂: ${ecoBest.co2} kg, Cost: ₹${ecoBest.cost}
          `;
        }

        const ecoCard = resultsGrid.querySelector(`.result-card[data-key="${ecoBest.key}"]`);
        if (ecoCard) ecoCard.classList.add('eco-best');

        renderBestRouteCard(ecoBest, apiData);

      // Render eco comparison chart
      try { renderEcoComparisonChart(recommendations); } catch (err) { console.warn('Chart render failed', err); }

      // Render comparison (eco vs cost vs time)
      renderMiniComparison(recommendations, source, destination, distance, people);

      // Leaflet map is already displayed above


      // Update eco impact summary
      updateEcoImpactSummary(ecoBest.co2, ecoBest.fuel);

      // Save trip to history
      addTripToHistory({ source, destination, distance, people, chosen: ecoBest.key, co2: ecoBest.co2, fuel: ecoBest.fuel, ts: Date.now() });

      // Suggest smart tips
      renderSmartSuggestions(recommendations, ecoBest);

      // Show alerts
      showAlertsForConditions(distance, ecoBest);

      // Award eco points based on ecoScore
      awardEcoPoints(Math.max(1, Math.round(ecoBest.ecoScore / 10)));
    }

    // Update metrics for best option
    updateMetrics(recommendations[0], distance);
    resultsSection.style.display = 'block';
    metricsSection.style.display = 'block';
    feedbackSection.style.display = 'block';
    
    // Hide empty state message
    const emptyStateMsg = document.getElementById('emptyStateMessage');
    if (emptyStateMsg) emptyStateMsg.style.display = 'none';

    showToast('✓ Routes calculated!');
    
    // Save journey to history
    const journey = {
      source: source,
      destination: destination,
      distance_km: distance,
      duration_min: recommendations[0]?.time || 0,
      transport_mode: recommendations[0]?.key || 'unknown',
      co2_saved: recommendations[0]?.co2 || 0,
      timestamp: Date.now()
    };
    
    // Save to localStorage
    let journeys = JSON.parse(localStorage.getItem('ecoroute_journeys') || '[]');
    journeys.unshift(journey);
    journeys = journeys.slice(0, 50); // Keep last 50
    localStorage.setItem('ecoroute_journeys', JSON.stringify(journeys));
    
    // Try to save to backend API
    try {
      await fetch(`/api/user/${currentUser.id || currentUser.email}/journey`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(journey)
      });
    } catch (e) {
      console.log('Journey saved to localStorage only');
    }
    
    // Refresh recent journeys display
    renderRecentJourneys();
    } catch (error) {
      console.error('Route calculation error:', error);
      showToast('❌ Failed to calculate routes: ' + error.message);
    }
  });

  // ===== UPDATE METRICS =====
  function updateMetrics(rec, distance) {
    document.getElementById('metricCO2').textContent = rec.co2 + ' kg';
    document.getElementById('metricFuel').textContent = rec.fuel + ' L';
    document.getElementById('metricCost').textContent = '₹' + rec.cost;
    document.getElementById('metricTime').innerHTML =
  rec.time + ' mins<br><small>' + TIME_NOTE + '</small>';
  }

  // ===== FEEDBACK =====
  document.querySelectorAll('.btn-feedback').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      document.querySelectorAll('.btn-feedback').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      const feedback = btn.dataset.feedback;
      showToast(`✓ Feedback saved: ${feedback}`);
      // In real app, send to backend
    });
  });

  // ===== TOAST NOTIFICATIONS =====
  function showToast(msg) {
    const toast = document.createElement('div');
    toast.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: var(--primary);
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      font-weight: 600;
      z-index: 1000;
      animation: slideIn 0.3s ease;
    `;
    toast.textContent = msg;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2500);
  }

  // Add style for animation
  if (!document.querySelector('style[data-toast]')) {
    const style = document.createElement('style');
    style.setAttribute('data-toast', 'true');
    style.textContent = `
      @keyframes slideIn {
        from { transform: translateX(400px); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
    `;
    document.head.appendChild(style);
  }

  // ===== HELPER functions =====
  
  // Recalculate previous journey
  function recalculateJourney(journeyId) {
    try {
      const journeys = JSON.parse(localStorage.getItem('ecoroute_journeys') || '[]');
      const journey = journeys.find(j => j.id === journeyId);
      if (journey) {
        sourceInput.value = journey.source;
        destInput.value = journey.destination;
        peopleInput.value = journey.people || 1;
        // Scroll to form and submit
        document.querySelector('.travel-form').scrollIntoView({ behavior: 'smooth' });
        setTimeout(() => travelForm.dispatchEvent(new Event('submit')), 300);
      }
    } catch (error) {
      console.error('Error recalculating journey:', error);
      showToast('Error loading journey', 'error');
    }
  }
  
  // Add these to global scope
  window.recalculateJourney = recalculateJourney;
  window.displayRouteOnMap = displayRouteOnMap;

  function renderBestRouteCard(rec, apiData) {
    if (!bestRouteCard) return;
    bestRouteCard.style.display = 'block';
    bestRouteCard.className = 'best-route';
    
    const costDisplay = apiData && apiData.cost_inr && apiData.cost_inr[rec.key] 
      ? `₹${apiData.cost_inr[rec.key]}` 
      : `₹${rec.cost}`;
    
    const timeNote = apiData && apiData.time_note 
      ? apiData.time_note 
      : TIME_NOTE;
    
    bestRouteCard.innerHTML = `
      <div class="icon">${rec.emoji}</div>
      <div>
        <div style="font-weight:800; font-size:16px;">${rec.name}</div>
        <div style="font-size:13px; color:var(--text-muted);">
  Time: ${rec.time} mins (${timeNote}) • CO₂: ${rec.co2} kg • Cost: ${costDisplay}
</div>

      <div style="margin-left:auto; text-align:right;">
        <div style="font-weight:900; font-size:18px;">Eco ${rec.ecoScore}/100</div>
        <div style="font-size:12px; color:var(--text-muted);">Score ${rec.score}/100</div>
      </div>
    `;
  }

  function renderMiniComparison(recommendations, source, destination, distance, people) {
    if (!miniComparison) return;
    miniComparison.style.display = 'flex';
    miniComparison.innerHTML = '';
    const priorities = ['eco', 'cost', 'time'];
    priorities.forEach(p => {
      // compute best for this priority
      let best = null;
      recommendations.forEach(r => {
        // reconstruct finalScore for priority p
        let ecoScore = r.ecoScore;
        let costScore = Math.max(0, 100 - (r.cost * 2));
        let timeScore = Math.max(0, 100 - (r.time / 2));
        let finalScore = 0;
        if (p === 'eco') finalScore = ecoScore * 0.5 + costScore * 0.3 + timeScore * 0.2;
        if (p === 'cost') finalScore = costScore * 0.5 + ecoScore * 0.3 + timeScore * 0.2;
        if (p === 'time') finalScore = timeScore * 0.5 + ecoScore * 0.3 + costScore * 0.2;
        if (!best || finalScore > best.finalScore) best = { finalScore, name: r.name, emoji: r.emoji, score: Math.round(finalScore) };
      });
      const card = document.createElement('div');
      card.className = 'mini-compare';
      card.innerHTML = `<div class="label">${p === 'eco' ? 'Eco-Friendly' : p === 'cost' ? 'Low Cost' : 'Fastest'}</div><div class="value">${best.emoji} ${best.name}<div style="font-size:12px;color:var(--text-muted);">Score ${best.score}</div></div>`;
      miniComparison.appendChild(card);
    });
  }

  function formatDate(ts) { return new Date(ts).toLocaleString(); }

  async function addTripToHistory(entry) {
    try {
      const response = await fetch(`/api/user/${currentUser.id}/journey`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: entry.source,
          destination: entry.destination,
          distance_km: entry.distance,
          duration_min: entry.duration,
          people: entry.people,
          chosen_mode: entry.mode,
          co2_kg_per_person: entry.co2PerPerson,
          total_cost_inr: entry.cost,
          fuel_liters: entry.fuel || 0,
          route_geometry: entry.geometry || null
        })
      });
      
      if (response.ok) {
        renderRecentJourneys();
      }
    } catch (error) {
      console.error('Error saving journey:', error);
    }
  }

  async function renderRecentJourneys() {
    if (!recentJourneysEl) return;
    
    try {
      let journeys = [];
      
      // Try fetching from API first
      try {
        const response = await fetch(`/api/user/${currentUser.id || currentUser.email}/journeys`);
        if (response.ok) {
          const data = await response.json();
          journeys = data.journeys || [];
        }
      } catch (e) {
        console.log('API journeys fetch failed, using localStorage');
      }
      
      // If API returned nothing, use localStorage
      if (journeys.length === 0) {
        journeys = JSON.parse(localStorage.getItem('ecoroute_journeys') || '[]');
      }
      
      recentJourneysEl.innerHTML = '';
      
      if (journeys.length === 0) {
        recentJourneysEl.innerHTML = '<div style="color:var(--text-muted); padding: 20px; text-align: center;">No journeys yet. Plan your first eco-friendly route!</div>';
        return;
      }
      
      journeys.slice(0, 10).forEach((journey) => {
        const div = document.createElement('div');
        div.className = 'recent-item';
        const journeyId = journey.id || 'temp-' + Math.random();
        const timestamp = journey.timestamp ? new Date(journey.timestamp).toLocaleString() : 'Unknown';
        div.innerHTML = `
          <div>
            <strong>${journey.source}</strong> → <strong>${journey.destination}</strong>
            <div style="font-size:12px;color:var(--text-muted);">
              ${journey.distance_km?.toFixed(1) || '?'} km • ${timestamp}
            </div>
          </div>
          <div>
            <button class="btn-recalc" onclick="recalculateJourney('${journeyId}')">Recalculate</button>
          </div>
        `;
        recentJourneysEl.appendChild(div);
      });
    } catch (error) {
      console.error('Error loading journeys:', error);
      recentJourneysEl.innerHTML = '<div style="color:var(--text-muted);">Error loading journeys</div>';
    }
  }

  function updateEcoImpactSummary(co2, fuel) {
    if (!ecoImpactSummary) return;
    const trees = Math.max(0, (co2 / 21)).toFixed(1); // rough conversion
    ecoImpactSummary.style.display = 'block';
    ecoImpactSummary.innerHTML = `<div style="font-weight:800;">🌱 Your Eco Impact</div><div style="font-size:14px;">CO₂ saved this trip: ${co2} kg<br>Fuel saved: ${fuel} L<br>Trees equivalent: 🌳 ${trees}</div>`;
  }

  function renderSmartSuggestions(recommendations, ecoBest) {
    if (!smartSuggestionsEl) return;
    smartSuggestionsEl.innerHTML = '';
    const suggestions = [];
    if (ecoBest.key === 'car' || ecoBest.key === 'carpool') suggestions.push('💡 Try carpool today to save more CO₂');
    if (recommendations.some(r => r.key === 'train')) suggestions.push('💡 Public transport (train) is efficient for this route');
    if (recommendations.some(r => r.key === 'walking' && r.ecoScore > 80)) suggestions.push('💡 Walking is great for short distances — good for health');
    if (suggestions.length === 0) suggestions.push('💡 Try combining modes (e.g., walk + train) for better eco scores');
    suggestions.forEach(s => {
      const d = document.createElement('div'); d.className = 'suggestion'; d.textContent = s; smartSuggestionsEl.appendChild(d);
    });
  }

  function showAlertsForConditions(distance, recBest) {
    if (!alertsEl) return;
    alertsEl.innerHTML = '';
    const alerts = [];
    if (distance > 30) alerts.push('⚠️ Heavy traffic likely on long routes — consider public transport');
    if (recBest && recBest.key === 'walking' && distance > (currentUser.preferences?.walkLimit || 5)) alerts.push('⚠️ Distance exceeds your walking limit — consider alternate transport');
    alerts.forEach(a => { const n = document.createElement('div'); n.className = 'alerts'; n.textContent = a; alertsEl.appendChild(n); });
  }

  async function awardEcoPoints(points) {
    try {
      const response = await fetch(`/api/user/${currentUser.id}/eco-points/award`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ points: points })
      });
      
      if (response.ok) {
        const data = await response.json();
        if (ecoPointsEl) ecoPointsEl.textContent = `🌱 ${data.points} pts`;
      }
    } catch (error) {
      console.error('Error awarding points:', error);
    }
  }

  function renderEcoComparisonChart(recommendations) {
    if (!ecoComparisonChartEl || !window.Chart) return;
    
    const labels = recommendations.map(r => r.name.replace('🚗 ', '').replace('🚌 ', '').replace('🚇 ', '').replace('🚶 ', '').replace('🚴 ', ''));
    const co2Data = recommendations.map(r => r.co2);
    const fuelData = recommendations.map(r => r.fuel * 10); // scale fuel for visibility (x10)
    
    const ctx = ecoComparisonChartEl.getContext('2d');
    if (ecoComparisonChart) {
      ecoComparisonChart.destroy();
    }
    
    ecoComparisonChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'CO₂ (kg)',
            data: co2Data,
            backgroundColor: 'rgba(47, 125, 79, 0.8)',
            borderColor: 'rgba(27, 79, 58, 1)',
            borderWidth: 1
          },
          {
            label: 'Fuel (L × 10)',
            data: fuelData,
            backgroundColor: 'rgba(118, 200, 147, 0.6)',
            borderColor: 'rgba(47, 125, 79, 1)',
            borderWidth: 1
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: { position: 'top', labels: { font: { size: 12 }, padding: 12 } }
        },
        scales: {
          y: { beginAtZero: true, ticks: { font: { size: 11 } } },
          x: { ticks: { font: { size: 11 } } }
        }
      }
    });
    
    if (chartContainer) chartContainer.style.display = 'block';
  }
});
