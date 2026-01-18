
import { GoogleGenAI, Modality } from "@google/genai";
import { getApiKey, decodeBase64ToArrayBuffer } from "./core";

// --- AUDIO CONTEXT SINGLETON ---
let audioContext: AudioContext | null = null;

const getAudioContext = () => {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
  }
  return audioContext;
};

export const generateAndPlaySpeech = async (text: string): Promise<void> => {
    const apiKey = getApiKey();
    if (!apiKey || !text) return;
    const ai = new GoogleGenAI({ apiKey });

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: [{ parts: [{ text: text }] }],
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: { voiceName: 'Kore' },
                    },
                },
            },
        });

        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        
        if (base64Audio) {
            const ctx = getAudioContext();
            if (ctx.state === 'suspended') {
                await ctx.resume();
            }
            
            const arrayBuffer = decodeBase64ToArrayBuffer(base64Audio);
            const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
            
            const source = ctx.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(ctx.destination);
            source.start(0);
        }
    } catch (error) {
        console.error("Error generating speech:", error);
        throw error;
    }
}
