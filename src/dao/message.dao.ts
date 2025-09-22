import { MessageModel, IMessage } from "../model/message.model";

export class MessageDao {
    private static instance: MessageDao;

    public static getInstance(): MessageDao {
        if (!MessageDao.instance) {
            MessageDao.instance = new MessageDao();
        }
        return MessageDao.instance;
    }

    // Get messages by phone number (user ID)
    public async getMessagesByUserId(phoneNumber: string, limit: number = 20): Promise<IMessage[]> {
        try {
            const messages = await MessageModel
                .find({ phoneNumber })
                .sort({ timestamp: 1 })
                .limit(limit)
                .lean() // Use lean() to get plain objects
                .exec();
            
            // Type assertion with proper typing
            return messages as unknown as IMessage[];
        } catch (error) {
            console.error('❌ Error getting messages by user ID:', error);
            throw error;
        }
    }

    // Save a single message
    public async createMessage(messageData: Partial<IMessage>): Promise<IMessage> {
        try {
            const message = new MessageModel(messageData);
            const savedMessage = await message.save();
            
            // Use toObject() for single document
            return savedMessage.toObject() as IMessage;
        } catch (error) {
            console.error('❌ Error creating message:', error);
            throw error;
        }
    }

    // Save multiple messages - FIXED
    public async bulkCreateMessages(messages: Partial<IMessage>[]): Promise<IMessage[]> {
    try {
        const createdMessages = await MessageModel.insertMany(messages);
        return createdMessages as any; // Simple type assertion
    } catch (error) {
        console.error('❌ Error bulk creating messages:', error);
        throw error;
    }
}


    // Update message status
   public async updateMessageStatus(messageId: string, status: string): Promise<IMessage | null> {
    try {
        console.log(`📊 DAO: Updating message status for ID: ${messageId} to: ${status}`);
        
        const updatedMessage = await MessageModel.findOneAndUpdate(
            { messageId: messageId }, // Fixed: messageId is a string parameter
            { status: status },       // Fixed: status is a string parameter
            { new: true }
        ).exec();
        
        if (updatedMessage) {
            console.log(`✅ DAO: Successfully updated message status`);
        } else {
            console.log(`❌ DAO: Message not found with ID: ${messageId}`);
        }
        
        return updatedMessage as unknown as IMessage | null;
    } catch (error) {
        console.error('❌ DAO Error updating message status:', error);
        throw error;
    }
}

    // Get last message for a user
    public async getLastUserMessage(phoneNumber: string): Promise<IMessage | null> {
        try {
            const message = await MessageModel
                .findOne({ phoneNumber, role: 'user' })
                .sort({ timestamp: -1 })
                .lean() // Use lean() for plain object
                .exec();
            
            return message as unknown as IMessage | null;
        } catch (error) {
            console.error('❌ Error getting last user message:', error);
            throw error;
        }
    }
}