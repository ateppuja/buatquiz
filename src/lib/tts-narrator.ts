// Text-to-Speech (TTS) Narrator for Student Questions using Web Speech API

class QuestionNarrator {
  private synth: SpeechSynthesis | null = null;
  private isSpeakingState: boolean = false;
  private onStateChangeCallback: ((speaking: boolean) => void) | null = null;

  constructor() {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      this.synth = window.speechSynthesis;
    }
  }

  public isSupported(): boolean {
    return typeof window !== "undefined" && "speechSynthesis" in window;
  }

  public isSpeaking(): boolean {
    return this.isSpeakingState;
  }

  public onStateChange(cb: (speaking: boolean) => void) {
    this.onStateChangeCallback = cb;
  }

  public stop() {
    if (this.synth) {
      this.synth.cancel();
    }
    this.isSpeakingState = false;
    if (this.onStateChangeCallback) {
      this.onStateChangeCallback(false);
    }
  }

  public speakQuestion(
    questionNumber: number,
    questionText: string,
    options?: Array<{ key: string; text: string }>
  ) {
    if (!this.synth) return;

    this.stop();

    // Prepare speech text in Indonesian
    let fullText = `Soal nomor ${questionNumber}. ${questionText}.`;
    if (options && options.length > 0) {
      fullText += " Pilihan jawaban. ";
      options.forEach((opt) => {
        fullText += `Pilihan ${opt.key}, ${opt.text}. `;
      });
    }

    const utterance = new SpeechSynthesisUtterance(fullText);
    utterance.lang = "id-ID";
    utterance.rate = 0.95; // Clear natural speed
    utterance.pitch = 1.05; // Cheerful friendly tone

    // Try finding an Indonesian voice if available in browser
    const voices = this.synth.getVoices();
    const idVoice = voices.find(
      (v) =>
        v.lang.startsWith("id") ||
        v.lang.includes("ID") ||
        v.name.toLowerCase().includes("indonesia")
    );
    if (idVoice) {
      utterance.voice = idVoice;
    }

    utterance.onstart = () => {
      this.isSpeakingState = true;
      if (this.onStateChangeCallback) this.onStateChangeCallback(true);
    };

    utterance.onend = () => {
      this.isSpeakingState = false;
      if (this.onStateChangeCallback) this.onStateChangeCallback(false);
    };

    utterance.onerror = () => {
      this.isSpeakingState = false;
      if (this.onStateChangeCallback) this.onStateChangeCallback(false);
    };

    this.synth.speak(utterance);
  }
}

export const narrator = new QuestionNarrator();
