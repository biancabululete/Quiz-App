from openai import OpenAI
from dotenv import load_dotenv
import os

# 🔐 Încarcă cheia din .env
load_dotenv()
api_key = os.getenv("OPENAI_API_KEY")

# Creează clientul
client = OpenAI(api_key=api_key)

# Trimite un prompt simplu
response = client.chat.completions.create(
    model="gpt-3.5-turbo",
    messages=[
        {"role": "user", "content": "Spune-mi o glumă scurtă despre programatori."}
    ],
    temperature=0.7,
)

# ✅ Afișează rezultatul
print("✅ Răspuns de la OpenAI:")
print(response.choices[0].message.content)
