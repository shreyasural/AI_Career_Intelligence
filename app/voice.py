from gtts import gTTS
import os


def text_to_speech(text, filename="interview_question.mp3"):

    try:
        tts = gTTS(
            text=text,
            lang="en"
        )

        file_path = os.path.abspath(filename)

        tts.save(file_path)

        return file_path

    except Exception as e:
        print("Text-to-speech error:", e)
        raise