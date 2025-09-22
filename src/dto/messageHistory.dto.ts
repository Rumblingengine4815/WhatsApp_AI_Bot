export interface IMessageHistory {
    role: 'user' | 'model'; // Gemini uses 'model' for AI responses
    parts: Array<{
        text: string;
    }>;
}