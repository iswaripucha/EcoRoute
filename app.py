import os
import json
import glob
import time
import requests
from flask import Flask, request, jsonify, redirect, session, render_template, url_for
from flask_cors import CORS
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

from ml_model import predict_scores, choose_best_option



BASE_DIR = os.path.dirname(__file__)
STATIC_DIR = os.path.join(BASE_DIR, 'static')
TEMPLATES_DIR = os.path.join(BASE_DIR, 'templates')

# Serve static files from ./static and templates from ./templates
app = Flask(__name__, static_folder=STATIC_DIR, static_url_path='/static', template_folder=TEMPLATES_DIR)
CORS(app)
app.secret_key = os.environ.get('SECRET_KEY', 'dev_secret')


GOOGLE_MAPS_API_KEY = os.environ.get('GOOGLE_MAPS_API_KEY')


def google_directions(source, destination):
    """
    Get directions and traffic data from Google Directions API.
    
    Returns:
        tuple: (distance_m, duration_s, traffic_duration_s, polyline, start_lat, start_lng, end_lat, end_lng)
               or (None, None, None, None, None, None, None, None) on error
    """
    if not GOOGLE_MAPS_API_KEY:
        print("Error: GOOGLE_MAPS_API_KEY not set")
        return None, None, None, None, None, None, None, None
    
    url = 'https://maps.googleapis.com/maps/api/directions/json'
    params = {
        'origin': source,
        'destination': destination,
        'mode': 'driving',
        'key': GOOGLE_MAPS_API_KEY,
        'departure_time': 'now',  # For traffic-aware duration
        'traffic_model': 'best_guess'  # India traffic model
    }
    
    try:
        r = requests.get(url, params=params, timeout=10)
        r.raise_for_status()
        data = r.json()
        
        if data.get('status') != 'OK':
            error_msg = data.get('error_message', 'Unknown error')
            print(f"Google Directions API error: {error_msg}")
            return None, None, None, None, None, None, None, None
        
        routes = data.get('routes', [])
        if not routes:
            print("No routes found")
            return None, None, None, None, None, None, None, None
        
        route = routes[0]
        legs = route.get('legs', [])
        if not legs:
            return None, None, None, None, None, None, None, None
        
        leg = legs[0]
        
        # Extract metrics
        distance_m = leg.get('distance', {}).get('value')  # meters
        duration_s = leg.get('duration', {}).get('value')  # seconds
        traffic_duration_s = leg.get('duration_in_traffic', {}).get('value')  # seconds (includes traffic)
        
        # Extract polyline (encoded)
        overview_polyline = route.get('overview_polyline', {}).get('points', '')
        
        # Extract coordinates
        start_location = leg.get('start_location', {})
        end_location = leg.get('end_location', {})
        start_lat = start_location.get('lat')
        start_lng = start_location.get('lng')
        end_lat = end_location.get('lat')
        end_lng = end_location.get('lng')
        
        return distance_m, duration_s, traffic_duration_s, overview_polyline, start_lat, start_lng, end_lat, end_lng
    except Exception as e:
        print(f"Google Directions API error: {e}")
        return None, None, None, None, None, None, None, None


def decode_polyline(encoded_polyline):
    """
    Decode Google's encoded polyline format to list of [lat, lng] coordinates.
    """
    if not encoded_polyline:
        return []
    
    try:
        inv = 1.0 / 1e5
        decoded = []
        previous = [0, 0]
        i = 0
        
        while i < len(encoded_polyline):
            ll = [0, 0]
            for j in [0, 1]:
                shift = 0
                result = 0
                while True:
                    byte = ord(encoded_polyline[i]) - 63
                    i += 1
                    result |= (byte & 0x1f) << shift
                    shift += 5
                    if not (byte >= 0x20):
                        break
                if result & 1:
                    ll[j] = previous[j] + ~(result >> 1)
                else:
                    ll[j] = previous[j] + (result >> 1)
                previous[j] = ll[j]
            decoded.append([ll[0] * inv, ll[1] * inv])
        
        return decoded
    except Exception as e:
        print(f"Polyline decode error: {e}")
        return []


# ===== INDIA-SPECIFIC TRANSPORT COST & EMISSION LOGIC =====

def calculate_train_cost(distance_km):
    """
    Calculate local train fare based on distance slabs (Mumbai Suburban Logic).
    Returns: fare in INR for single journey per person
    """
    if distance_km <= 10:
        return 5
    elif distance_km <= 15:
        return 10
    elif distance_km <= 30:
        return 15
    elif distance_km <= 45:
        return 20
    elif distance_km <= 60:
        return 25
    else:
        return 30


def calculate_bus_cost(distance_km):
    """
    Calculate bus fare using India city transport approximation.
    Formula: cost = distance_km * 1.2
    With min = ₹10, max = ₹50
    Returns: fare in INR per person
    """
    cost = distance_km * 1.2
    cost = max(10, min(50, cost))  # Clamp between ₹10 and ₹50
    return round(cost, 2)


def calculate_car_cost(distance_km):
    """
    Calculate car cost based on fuel consumption.
    Fuel formula: distance_km / mileage * petrol_price
    Uses: mileage = 15 km/l, petrol = ₹105/litre
    Returns: fuel cost in INR per person
    """
    mileage = 15  # km per liter
    petrol_price = 105  # ₹ per liter
    fuel_used = distance_km / mileage
    cost = fuel_used * petrol_price
    return round(cost, 2)


def calculate_carpool_cost(distance_km, people):
    """
    Calculate carpool cost (shared car cost per person).
    Uses same base as car cost, divided by number of people.
    Returns: cost in INR per person
    """
    if people < 1:
        people = 1
    car_cost = calculate_car_cost(distance_km)
    cost_per_person = car_cost / people
    return round(cost_per_person, 2)


def calculate_co2_emissions(distance_km, mode, people=1):
    """
    Calculate CO₂ emissions in kg per person using India standards.
    Emission factors (g CO₂/km):
    - Train: 25 g/km
    - Bus: 68 g/km
    - Car: 120 g/km
    - Carpool: 120 g/km (per person)
    - Walking/Cycling: 0 g/km
    Returns: CO₂ in kg per person
    """
    emission_factors = {
        'train': 25,
        'bus': 68,
        'car': 120,
        'carpool': 120,
        'walking': 0,
        'cycling': 0,
        'bike': 0
    }
    
    factor = emission_factors.get(mode, 0)
    
    if mode == 'carpool' and people > 1:
        # Divide by number of people for carpool
        total_grams = (distance_km * factor) / people
    else:
        total_grams = distance_km * factor
    
    # Convert grams to kg
    return round(total_grams / 1000, 3)


def calculate_normalized_scores(distance_km, people, traffic_duration_min, priority='eco'):
    """
    Calculate normalized scores (0-100) for all transport modes using minimum-value normalization.
    
    Uses minimum-value normalization: normalizedScore = 100 * (minimumValue / optionValue)
    
    Components:
    - ecoScore: based on CO₂ emissions (lower is better)
    - costScore: based on travel cost (lower is better)
    - timeScore: based on travel time (lower is better)
    
    Priority-based weighting:
    - ECO: 50% CO₂ + 30% cost + 20% time
    - COST: 60% cost + 25% CO₂ + 15% time
    - TIME: 60% time + 25% CO₂ + 15% cost
    
    Args:
        distance_km: Distance in kilometers
        people: Number of people
        traffic_duration_min: Travel time in minutes
        priority: 'eco', 'cost', or 'time'
    
    Returns:
        dict with scores for each transport mode (0-100 scale)
    """
    modes = ['walking', 'cycling', 'bus', 'train', 'carpool', 'car']
    
    # Collect all metrics for normalization
    all_co2 = {}
    all_costs = {}
    all_times = {}
    
    for mode in modes:
        # Skip non-applicable modes
        if mode == 'walking' and distance_km > 5:
            all_co2[mode] = float('inf')
            all_costs[mode] = float('inf')
            all_times[mode] = float('inf')
            continue
        if mode == 'cycling' and distance_km > 15:
            all_co2[mode] = float('inf')
            all_costs[mode] = float('inf')
            all_times[mode] = float('inf')
            continue
        if mode == 'train' and distance_km < 30:
            all_co2[mode] = float('inf')
            all_costs[mode] = float('inf')
            all_times[mode] = float('inf')
            continue
        
        # Calculate metrics for this mode
        if mode in ['walking', 'cycling']:
            co2_val = 0.0
            cost_val = 0.0
            time_val = traffic_duration_min * 0.8 if mode == 'cycling' else traffic_duration_min  # Slower for walking
        elif mode == 'train':
            co2_val = calculate_co2_emissions(distance_km, mode, people)
            cost_val = calculate_train_cost(distance_km) * people
            time_val = traffic_duration_min * 0.75  # Trains typically faster
        elif mode == 'bus':
            co2_val = calculate_co2_emissions(distance_km, mode, people)
            cost_val = calculate_bus_cost(distance_km) * people
            time_val = traffic_duration_min * 1.2  # Buses slower due to stops
        elif mode == 'carpool':
            co2_val = calculate_co2_emissions(distance_km, mode, people)
            cost_val = calculate_carpool_cost(distance_km, people) * people
            time_val = traffic_duration_min
        elif mode == 'car':
            co2_val = calculate_co2_emissions(distance_km, mode, people)
            cost_val = calculate_car_cost(distance_km) * people
            time_val = traffic_duration_min
        
        all_co2[mode] = co2_val
        all_costs[mode] = cost_val
        all_times[mode] = time_val
    
    # Find minimum values (only from applicable modes)
    applicable_co2 = [v for v in all_co2.values() if v != float('inf')]
    applicable_costs = [v for v in all_costs.values() if v != float('inf')]
    applicable_times = [v for v in all_times.values() if v != float('inf')]
    
    min_co2 = min(applicable_co2) if applicable_co2 else 0.1
    min_cost = min(applicable_costs) if applicable_costs else 10
    min_time = min(applicable_times) if applicable_times else 10
    
    # Avoid division by zero
    if min_co2 == 0:
        min_co2 = 0.1
    if min_cost == 0:
        min_cost = 10
    if min_time == 0:
        min_time = 10
    
    scores = {}
    
    for mode in modes:
        # Skip non-applicable modes
        if all_co2[mode] == float('inf'):
            scores[mode] = 0.0
            continue
        
        # Normalize using minimum-value normalization: score = 100 * (min / value)
        if all_co2[mode] > 0:
            eco_score = min(100, (min_co2 / all_co2[mode]) * 100)
        else:
            eco_score = 100.0  # Perfect score for zero emissions (walking/cycling)
        
        cost_score = (min_cost / all_costs[mode]) * 100 if all_costs[mode] > 0 else 100
        time_score = (min_time / all_times[mode]) * 100 if all_times[mode] > 0 else 100
        
        # Clamp individual scores
        eco_score = max(0, min(100, eco_score))
        cost_score = max(0, min(100, cost_score))
        time_score = max(0, min(100, time_score))
        
        # Apply priority-based weighting
        if priority == 'eco':
            final_score = (0.5 * eco_score) + (0.3 * cost_score) + (0.2 * time_score)
        elif priority == 'cost':
            final_score = (0.6 * cost_score) + (0.25 * eco_score) + (0.15 * time_score)
        elif priority == 'time':
            final_score = (0.6 * time_score) + (0.25 * eco_score) + (0.15 * cost_score)
        else:
            final_score = (0.5 * eco_score) + (0.3 * cost_score) + (0.2 * time_score)
        
        # Clamp final score and round
        final_score = max(0, min(100, final_score))
        scores[mode] = round(final_score, 0)
    
    return scores


def get_distance_time(source, destination):
    """
    Return real distance, duration, traffic duration, and route geometry using Google Directions API.
    
    Returns:
        dict with keys:
        - distance_km: float
        - duration_min: float
        - traffic_duration_min: float (India traffic-aware)
        - route_polyline: encoded polyline
        - start_lat, start_lng, end_lat, end_lng: coordinates
        - per_mode: dict (empty for Google API since it only does one mode)
    """
    result = {
        'distance_km': 100.0,  # fallback
        'duration_min': 120.0,
        'traffic_duration_min': 120.0,
        'route_polyline': '',
        'start_lat': 20.5937,
        'start_lng': 78.9629,
        'end_lat': 20.5937,
        'end_lng': 78.9629,
        'per_mode': {}
    }
    
    if not GOOGLE_MAPS_API_KEY:
        print("Error: GOOGLE_MAPS_API_KEY not set")
        return result
    
    # Call Google Directions API
    distance_m, duration_s, traffic_duration_s, polyline, start_lat, start_lng, end_lat, end_lng = google_directions(source, destination)
    
    if distance_m is None or duration_s is None:
        print(f"Google Directions failed: source={source}, destination={destination}")
        return result
    
    # Convert to km and minutes
    distance_km = distance_m / 1000.0
    duration_min = duration_s / 60.0
    traffic_duration_min = (traffic_duration_s / 60.0) if traffic_duration_s else duration_min
    
    result['distance_km'] = round(distance_km, 3)
    result['duration_min'] = round(duration_min, 2)
    result['traffic_duration_min'] = round(traffic_duration_min, 2)
    result['route_polyline'] = polyline
    result['start_lat'] = start_lat
    result['start_lng'] = start_lng
    result['end_lat'] = end_lat
    result['end_lng'] = end_lng
    
    # For per_mode: Google Directions only returns driving, so store it under all applicable modes
    mode_data = {
        'distance_km': result['distance_km'],
        'duration_min': result['traffic_duration_min']  # Use traffic-aware for best estimate
    }
    result['per_mode']['car'] = mode_data.copy()
    result['per_mode']['bus'] = mode_data.copy()
    result['per_mode']['carpool'] = mode_data.copy()
    
    return result


@app.route('/predict-route', methods=['POST'])
def predict_route():
    """
    Main API endpoint for route prediction.
    
    Accepts JSON with:
    - source: string (city/place name in India)
    - destination: string
    - people: int (number of passengers)
    
    Returns JSON with:
    - distance_km, duration_min, traffic_duration_min (real road data from Google Directions API)
    - route polyline (encoded)
    - CO2 emissions per transport mode
    - costs in INR
    - best recommended option
    """
    try:
        data = request.get_json(force=True)
        source = data.get('source')
        destination = data.get('destination')
        people = int(data.get('people', 1))

        if not source or not destination:
            return jsonify({'error': 'source and destination are required'}), 400
        if people < 1:
            return jsonify({'error': 'people must be >= 1'}), 400

        # Get real routing data from Google Directions API
        routing_data = get_distance_time(source, destination)
        distance_km = routing_data['distance_km']
        duration_min = routing_data['duration_min']
        traffic_duration_min = routing_data['traffic_duration_min']
        polyline = routing_data['route_polyline']
        start_lat = routing_data['start_lat']
        start_lng = routing_data['start_lng']
        end_lat = routing_data['end_lat']
        end_lng = routing_data['end_lng']
        per_mode = routing_data['per_mode']

        # Predict eco scores using ML model
        scores = predict_scores(distance_km, people)
        best = choose_best_option(scores)

        # ===== INDIA-SPECIFIC COST & EMISSIONS CALCULATION =====
        
        # Get priority from user (default: eco)
        priority = data.get('priority', 'eco').lower()
        if priority not in ['eco', 'cost', 'time']:
            priority = 'eco'
        
        # Calculate metrics for each transport mode
        co2 = {}
        costs = {}
        
        # Define transport modes
        modes = ['walking', 'cycling', 'bus', 'train', 'carpool', 'car']
        
        for mode in modes:
            # Skip non-applicable modes
            if mode == 'walking' and distance_km > 5:
                co2[mode] = 0.0
                costs[mode] = 0.0
                continue
            if mode == 'cycling' and distance_km > 15:
                co2[mode] = 0.0
                costs[mode] = 0.0
                continue
            if mode == 'train' and distance_km < 30:
                # Train not practical for short distances
                co2[mode] = 0.0
                costs[mode] = 0.0
                continue
            
            # Calculate CO₂ emissions
            if mode in ['walking', 'cycling']:
                co2[mode] = 0.0
                costs[mode] = 0.0
            elif mode == 'train':
                co2[mode] = calculate_co2_emissions(distance_km, mode, people)
                costs[mode] = calculate_train_cost(distance_km) * people
            elif mode == 'bus':
                co2[mode] = calculate_co2_emissions(distance_km, mode, people)
                costs[mode] = calculate_bus_cost(distance_km) * people
            elif mode == 'carpool':
                co2[mode] = calculate_co2_emissions(distance_km, mode, people)
                costs[mode] = calculate_carpool_cost(distance_km, people) * people
            elif mode == 'car':
                co2[mode] = calculate_co2_emissions(distance_km, mode, people)
                costs[mode] = calculate_car_cost(distance_km) * people
        
        # Calculate priority-aware scores using minimum-value normalization
        eco_scores = calculate_normalized_scores(distance_km, people, traffic_duration_min, priority)

        # Compute percent saved vs car
        car_co2 = co2.get('car', 1e-6)
        best_mode = None
        best_score = -1
        for mode in modes:
            if eco_scores.get(mode, 0) > best_score:
                best_score = eco_scores.get(mode, 0)
                best_mode = mode
        
        best_co2 = co2.get(best_mode, car_co2) if best_mode else car_co2
        saved_pct = round((1 - (best_co2 / car_co2)) * 100, 1) if car_co2 > 0 else 0.0
        
        # Build response with real routing data and encoded polyline
        result = {
            'source': source,
            'destination': destination,
            'distance_km': round(distance_km, 2),
            'duration_min': round(duration_min, 1),
            'traffic_duration_min': round(traffic_duration_min, 1),
            'time_note': 'Real-time traffic data from Google Maps (Estimated costs using Indian transport standards)',
            'people': people,
            'best_option': best_mode or 'walking',
            'eco_score': eco_scores.get(best_mode or 'walking', 0),
            'scores': eco_scores,
            'co2_kg_per_person': co2,
            'cost_inr': costs,
            'co2_saved_pct_vs_car': saved_pct,
            'per_mode': per_mode,
            'priority': priority,
            'score_explanation': 'Score is calculated using CO₂ emissions, travel time, and cost based on your selected priority.',
            'reason': 'Lower emission per person' if (best_mode != 'car' and best_mode) else 'Car is best for this query',
            # Add route polyline for map display
            'route_polyline': polyline,  # Encoded polyline from Google
            'start_lat': start_lat,
            'start_lng': start_lng,
            'end_lat': end_lat,
            'end_lng': end_lng
        }
        return jsonify(result)
    except Exception as e:
        import traceback
        print(f"Error in predict_route: {e}")
        traceback.print_exc()
        return jsonify({'error': f'Route prediction failed: {str(e)}'}), 500


@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok'})


@app.route('/')
def index():
    return render_template('index.html')


@app.route('/login')
def login():
    return render_template('login.html')


@app.route('/signup')
def signup():
    return render_template('signup.html')


@app.route('/entry')
def entry():
    return render_template('entry.html')


@app.route('/account-setup')
def account_setup():
    return render_template('account-setup.html')


@app.route('/email-verify')
def email_verify():
    return render_template('email-verify.html')


@app.route('/profile')
def profile():
    return render_template('profile.html')


@app.route('/dashboard')
def dashboard():
    # Render the dashboard template and pass any OAuth user stored in session
    user = session.pop('oauth_user', None)
    return render_template('dashboard.html', 
                         oauth_user=user,
                         GOOGLE_MAPS_API_KEY=GOOGLE_MAPS_API_KEY)


@app.route('/api/session')
def api_session():
    """Check if user is logged in and return user data."""
    user_data = session.get('oauth_user')
    if not user_data:
        return jsonify({'error': 'Not logged in'}), 401
    
    return jsonify({
        'user': {
            'id': user_data.get('email'),  # Use email as unique ID
            'name': user_data.get('name'),
            'email': user_data.get('email'),
            'picture': user_data.get('picture'),
            'profile_completed': True,  # OAuth users skip profile for now
            'preferences': {}
        }
    })


@app.route('/api/logout', methods=['POST'])
def api_logout():
    """Clear user session."""
    session.clear()
    return jsonify({'status': 'logged out'})


@app.route('/api/user/<user_id>/preferences', methods=['GET', 'POST'])
def user_preferences(user_id):
    """Get or update user preferences."""
    if request.method == 'POST':
        data = request.get_json() or {}
        # Store preferences in session for now (not persistent)
        prefs = {
            'priority': data.get('priority', 'eco'),
            'budget': data.get('budget', ''),
            'transport_preference': data.get('transport_preference', ''),
            'notifications_enabled': data.get('notifications_enabled', True),
            'walking_distance_limit': data.get('walking_distance_limit', 5)
        }
        session['user_preferences'] = prefs
        return jsonify({'status': 'saved', 'preferences': prefs})
    
    # GET request - return stored preferences or defaults
    prefs = session.get('user_preferences', {
        'priority': 'eco',
        'budget': '',
        'transport_preference': '',
        'notifications_enabled': True,
        'walking_distance_limit': 5
    })
    return jsonify(prefs)


@app.route('/api/user/<user_id>/journeys', methods=['GET'])
def user_journeys(user_id):
    """Get user's recent journeys."""
    # Return journeys from session or empty list
    journeys = session.get('journeys', [])
    return jsonify({'journeys': journeys})


@app.route('/api/user/<user_id>/journey', methods=['POST'])
def add_user_journey(user_id):
    """Add a new journey to user's history."""
    data = request.get_json() or {}
    journey_id = 'journey-' + str(time.time())
    
    # Add to session journeys list
    journeys = session.get('journeys', [])
    journey_data = {
        'id': journey_id,
        'source': data.get('source'),
        'destination': data.get('destination'),
        'distance_km': data.get('distance_km'),
        'transport_mode': data.get('transport_mode'),
        'timestamp': time.time(),
        'co2_saved': data.get('co2_saved', 0),
        'duration_min': data.get('duration_min', 0)
    }
    journeys.insert(0, journey_data)  # Add to beginning (most recent first)
    journeys = journeys[:50]  # Keep last 50 journeys
    session['journeys'] = journeys
    
    return jsonify({'status': 'saved', 'journey_id': journey_id})


@app.route('/api/user/<user_id>/eco-points/award', methods=['POST'])
def award_eco_points(user_id):
    """Award eco points to user."""
    data = request.get_json() or {}
    points = data.get('points', 0)
    # In a real app, this would update database
    current_points = session.get('user_points', 0)
    session['user_points'] = current_points + points
    return jsonify({'status': 'awarded', 'points': session['user_points']})


# --- Google OAuth 2.0 routes (minimal server-side flow) ---
def _load_client_config():
    # find client_secret_*.json in workspace root (two levels up)
    base = os.path.dirname(__file__)
    candidates = glob.glob(os.path.join(base, '..', '..', 'client_secret_*.json'))
    if not candidates:
        return None
    try:
        with open(candidates[0], 'r', encoding='utf-8') as fh:
            cfg = json.load(fh)
        # support both "web" and top-level
        return cfg.get('web') or cfg
    except Exception:
        return None


def _get_oauth_config():
    """Return oauth config preferring environment variables, fall back to client_secret json."""
    # prefer env vars
    client_id = os.environ.get('GOOGLE_CLIENT_ID')
    client_secret = os.environ.get('GOOGLE_CLIENT_SECRET')
    redirect_uri = os.environ.get('GOOGLE_REDIRECT_URI')
    auth_uri = os.environ.get('GOOGLE_AUTH_URI')
    token_uri = os.environ.get('GOOGLE_TOKEN_URI')

    if client_id and client_secret:
        conf = {
            'client_id': client_id,
            'client_secret': client_secret,
            'redirect_uris': [redirect_uri] if redirect_uri else [],
            'auth_uri': auth_uri or 'https://accounts.google.com/o/oauth2/auth',
            'token_uri': token_uri or 'https://oauth2.googleapis.com/token'
        }
        return conf

    # fallback to JSON file
    return _load_client_config()


@app.route('/login/google')
def login_google():
    cfg = _get_oauth_config()
    if not cfg or not cfg.get('client_id'):
        return "Google client configuration not found on server", 500
    client_id = cfg.get('client_id')
    auth_uri = cfg.get('auth_uri', 'https://accounts.google.com/o/oauth2/auth')
    redirect_uri = None
    if cfg.get('redirect_uris'):
        try:
            redirect_uri = cfg.get('redirect_uris')[0]
        except Exception:
            redirect_uri = cfg.get('redirect_uris')
    if not redirect_uri:
        redirect_uri = os.environ.get('GOOGLE_REDIRECT_URI', 'http://127.0.0.1:5000/login/google/callback')
    scope = 'openid email profile'
    params = {
        'response_type': 'code',
        'client_id': client_id,
        'redirect_uri': redirect_uri,
        'scope': scope,
        'access_type': 'offline',
        'prompt': 'select_account'
    }
    # Build URL
    from urllib.parse import urlencode
    url = auth_uri + '?' + urlencode(params)
    return redirect(url)


@app.route('/login/google/callback')
def login_google_callback():
    # Exchange code for tokens and validate id_token
    code = request.args.get('code')
    if not code:
        err = request.args.get('error') or 'missing_code'
        return f'Google OAuth failed: {err}', 400

    cfg = _get_oauth_config()
    if not cfg or not cfg.get('client_id'):
        return "Google client configuration not found on server", 500

    token_uri = cfg.get('token_uri', 'https://oauth2.googleapis.com/token')
    client_id = cfg.get('client_id')
    client_secret = cfg.get('client_secret')
    redirect_uri = None
    if cfg.get('redirect_uris'):
        try:
            redirect_uri = cfg.get('redirect_uris')[0]
        except Exception:
            redirect_uri = cfg.get('redirect_uris')
    if not redirect_uri:
        redirect_uri = os.environ.get('GOOGLE_REDIRECT_URI', 'http://127.0.0.1:5000/login/google/callback')

    data = {
        'code': code,
        'client_id': client_id,
        'client_secret': client_secret,
        'redirect_uri': redirect_uri,
        'grant_type': 'authorization_code'
    }
    headers = {'Accept': 'application/json'}
    try:
        r = requests.post(token_uri, data=data, headers=headers, timeout=10)
        r.raise_for_status()
        tok = r.json()
    except Exception as e:
        return f'Failed to obtain token: {e}', 500

    id_token = tok.get('id_token')
    access_token = tok.get('access_token')
    # Validate id_token via tokeninfo endpoint
    userinfo = {}
    try:
        if id_token:
            vt = requests.get('https://oauth2.googleapis.com/tokeninfo', params={'id_token': id_token}, timeout=10)
            if vt.status_code == 200:
                userinfo = vt.json()
        elif access_token:
            ui = requests.get('https://www.googleapis.com/oauth2/v3/userinfo', headers={'Authorization': f'Bearer {access_token}'}, timeout=10)
            if ui.status_code == 200:
                userinfo = ui.json()
    except Exception:
        userinfo = {}

    # Store minimal user info in server session, then redirect to dashboard served by Flask
    session['oauth_user'] = {
        'email': userinfo.get('email') or '',
        'name': userinfo.get('name') or userinfo.get('email', ''),
        'picture': userinfo.get('picture') or ''
    }
    return redirect(url_for('dashboard'))


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)
