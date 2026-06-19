import json

with open('src/lib/pricing.json', 'r') as f:
    data = json.load(f)

# Append new SLM models
nano_gpt = {
  "id": "nanoGPT",
  "provider": "Open Source",
  "displayName": "nanoGPT (124M)",
  "class": "small",
  "encoding": "cl100k_base",
  "inputPricePerMTok": 0.0,
  "outputPricePerMTok": 0.0,
  "energyPerTokenWh": 0.00004,
  "ttftMs": 50,
  "tokensPerSecond": 400
}

tiny_llama = {
  "id": "TinyLlama",
  "provider": "Open Source",
  "displayName": "TinyLlama (1.1B)",
  "class": "small",
  "encoding": "cl100k_base",
  "inputPricePerMTok": 0.0,
  "outputPricePerMTok": 0.0,
  "energyPerTokenWh": 0.00006,
  "ttftMs": 80,
  "tokensPerSecond": 350
}

# Add them if they don't already exist
existing_ids = [m['id'] for m in data['models']]
if "nanoGPT" not in existing_ids:
    data['models'].append(nano_gpt)
if "TinyLlama" not in existing_ids:
    data['models'].append(tiny_llama)

# Save back
with open('src/lib/pricing.json', 'w') as f:
    json.dump(data, f, indent=2)

print("Added nanoGPT and TinyLlama to pricing.json")
