#!/usr/bin/env python3
"""
Test India-Specific Transport Cost and Emissions Calculations
Validates all new calculation functions with expected test cases
"""

import sys
sys.path.insert(0, '/'.join(__file__.split('/')[:-1]))

# Import calculation functions from app.py
from app import (
    calculate_train_cost,
    calculate_bus_cost,
    calculate_car_cost,
    calculate_carpool_cost,
    calculate_co2_emissions,
    calculate_eco_score
)

print("=" * 80)
print("INDIA-SPECIFIC TRANSPORT CALCULATIONS TEST")
print("=" * 80)

# Test Case 1: Panvel → CSMT (23km - short suburban route)
print("\n\n📍 TEST CASE 1: PANVEL → CSMT (23km)")
print("-" * 80)
distance_test1 = 23
people_test1 = 1

print(f"Distance: {distance_test1}km, People: {people_test1}")
print()

# Train cost (should be ₹15 for 23km - between ≤15→₹10 and ≤30→₹15 slab)
train_cost = calculate_train_cost(distance_test1)
print(f"🚆 Train Cost: ₹{train_cost} (Expected: ₹15 - slab for 15-30km range)")
assert train_cost == 15, f"Train cost failed: got {train_cost}, expected 15"

# Bus cost (23 * 1.2 = 27.6, clamped to 50 max)
bus_cost = calculate_bus_cost(distance_test1)
print(f"🚌 Bus Cost: ₹{bus_cost} (Expected: ~₹28 - distance × 1.2)")
assert 27 <= bus_cost <= 28, f"Bus cost failed: got {bus_cost}, expected ~28"

# Car cost (23/15 * 105 = 160.5)
car_cost = calculate_car_cost(distance_test1)
print(f"🚗 Car Cost: ₹{car_cost} (Expected: ~₹161 - fuel-based)")
assert 160 <= car_cost <= 162, f"Car cost failed: got {car_cost}, expected ~161"

# CO2 emissions
train_co2 = calculate_co2_emissions(distance_test1, 'train', people_test1)
bus_co2 = calculate_co2_emissions(distance_test1, 'bus', people_test1)
car_co2 = calculate_co2_emissions(distance_test1, 'car', people_test1)

print(f"🌍 Train CO₂: {train_co2} kg (Expected: ~0.575kg - 25g/km × 23km)")
print(f"🌍 Bus CO₂: {bus_co2} kg (Expected: ~1.564kg - 68g/km × 23km)")
print(f"🌍 Car CO₂: {car_co2} kg (Expected: ~2.76kg - 120g/km × 23km)")

assert 0.57 <= train_co2 <= 0.58, f"Train CO2 failed: got {train_co2}"
assert 1.56 <= bus_co2 <= 1.57, f"Bus CO2 failed: got {bus_co2}"
assert 2.75 <= car_co2 <= 2.77, f"Car CO2 failed: got {car_co2}"

print("\n✅ TEST CASE 1 PASSED\n")

# Test Case 2: Short distance (8km - walking/cycling range)
print("\n📍 TEST CASE 2: SHORT DISTANCE (8km)")
print("-" * 80)
distance_test2 = 8
people_test2 = 1

print(f"Distance: {distance_test2}km, People: {people_test2}")
print()

train_cost_2 = calculate_train_cost(distance_test2)
print(f"🚆 Train Cost: ₹{train_cost_2} (Expected: ₹5 - slab for ≤10km)")
assert train_cost_2 == 5, f"Train cost failed: got {train_cost_2}"

bus_cost_2 = calculate_bus_cost(distance_test2)
print(f"🚌 Bus Cost: ₹{bus_cost_2} (Expected: ₹10 - min bound at distance×1.2=9.6)")
assert bus_cost_2 == 10, f"Bus cost failed: got {bus_cost_2}"

car_cost_2 = calculate_car_cost(distance_test2)
print(f"🚗 Car Cost: ₹{car_cost_2} (Expected: ~₹56 - fuel-based)")
assert 55 <= car_cost_2 <= 57, f"Car cost failed: got {car_cost_2}"

print(f"🌍 Train CO₂: {calculate_co2_emissions(distance_test2, 'train', people_test2)} kg")
print(f"🌍 Bus CO₂: {calculate_co2_emissions(distance_test2, 'bus', people_test2)} kg")
print(f"🌍 Car CO₂: {calculate_co2_emissions(distance_test2, 'car', people_test2)} kg")

print("\n✅ TEST CASE 2 PASSED\n")

# Test Case 3: Long distance (150km - Mumbai to Pune)
print("\n📍 TEST CASE 3: LONG DISTANCE (150km - Mumbai to Pune)")
print("-" * 80)
distance_test3 = 150
people_test3 = 1

print(f"Distance: {distance_test3}km, People: {people_test3}")
print()

train_cost_3 = calculate_train_cost(distance_test3)
print(f"🚆 Train Cost: ₹{train_cost_3} (Expected: ₹30 - slab for >60km)")
assert train_cost_3 == 30, f"Train cost failed: got {train_cost_3}"

bus_cost_3 = calculate_bus_cost(distance_test3)
print(f"🚌 Bus Cost: ₹{bus_cost_3} (Expected: ₹50 - capped at max)")
assert bus_cost_3 == 50, f"Bus cost failed: got {bus_cost_3}"

car_cost_3 = calculate_car_cost(distance_test3)
print(f"🚗 Car Cost: ₹{car_cost_3} (Expected: ~₹1050 - fuel-based)")
assert 1049 <= car_cost_3 <= 1051, f"Car cost failed: got {car_cost_3}"

train_co2_3 = calculate_co2_emissions(distance_test3, 'train', people_test3)
bus_co2_3 = calculate_co2_emissions(distance_test3, 'bus', people_test3)
car_co2_3 = calculate_co2_emissions(distance_test3, 'car', people_test3)

print(f"🌍 Train CO₂: {train_co2_3} kg (Expected: ~3.75kg - 25g/km)")
print(f"🌍 Bus CO₂: {bus_co2_3} kg (Expected: ~10.2kg - 68g/km)")
print(f"🌍 Car CO₂: {car_co2_3} kg (Expected: ~18kg - 120g/km)")

assert 3.74 <= train_co2_3 <= 3.76, f"Train CO2 failed: got {train_co2_3}"
assert 10.19 <= bus_co2_3 <= 10.21, f"Bus CO2 failed: got {bus_co2_3}"
assert 17.99 <= car_co2_3 <= 18.01, f"Car CO2 failed: got {car_co2_3}"

print("\n✅ TEST CASE 3 PASSED\n")

# Test Case 4: Carpool (multiple people)
print("\n📍 TEST CASE 4: CARPOOL (80km, 3 people)")
print("-" * 80)
distance_test4 = 80
people_test4 = 3

print(f"Distance: {distance_test4}km, People: {people_test4}")
print()

carpool_cost = calculate_carpool_cost(distance_test4, people_test4)
car_cost_base = calculate_car_cost(distance_test4)
print(f"🚗 Car Cost (per person): ₹{carpool_cost}")
print(f"   (Base car cost ₹{car_cost_base} ÷ {people_test4} people)")
assert abs(carpool_cost - (car_cost_base / people_test4)) < 0.1

carpool_co2 = calculate_co2_emissions(distance_test4, 'carpool', people_test4)
print(f"🌍 Carpool CO₂ (per person): {carpool_co2} kg")
print(f"   (Expected: ~{round((distance_test4 * 120 / 1000 / people_test4), 3)} kg)")

print("\n✅ TEST CASE 4 PASSED\n")

# Test Case 5: Eco Score Calculation
print("\n📍 TEST CASE 5: ECO SCORE CALCULATION")
print("-" * 80)

eco_score_train = calculate_eco_score(23, 'train', 1, 100)
eco_score_car = calculate_eco_score(23, 'car', 1, 50)

print(f"Train Eco Score (23km, 100min): {eco_score_train}/100")
print(f"Car Eco Score (23km, 50min): {eco_score_car}/100")
print(f"✅ Train score should be significantly higher than car: {eco_score_train > eco_score_car}")

assert eco_score_train > eco_score_car, "Train should have higher eco score"

print("\n✅ TEST CASE 5 PASSED\n")

print("\n" + "=" * 80)
print("ALL TESTS PASSED ✅")
print("=" * 80)

print("\n📊 SUMMARY OF INDIA-SPECIFIC CALCULATIONS:")
print("-" * 80)
print("Train Fares (Distance Slabs):")
print("  ≤10km: ₹5 | ≤15km: ₹10 | ≤30km: ₹15 | ≤45km: ₹20 | ≤60km: ₹25 | >60km: ₹30")
print("\nBus Fares (Formula: distance × 1.2, min ₹10, max ₹50)")
print("\nCar Costs (Fuel-based: distance/15 × 105)")
print("  Mileage: 15 km/liter | Petrol: ₹105/liter")
print("\nCO₂ Factors (per km per person):")
print("  Train: 25 g/km | Bus: 68 g/km | Car: 120 g/km")
print("\nEco Score Formula (0-100):")
print("  (0.5 × CO₂_score) + (0.3 × Cost_score) + (0.2 × Time_score)")
print("=" * 80)
