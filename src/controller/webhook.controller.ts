import { Request, Response } from "express";
import { WebhookService } from "../service/webhook.service";
import { WebhookVerificationDto, WebhookMessageDto } from "../dto/webhookVerification.dto";

export class WebhookController {
    private webhookService: WebhookService;

    constructor() {
        this.webhookService = WebhookService.getInstance();
    }

    // Handles webhook verification (GET requests)
    webhook = async (req: Request, res: Response) => {
        const mode = req.query['hub.mode'] as string;
        const challenge = req.query['hub.challenge'] as string;
        const verify_token = req.query['hub.verify_token'] as string;

        console.log("🔐 Webhook verification attempt:", { mode, verify_token });

        const verificationData: WebhookVerificationDto = {
            mode,
            challenge,
            verify_token
        };

        const response = this.webhookService.handleWebhookVerification(verificationData);
        
        if (response.status) {
            console.log("✅ Webhook verified successfully");
            res.status(200).send(response.challenge);
        } else {
            console.log("❌ Webhook verification failed");
            res.status(403).send('Error, wrong token.');
        }
    };

    // Handles incoming messages (POST requests)
    webhookMessage = async (req: Request, res: Response) => {
        console.log("🔔 Webhook message received");
        
        try {
            const data = req.body as WebhookMessageDto;
            console.log("📦 Webhook data received");

            // Immediately send 200 response to WhatsApp (MUST DO THIS FIRST)
            res.status(200).send("OK");

            // Process the message asynchronously (THIS IS WHAT YOU'RE MISSING!)
            this.processMessageAsync(data);

        } catch (error: any) {
            console.error("❌ Error in webhookMessage:", error.message);
            res.status(200).send("OK"); // Always respond OK to WhatsApp
        }
    };

    // Process message asynchronously
    private async processMessageAsync(data: WebhookMessageDto) {
        try {
            console.log("🔄 Starting async message processing...");
            
            // THIS CALLS YOUR WEBHOOK SERVICE THAT USES GEMINI!
            const isReplied = await this.webhookService.handleReceiveMessage(data);
            
            if (isReplied) {
                console.log("✅ Message processed and reply sent successfully");
            } else {
                console.log("⚠️ Message processed but reply may have failed");
            }
        } catch (error: any) {
            console.error("❌ Error in async message processing:", error.message);
        }
    }
}