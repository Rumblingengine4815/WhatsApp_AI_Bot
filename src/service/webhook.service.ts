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
            const value = data.entry?.[0]?.changes?.[0]?.value;
            
            if (!value) {
                console.log("❌ No value found in webhook");
                return true;
            }

            // Check for status updates first
            if (value.statuses && value.statuses.length > 0) {
                const statusData = value.statuses[0];
                console.log('📍 Status update:', statusData.status);
                
                // ✅ FIXED: TypeScript now knows statusData has an id property
                if (statusData.id) {
                    console.log('📍 Message ID:', statusData.id);
                    await this.messageService.updateMessageStatus(
                        statusData.id,
                        statusData.status
                    );
                } else {
                    console.log('❌ No message ID found in status update');
                }
                
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

                    // Get history FIRST, before saving new message
                    console.log("🔄 Retrieving conversation history...");
                    const history = await this.messageService.getMessagesByUserId(phoneNumber);
                    console.log("📊 Conversation history length BEFORE new message:", history.length);

                    // THEN save the new user message
                    await this.messageService.saveUserMessage(phoneNumber, message, messageData.id);
                    console.log("💾 Saved new user message to database");

                    // Generate reply using Gemini with history context
                    console.log("🤖 Calling Gemini with history...");
                    const replyMessage = await this.geminiService.generateReply(message, history);

                    // Send reply via WhatsApp
                    console.log("📤 Sending to WhatsApp...");
                    const isReplied = await this.messageService.sendMessage(phoneNumber, replyMessage);
                    
                    console.log(`✅ Reply sent: ${isReplied}`);
                    return isReplied;
                } else {
                    console.log(`📱 Non-text message type: ${messageData.type}`);
                    const unsupportedMessage = "I currently only support text messages. Please send a text message!";
                    const isReplied = await this.messageService.sendMessage(
                        value.contacts?.[0]?.wa_id!, 
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