import { GoogleGenAI, Modality } from "@google/genai";
import { getApiKey } from "./core";

let liveSession: any = null;
let inputAudioContext: AudioContext | null = null;
let outputAudioContext: AudioContext | null = null;
let nextStartTime = 0;
const sources = new Set<AudioBufferSourceNode>();

export const startLiveSession = async (
    onStatusChange: (status: 'connected' | 'disconnected' | 'error') => void
) => {
    const apiKey = getApiKey();
    if (!apiKey) {
        console.error("API Key missing");
        onStatusChange('error');
        return;
    }
    const ai = new GoogleGenAI({ apiKey });

    nextStartTime = 0;
    sources.clear();

    // Initialize Audio Contexts
    inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({sampleRate: 16000});
    outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({sampleRate: 24000});
    
    const outputNode = outputAudioContext.createGain();
    outputNode.connect(outputAudioContext.destination);

    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        
        const sessionPromise = ai.live.connect({
            model: 'gemini-2.5-flash-native-audio-preview-12-2025',
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
                },
                systemInstruction: "You are a creative agency co-pilot. Help with brainstorming, strategy, and design concepts. Be concise, friendly, and professional.",
            },
            callbacks: {
                onopen: () => {
                    console.log("Live Session Open");
                    onStatusChange('connected');
                    
                    if (!inputAudioContext) return;
                    
                    // Audio Input Processing
                    const source = inputAudioContext.createMediaStreamSource(stream);
                    const scriptProcessor = inputAudioContext.createScriptProcessor(4096, 1, 1);
                    
                    scriptProcessor.onaudioprocess = (e) => {
                        const inputData = e.inputBuffer.getChannelData(0);
                        const pcmBlob = createBlob(inputData);
                        // Prevent stale closure by using the promise
                        sessionPromise.then(session => session.sendRealtimeInput({ media: pcmBlob }));
                    };
                    
                    source.connect(scriptProcessor);
                    scriptProcessor.connect(inputAudioContext.destination);
                },
                onmessage: async (msg) => {
                    // Process Audio Output from Model
                    const base64Audio = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
                    
                    if (base64Audio && outputAudioContext) {
                        nextStartTime = Math.max(nextStartTime, outputAudioContext.currentTime);
                        const audioBytes = decode(base64Audio);
                        const audioBuffer = await decodeAudioData(audioBytes, outputAudioContext, 24000, 1);
                        
                        const source = outputAudioContext.createBufferSource();
                        source.buffer = audioBuffer;
                        source.connect(outputNode);
                        
                        source.addEventListener('ended', () => sources.delete(source));
                        source.start(nextStartTime);
                        nextStartTime += audioBuffer.duration;
                        sources.add(source);
                    }

                    // Handle Interruption
                    if (msg.serverContent?.interrupted) {
                        sources.forEach(s => s.stop());
                        sources.clear();
                        nextStartTime = 0;
                    }
                },
                onclose: () => {
                    console.log("Live Session Closed");
                    onStatusChange('disconnected');
                },
                onerror: (e) => {
                    console.error("Live Session Error", e);
                    onStatusChange('error');
                }
            }
        });
        
        liveSession = sessionPromise;

    } catch (e) {
        console.error("Failed to init Live Session", e);
        onStatusChange('error');
    }
};

export const stopLiveSession = async () => {
    if (liveSession) {
        try {
            const session = await liveSession;
            session.close();
        } catch(e) { console.error("Error closing session", e); }
        liveSession = null;
    }
    if (inputAudioContext) {
        inputAudioContext.close();
        inputAudioContext = null;
    }
    if (outputAudioContext) {
        outputAudioContext.close();
        outputAudioContext = null;
    }
    sources.forEach(s => s.stop());
    sources.clear();
};

// --- Helpers for PCM Encoding/Decoding ---

function createBlob(data: Float32Array) {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    int16[i] = data[i] * 32768;
  }
  let binary = '';
  const bytes = new Uint8Array(int16.buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return {
    data: btoa(binary),
    mimeType: 'audio/pcm;rate=16000',
  };
}

function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}