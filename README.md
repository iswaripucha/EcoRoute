# Eco-Route Backend

This folder contains a simple Flask backend that provides an ML-driven eco-route suggestion API.

Quick start (recommended inside a virtualenv):

```bash
python -m venv venv
source venv/bin/activate   # or venv\Scripts\activate on Windows
pip install -r requirements.txt
# Set your OpenRouteService API key (recommended). On Linux/macOS:
export ORS_API_KEY="YOUR_ORS_API_KEY"
# On Windows PowerShell:
$env:ORS_API_KEY = 'YOUR_ORS_API_KEY'
python app.py
```

Endpoints:
- `POST /predict-route` - JSON body: `{source, destination, people}` returns best option and CO2 estimates
- `GET /health` - returns service status

Notes:
- The backend uses OpenRouteService (ORS) for geocoding and routing when `ORS_API_KEY` is set. If `ORS_API_KEY` is not provided, the backend falls back to a mock distance (100 km / 120 min).
- The ML model is trained on synthetic data and saved to `backend/model.joblib` on first run.
