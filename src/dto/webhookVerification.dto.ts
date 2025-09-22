export interface WebhookVerificationDto {
    mode: string;
    challenge: string;
    verify_token: string;
}

export interface WebhookVerificationResponseDto {
    status: boolean;
    challenge: string;
    message: string;
}


export interface WebhookMessageDto {
    object: string;
    entry: Array<{
        id: string;
        changes: Array<{
            value: {
                messaging_product: string;
                metadata: {
                    display_phone_number: string;
                    phone_number_id: string;
                };
                contacts?: Array<{
                    profile: {
                        name: string;
                    };
                    wa_id: string;
                }>;
                messages?: Array<{
                    from: string;
                    id: string;
                    timestamp: string;
                    text?: {
                        body: string;
                    };
                    type: string;
                }>;
                statuses?: Array<{  // ✅ Add statuses typing
                    id: string;
                    status: string;
                    timestamp: string;
                    recipient_id: string;
                    conversation?: object;
                    pricing?: object;
                }>;
            };
            field: string;
        }>;
    }>;
}

// ... rest of your existing DTOs