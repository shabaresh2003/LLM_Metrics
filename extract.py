import pandas as pd
import json

xl = pd.ExcelFile('ghg-conversion-factors-2026-full-set.xlsx')

data = {
    "electricity_kg_per_kwh": 0.207,  # Will try to extract
    "car_kg_per_mile": 0.27, # default
    "flight_kg_per_km": 0.15,
}

try:
    # 1. Electricity
    df_elec = pd.read_excel(xl, sheet_name='UK electricity', skiprows=6)
    # the format typically has 'Activity', 'Country', 'Unit', 'kg CO2e'
    # we'll just look for Electricity generated
    for idx, row in df_elec.iterrows():
        if 'Electricity generated' in str(row.values) and 'kWh' in str(row.values):
            for val in row.values:
                if isinstance(val, (int, float)) and val > 0 and val < 1:
                    data['electricity_kg_per_kwh'] = float(val)
                    break
except Exception as e:
    print("Error elec:", e)

try:
    # 2. Passenger vehicles (Average car, unknown fuel)
    df_car = pd.read_excel(xl, sheet_name='Passenger vehicles', skiprows=6)
    for idx, row in df_car.iterrows():
        if 'Average car' in str(row.values) and 'Unknown' in str(row.values) and 'miles' in str(row.values):
            for val in row.values:
                if isinstance(val, (int, float)) and val > 0 and val < 1:
                    data['car_kg_per_mile'] = float(val)
                    break
except Exception as e:
    print("Error car:", e)

try:
    # 3. Air travel (Average passenger)
    df_air = pd.read_excel(xl, sheet_name='Business travel- air', skiprows=6)
    for idx, row in df_air.iterrows():
        if 'Average passenger' in str(row.values) and 'passenger.km' in str(row.values):
            for val in row.values:
                if isinstance(val, (int, float)) and val > 0 and val < 1:
                    data['flight_kg_per_km'] = float(val)
                    break
except Exception as e:
    print("Error air:", e)

# Oxford Food Study (Scarborough et al) - kg CO2e per day
data["diet_kg_per_day"] = {
    "meat_heavy": 7.19,
    "meat_medium": 5.63,
    "meat_low": 4.67,
    "pescatarian": 3.91,
    "vegetarian": 3.81,
    "vegan": 2.89
}

# Shopping / General (estimated factor per £ spend)
data["shopping_kg_per_pound"] = 0.35 

with open("src/lib/factors.json", "w") as f:
    json.dump(data, f, indent=2)

print("Extraction complete. Extracted data:")
print(json.dumps(data, indent=2))
