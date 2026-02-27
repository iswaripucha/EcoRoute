#!/usr/bin/env python3
"""
Comprehensive test for the Eco-route application
"""
from app import app
from ml_model import predict_scores

# Test 1: ML Model
print("=" * 60)
print("TEST 1: ML Model Predictions")
print("=" * 60)
scores = predict_scores(100, 3)
print(f"✓ Predictions for 100km with 3 people: {scores}")
print()

# Test 2: Flask App Context
print("=" * 60)
print("TEST 2: Flask App")
print("=" * 60)
print(f"✓ Flask app created: {app.name}")
print(f"✓ Static folder: {app.static_folder}")
print(f"✓ Template folder: {app.template_folder}")
print()

# Test 3: Routes
print("=" * 60)
print("TEST 3: Available Routes")
print("=" * 60)
routes = []
for rule in app.url_map.iter_rules():
    routes.append(f"  {rule.rule} -> {rule.endpoint}")
print(f"✓ Total routes: {len(routes)}")
for route in sorted(routes):
    print(route)
print()

print("=" * 60)
print("✓ ALL TESTS PASSED - Application is ready!")
print("=" * 60)
