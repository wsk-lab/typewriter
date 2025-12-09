import { GoogleGenAI } from "@google/genai";

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key not found");
  }
  return new GoogleGenAI({ apiKey });
};

export const polishTextToVintage = async (inputText: string): Promise<string> => {
  try {
    const ai = getClient();
    const prompt = `Rewrite the following text to sound like a vintage letter or telegram from the 1920s. Keep it concise but evocative. Use a typewriter style tone.
    
    Input text: "${inputText}"`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || inputText;
  } catch (error) {
    console.error("Error polishing text:", error);
    return inputText; // Fallback to original on error
  }
};