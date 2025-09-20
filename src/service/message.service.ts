import axios from "axios";
import { APP_CONFIG } from "../config/app.config";

export class MessageService {
    private static instance: MessageService;

    public static getInstance(): MessageService {
        if (!MessageService.instance) {
            MessageService.instance = new MessageService();
        }
        return MessageService.instance;
    }

    private constructor() {}

    public async sendMessage(phoneNumber: string, message: string): Promise<boolean> {
        const data = JSON.stringify({
            "messaging_product": "whatsapp",
            "recipient_type": "individual",
            "to": phoneNumber,
            "type": "text",
            "text": {
                "preview_url": false,
                "body": message
            }
        });

        const config = {
            method: 'post',
            maxBodyLength: Infinity,
            url: `https://graph.facebook.com/v21.0/${APP_CONFIG.PHONE_NUMBER_ID}/messages`,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${APP_CONFIG.WHATSAPP_USER_ACCESS_TOKEN}`
            },
            data: data
        };

        try {
            console.log("📤 Sending to:", phoneNumber);
            console.log("💬 Message:", message);
            
            const response = await axios.request(config);
            console.log("✅ WhatsApp API success:", response.status);
            console.log("Response data:", response.data);
            
            return true;
        } catch (error: any) {
            console.error("❌ WhatsApp API Error:");
            console.error("Status:", error.response?.status);
            console.error("Data:", error.response?.data);
            console.error("Message:", error.message);
            return false;
        }
    }
}