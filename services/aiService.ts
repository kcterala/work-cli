import { google } from "@ai-sdk/google";
import { generateText } from "ai"
import 'dotenv/config';

interface AiResponse {
    model: string,
    response: string
}

const prompt = "choose a number between 1 and 100 and tell me"

const generateTextFromLocal = async () => {
    try {
        const response = await fetch('http://localhost:11434/api/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'qwen2.5:3b',
                prompt: prompt,
                stream: false,
            }),
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const result = await response.json();
        const aiResponse = result as AiResponse;
        console.log("From local", aiResponse.response);
    } catch (error) {
        console.error("Error generating text from local API:", error);
    }
};

const generateTextFromGoogle = async () => {
    try {
        const { text } = await generateText({
            model: google("gemini-2.0-flash-lite"),
            prompt: prompt
        });
        console.log("From Google", text);
    } catch (error) {
        console.error("Error generating text from Google API:", error);
    }
}

generateTextFromGoogle()
generateTextFromLocal()
