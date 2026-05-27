from groq import Groq
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

# Configure Groq client using their API Key
client = Groq(
    api_key=os.getenv("GROQ_API_KEY")
)


def generate_sql_query(user_prompt):
    system_prompt = """
    You are an expert SQL query generator.

    Convert natural language into PostgreSQL SQL queries.

    Rules:
    - Return ONLY the executable SQL query string.
    - Do NOT include any explanations or conversational text.
    - Do NOT wrap the query in markdown code blocks (e.g., do not use ```sql ... ```).
    - PostgreSQL syntax only.
    """

    try:
        response = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {
                    "role": "system",
                    "content": system_prompt
                },
                {
                    "role": "user",
                    "content": user_prompt
                }
            ],
            temperature=0
        )

        generated_sql = response.choices[0].message.content.strip()

        # Clean markdown code blocks if the model accidentally included them
        generated_sql = (
            generated_sql
            .replace("```sql", "")
            .replace("```", "")
            .strip()
        )

        return generated_sql

    except Exception as e:
        print("Groq Error:", e)
        raise Exception(
            "Groq API Error. Check API key or quota."
        )


def explain_sql_query(sql_query: str) -> str:
    system_prompt = """
    You are an expert SQL explanation assistant.
    Explain the provided SQL query in simple English.
    Describe what tables are queried, what fields are fetched, any filters or groups applied, and what the query accomplishes overall.
    Keep the tone professional, neat, and highly readable. Do not include extra conversational filler.
    """

    try:
        response = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {
                    "role": "system",
                    "content": system_prompt
                },
                {
                    "role": "user",
                    "content": sql_query
                }
            ],
            temperature=0
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        print("Groq Explain Error:", e)
        raise Exception("Failed to explain query using AI. Check API key or quota.")


def fix_sql_query(sql_query: str) -> dict:
    import json
    system_prompt = """
    You are an expert SQL debugger.
    Analyze the provided SQL query for syntax or spelling mistakes, and correct them so that it executes successfully on PostgreSQL.
    
    You must return your response STRICTLY as a JSON object, with the keys:
    1. 'fixed_sql': the corrected executable SQL statement.
    2. 'explanation': a simple, clear explanation of the mistakes that were found and how you corrected them. If there were no mistakes, specify that the query is already correct.
    
    Return valid JSON only. Do not wrap in markdown code blocks like ```json ... ```. Do not include any text before or after the JSON.
    """

    try:
        response = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {
                    "role": "system",
                    "content": system_prompt
                },
                {
                    "role": "user",
                    "content": sql_query
                }
            ],
            temperature=0
        )
        content = response.choices[0].message.content.strip()
        
        # Clean potential markdown wrappers if present
        if content.startswith("```json"):
            content = content[7:]
        if content.endswith("```"):
            content = content[:-3]
        content = content.strip()

        try:
            parsed = json.loads(content)
            return {
                "fixed_sql": parsed.get("fixed_sql", sql_query),
                "explanation": parsed.get("explanation", "Spelling or grammar corrected.")
            }
        except json.JSONDecodeError:
            # Simple fallback parser in case the model failed to generate strict JSON
            return {
                "fixed_sql": sql_query,
                "explanation": "Could not parse AI response. Here is the raw response: " + content
            }
    except Exception as e:
        print("Groq Fix Error:", e)
        raise Exception("Failed to fix query using AI. Check API key or quota.")