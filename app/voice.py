from gtts import gTTS


def text_to_speech(text, filename="interview_question.mp3"):
    tts = gTTS(text=text, lang="en")
    tts.save(filename)

    return filename