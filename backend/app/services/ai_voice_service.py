from app.services.ai_service import client

def explain_sql_for_voice(sql_query: str) -> str:
    """
    Generates an extremely concise, natural, and voice-friendly explanation of a PostgreSQL query.
    Ideal for text-to-speech (TTS) playback in a browser environment.
    Limits output to 1-2 short sentences (under 180 characters) to avoid tedious narration.
    """
    if not sql_query or not sql_query.strip():
        return "No query was provided to explain."

    system_prompt = (
        "You are a helpful, voice-guided database assistant. "
        "Analyze the provided SQL query and explain its primary goal in simple, natural English.\n\n"
        "Rules:\n"
        "1. Write an explanation suitable for Text-to-Speech (TTS) reading.\n"
        "2. Keep it EXTREMELY short and direct: exactly 1 or 2 short sentences, and under 160 characters in total.\n"
        "3. Focus on the business objective (e.g. 'This fetches the top five employees with the highest salaries') rather than query-specific syntax or keywords.\n"
        "4. Do NOT use markdown formatting, markdown code blocks, brackets, quotes, or conversational filler. Return ONLY the spoken sentences."
    )

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
        print("Voice Explainer Service Error:", e)
        return "This query executes a database operation."
