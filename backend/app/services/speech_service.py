from app.services.ai_service import client

def process_voice_text(voice_text: str) -> str:
    """
    Cleans up a raw spoken speech-to-text transcript.
    Translates input in Hindi, Marathi, or Hinglish to standard English database requests.
    Removes stutters, oral fillers, and excessive politeness (e.g. "please show me").
    Outputs a clean, structured database request prompt in English.
    """
    if not voice_text or not voice_text.strip():
        return ""

    system_prompt = (
        "You are an expert SQL prompt clean-up assistant. Your job is to take raw, spoken voice transcripts "
        "(which might have speech stutters, conversational filler, or be in English, Hindi, Hinglish, or Marathi) "
        "and convert them into a clean, direct, and grammatically correct English database query request.\n\n"
        "Rules:\n"
        "1. Translate any Hindi, Hinglish, or Marathi speech into clean English (e.g., 'HR department ke logo ko dikhao' -> 'Show employees from the HR department').\n"
        "2. Strip out spoken filler, stutter, or polite preambles (e.g., 'uh', 'um', 'please find me', 'can you show me').\n"
        "3. Keep the output very concise, direct, and focused on the database request.\n"
        "4. Return ONLY the finalized English prompt. Do not wrap in quotes. Do not include explanations, intro, or conversational text."
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
                    "content": voice_text
                }
            ],
            temperature=0
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        print("Speech Service Error:", e)
        # Fallback to returning original text if API fails
        return voice_text
