import os
import numpy as np
import pandas as pd
from sklearn.linear_model import LinearRegression
import joblib


EMISSION_FACTORS = {
    'car': 140,        # Petrol cars in Indian traffic (g CO2/km)
    'bus': 50,         # Public buses (high occupancy)
    'train': 30,       # Electric metro (India average)
    'bike': 0,
    'carpool': 70      # Shared car per person
}


def generate_synthetic_data(n_samples=1000, random_state=42):
    rng = np.random.RandomState(random_state)
    distances = rng.uniform(1, 300, size=n_samples)  # km
    people = rng.randint(1, 6, size=n_samples)
    modes = rng.choice(list(EMISSION_FACTORS.keys()), size=n_samples)

    emission_factor = np.array([EMISSION_FACTORS[m] for m in modes])
    # For carpool, emission factor per person
    emission_per_person = np.where(modes == 'carpool', emission_factor / people, emission_factor)

    # target: eco score (lower is better), base calculation + noise
    eco_score = (distances * emission_per_person) / 1000.0  # convert g to kg as arbitrary scale
    eco_score += rng.normal(scale=0.1 * eco_score.std(), size=n_samples)

    df = pd.DataFrame({
        'distance': distances,
        'people': people,
        'mode': modes,
        'emission_factor': emission_factor,
        'eco_score': eco_score
    })

    # One-hot encode mode for simple regression
    df = pd.get_dummies(df, columns=['mode'], drop_first=False)
    return df


def train_and_save_model(path=None):
    if path is None:
        path = os.path.join(os.path.dirname(__file__), 'model.joblib')
    df = generate_synthetic_data()
    X = df.drop(columns=['eco_score'])
    y = df['eco_score']

    model = LinearRegression()
    model.fit(X, y)

    os.makedirs(os.path.dirname(path), exist_ok=True)
    joblib.dump({'model': model, 'columns': X.columns.tolist()}, path)
    return model, X.columns.tolist()


def load_model(path=None):
    if path is None:
        path = os.path.join(os.path.dirname(__file__), 'model.joblib')
    if os.path.exists(path):
        data = joblib.load(path)
        return data['model'], data['columns']
    return None, None


def get_features_for_mode(distance, people, mode, columns):
    emission_factor = EMISSION_FACTORS.get(mode, 0.0)

    data = {
        'distance': float(distance),
        'people': int(people),
        'emission_factor': float(emission_factor),
    }
    # add mode one-hot
    for m in EMISSION_FACTORS.keys():
        key = f'mode_{m}'
        data[key] = 1.0 if m == mode else 0.0

    return [data[c] for c in columns]


def predict_scores(distance, people):
    model, columns = load_model()
    if model is None:
        model, columns = train_and_save_model()

    scores = {}
    for mode in EMISSION_FACTORS.keys():
        feat = get_features_for_mode(distance, people, mode, columns)
        X = np.array(feat, dtype=float).reshape(1, -1)
        pred = float(model.predict(X)[0])
        deterministic = (distance * (EMISSION_FACTORS[mode] / (people if mode == 'carpool' and people>0 else 1))) / 1000.0
        score = max(pred, deterministic * 0.5)
        scores[mode] = round(float(score), 6)
    return scores


def choose_best_option(scores):
    best = min(scores.items(), key=lambda x: x[1])
    return {'best_option': best[0], 'score': best[1], 'scores': scores}
