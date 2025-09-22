import mongoose, { Schema, Document } from 'mongoose';

export interface IMessage extends Document {
    phoneNumber: string;
    role: 'user' | 'assistant'; // Fixed: use 'assistant' instead of 'model'
    content: string;
    timestamp: Date;
    messageId?: string;
    status?: string;
}

const MessageSchema: Schema = new Schema({
    phoneNumber: { type: String, required: true, index: true },
    role: { type: String, enum: ['user', 'assistant'], required: true }, // Fixed enum
    content: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    messageId: { type: String },
    status: { type: String }
});

MessageSchema.index({ phoneNumber: 1, timestamp: 1 });

export const MessageModel = mongoose.model<IMessage>('Message', MessageSchema);