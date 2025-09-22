import { APP_CONFIG } from "../config/app.config";
import { GoogleGenAI } from "@google/genai";
import { IMessageHistory } from "../dto/messageHistory.dto";

export class GeminiService {
    private geminiApiKey: string;
    private gemini: GoogleGenAI;
    private static instance: GeminiService;

    public static getInstance(): GeminiService {
        if (!GeminiService.instance) {
            GeminiService.instance = new GeminiService();
        }
        return GeminiService.instance;
    }

    private constructor() {
        this.geminiApiKey = APP_CONFIG.GEMINI_API_KEY || '';
        if (!this.geminiApiKey) {
            throw new Error("❌ GEMINI_API_KEY is not configured");
        }
        
        this.gemini = new GoogleGenAI({
            apiKey: this.geminiApiKey
        });
    }

    public async generateReply(message: string, history: IMessageHistory[] = []): Promise<string> {
        try {
            console.log("📨 Sending to Gemini:", message);
            console.log("📊 History length:", history.length);
            
            // Debug: Show the actual history being sent
            if (history.length > 0) {
                console.log("📋 Conversation history being used:");
                history.forEach((msg, index) => {
                    console.log(`   ${index + 1}. [${msg.role}] ${msg.parts[0].text.substring(0, 50)}${msg.parts[0].text.length > 50 ? '...' : ''}`);
                });
            }

            // Create chat session with the actual history
            const chat = await this.gemini.chats.create({
                model: "gemini-2.5-flash",
                history: history, // This should contain the conversation history
            });

            const response = await chat.sendMessage({
                message: message,
            });

            const reply = response.text || 'Cannot generate reply';
            console.log("📤 Gemini response:", reply);
            
            return reply;

        } catch (error: any) {
            console.error("❌ Gemini API Error:", error.message);
            return 'I apologize, but I\'m having trouble responding. Please try again.';
        }
    }

    // Simple method without history
    public async generateSimpleReply(message: string): Promise<string> {
        return this.generateReply(message, []);
    }
}