import axios from "axios";
import { APP_CONFIG } from "../config/app.config";
import { IMessage } from "../model/message.model";
import { MessageDao } from "../dao/message.dao";
import { IMessageHistory } from "../dto/messageHistory.dto";

export class MessageService {
    private static instance: MessageService;
    private messageDao: MessageDao;

    public static getInstance(): MessageService {
        if (!MessageService.instance) {
            MessageService.instance = new MessageService();
        }
        return MessageService.instance;
    }

    private constructor() {
        this.messageDao = MessageDao.getInstance();
    }

    public async sendMessage(phoneNumber: string, message: string): Promise<boolean> {
        const maxLength = 4096;
        
        if (message.length > maxLength) {
            console.log(`⚠️ Message too long (${message.length} characters), truncating to ${maxLength}`);
            message = message.substring(0, maxLength - 3) + '...';
        }

        console.log(`📤 Sending message (${message.length} characters) to ${phoneNumber}`);

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
            url: `https://graph.facebook.com/${APP_CONFIG.VERSION}/${APP_CONFIG.PHONE_NUMBER_ID}/messages`,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${APP_CONFIG.WHATSAPP_USER_ACCESS_TOKEN}`
            },
            data: data
        };

        try {
            const response = await axios.request(config);
            
            if (response.status === 200) {
                console.log('✅ Reply sent to', phoneNumber);
                
                try {
                    await this.messageDao.createMessage({
                        phoneNumber,
                        role: 'assistant',
                        content: message,
                        messageId: response.data.messages?.[0]?.id,
                        status: 'sent'
                    });
                    console.log('💾 Saved assistant message to database');
                } catch (dbError) {
                    console.error('❌ Error saving message to database:', dbError);
                }
                
                return true;
            } else {
                console.log('❌ Unexpected status code:', response.status);
                return false;
            }
        } catch (error: any) {
            console.error('❌ Error sending message to WhatsApp:');
            console.error('Status:', error.response?.status);
            console.error('Error details:', error.response?.data);
            
            return false;
        }
    }

    public async getMessagesByUserId(phoneNumber: string): Promise<IMessageHistory[]> {
        try {
            const cleanPhoneNumber = phoneNumber.trim();
            console.log(`🔍 Service: Getting history for: "${cleanPhoneNumber}"`);
            
            const messages = await this.messageDao.getMessagesByUserId(cleanPhoneNumber);
            console.log(`📋 Service: Raw DB result: ${messages.length} messages`);

            messages.forEach((msg, index) => {
                console.log(`   ${index + 1}. [${msg.role}] ${msg.content.substring(0, 50)}${msg.content.length > 50 ? '...' : ''}`);
            });

            const history: IMessageHistory[] = messages.map((message) => {
                const geminiRole = message.role === 'assistant' ? 'model' : 'user';
                return {
                    role: geminiRole,
                    parts: [{ text: message.content }]
                }
            });
            
            console.log(`✅ Service: Final history length: ${history.length}`);
            return history;
            
        } catch (error) {
            console.error('❌ Service Error getting messages by user ID:', error);
            return [];
        }
    }

    public async saveUserMessage(phoneNumber: string, content: string, messageId?: string): Promise<void> {
        try {
            await this.messageDao.createMessage({
                phoneNumber: phoneNumber.trim(),
                role: 'user',
                content,
                messageId,
                status: 'received'
            });
            console.log('💾 Service: Saved user message for', phoneNumber);
        } catch (error) {
            console.error('❌ Service Error saving user message:', error);
        }
    }

    public async updateMessageStatus(messageId: string, status: string): Promise<void> {
        try {
            console.log(`📊 Service: Updating message status for ID: ${messageId} to: ${status}`);
            await this.messageDao.updateMessageStatus(messageId, status);
            console.log(`✅ Service: Message status updated successfully`);
        } catch (error) {
            console.error('❌ Service Error updating message status:', error);
        }
    }

    public async bulkCreateMessages(messages: IMessage[]): Promise<IMessage[]> {
        try {
            return await this.messageDao.bulkCreateMessages(messages);
        } catch (error) {
            console.error('❌ Service Error bulk creating messages:', error);
            throw error;
        }
    }
}