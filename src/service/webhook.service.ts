import { Request, Response } from "express";
import { WebhookMessageDto, WebhookVerificationDto, WebhookVerificationResponseDto } from "../dto/webhookVerification.dto";
import { APP_CONFIG } from "../config/app.config";
import { MessageService } from "./message.service";
import { GeminiService } from "./gemini.service";

export class WebhookService {
    private static instance: WebhookService;
    private messageService: MessageService;
    private geminiService: GeminiService;

    public static getInstance(): WebhookService {
        if (!WebhookService.instance) {
            WebhookService.instance = new WebhookService();
        }
        return WebhookService.instance;
    }

    private constructor() {
        this.messageService = MessageService.getInstance();
        this.geminiService = GeminiService.getInstance();
    }

    public handleWebhookVerification(data: WebhookVerificationDto): WebhookVerificationResponseDto {
        console.log("🔐 Webhook verification attempt");
        const password = APP_CONFIG.WEBHOOK_VERIFICATION_PASSWORD;

        if (data.mode === 'subscribe' && data.verify_token === password) {
            console.log("✅ Webhook verification successful");
            return {
                status: true,
                challenge: data.challenge,
                message: "Verification successful"
            };
        }
        
        console.log("❌ Webhook verification failed");
        return {
            status: false,
            challenge: '',
            message: "Verification failed"
        };
    }

    public async handleReceiveMessage(data: WebhookMessageDto): Promise<boolean> {
        console.log("🔔 Webhook received");
        
        try {
            // Use optional chaining to avoid errors
            const value = data.entry?.[0]?.changes?.[0]?.value;
            
            if (!value) {
                console.log("❌ No value found in webhook");
                return true;
            }

            // Check for status updates first
            if (value.statuses && value.statuses.length > 0) {
                console.log('📍 Status update:', value.statuses[0].status);
                return true;
            }

            // Check for incoming messages
            if (value.messages && value.messages.length > 0) {
                const messageData = value.messages[0];
                
                if (messageData.type === 'text') {
                    const message = messageData.text?.body;
                    const phoneNumber = value.contacts?.[0]?.wa_id;
                    const name = value.contacts?.[0]?.profile?.name;

                    console.log(`👤 From: ${name} (${phoneNumber})`);
                    console.log(`📨 Message: ${message}`);

                    if (!message || !phoneNumber) {
                        console.log("❌ Missing message or phone number");
                        return true;
                    }

                    // Generate reply using Gemini
                    console.log("🤖 Calling Gemini...");
                    const replyMessage = await this.geminiService.generateReply(message);
                    console.log(`📤 Gemini response: ${replyMessage}`);

                    // Send reply via WhatsApp
                    console.log("📤 Sending to WhatsApp...");
                    const isReplied = await this.messageService.sendMessage(phoneNumber, replyMessage);
                    
                    console.log(`✅ Reply sent: ${isReplied}`);
                    return isReplied;
                } else {
                    console.log(`📱 Non-text message type: ${messageData.type}`);
                    // Handle non-text messages
                    const unsupportedMessage = "I currently only support text messages. Please send a text message!";
                    const isReplied = await this.messageService.sendMessage(
                        value.contacts?.[0]?.wa_id, 
                        unsupportedMessage
                    );
                    return isReplied;
                }
            }

            console.log("❓ No messages or statuses found in webhook");
            return true;

        } catch (error: any) {
            console.error("❌ Error in handleReceiveMessage:", error.message);
            console.error("Stack:", error.stack);
            return true;
        }
    }
}