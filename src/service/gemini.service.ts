import { GoogleGenerativeAI } from "@google/generative-ai";
import { APP_CONFIG } from "../config/app.config";

export class GeminiService {
    private genAI: GoogleGenerativeAI;
    private model: any;
    private static instance: GeminiService;

    public static getInstance(): GeminiService {
        if (!GeminiService.instance) {
            GeminiService.instance = new GeminiService();
        }
        return GeminiService.instance;
    }

    private constructor() {
        const apiKey = APP_CONFIG.GEMINI_API_KEY;
        if (!apiKey) {
            throw new Error("❌ GEMINI_API_KEY is not configured");
        }
        
        this.genAI = new GoogleGenerativeAI(apiKey);
        this.model = this.genAI.getGenerativeModel({ 
            model: "gemini-1.5-flash" // Use this model
        });
    }

    public async generateReply(message: string): Promise<string> {
        try {
            console.log("📨 Sending to Gemini:", message);
            
            // Create a better prompt
            const prompt = `You are a helpful WhatsApp assistant. Respond to this message in a friendly but informative way: "${message}"`;
            
            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();
            
            console.log("📤 Gemini response:", text);
            return text || 'Sorry, I could not generate a response right now.';
            
        } catch (error: any) {
            console.error("❌ Gemini API Error:", error.message);
            return 'I apologize, but I\'m having trouble responding. Please try again.';
        }
    }
}