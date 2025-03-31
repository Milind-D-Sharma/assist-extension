from openai import OpenAI
import os

# Get API key from environment variable for better security
api_key = os.getenv("OPENAI_API_KEY")
if not api_key:
    print("Please set your OpenAI API key as an environment variable:")
    print("export OPENAI_API_KEY='your-api-key-here'")
    exit(1)

client = OpenAI(api_key=api_key)

try:
    completion = client.chat.completions.create(
        model="gpt-3.5-turbo",  # Using the standard model
        messages=[
            {"role": "system", "content": "You are a haiku expert. Write concise, creative haikus."},
            {"role": "user", "content": "Write a haiku about artificial intelligence."}
        ],
        temperature=0.7,  # Adding some creativity
        max_tokens=50  # Limiting token usage
    )
    print("\nGenerated Haiku:")
    print("-" * 20)
    print(completion.choices[0].message.content.strip())
    print("-" * 20)

except Exception as e:
    print(f"An error occurred: {str(e)}")
    print("\nPlease check your API key and make sure you have sufficient credits.") 