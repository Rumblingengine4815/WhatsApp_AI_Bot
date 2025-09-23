# 🤖 WhatsApp AI Chatbot — Gemini Integration

A powerful WhatsApp Business chatbot powered by **Google Gemini** with conversation memory, **MongoDB** storage, and real-time messaging via the **WhatsApp Business API**.

---

## 🚀 Quick overview

**Features**
- 🤖 AI-powered replies using Google Gemini
- 💬 Conversation memory persisted in MongoDB
- 📱 Real-time messaging through WhatsApp Business API (Meta)
- ⚡ Built with **TypeScript**, **Express.js** and modular services
- 🌐 Easy local testing using **ngrok** for webhook tunneling
- 🔒 Webhook verification, input validation, and error handling

**Architecture**

```
WhatsApp User → Meta Webhook → Express Server → Gemini AI → Response → WhatsApp User
                                      ↓
                                MongoDB (Conversation History)
```

---

## 📋 Prerequisites

- Node.js v16+
- npm or pnpm
- MongoDB Atlas account (or local MongoDB)
- Meta Developer account with WhatsApp Business API access (Phone Number ID & Access Token)
- Google AI Studio account and Gemini API key
- **ngrok** (for exposing localhost to Meta during development)

---

## 🔧 Installation

```bash
# clone
git clone https://github.com/yourusername/whatsapp-ai-bot.git
cd whatsapp-ai-bot

# install deps
npm install

# copy example env
cp .env.example .env

# dev server
npm run dev

# expose server to Meta with ngrok
ngrok http 8558
```

After starting ngrok, copy the HTTPS forwarding URL and set it as your webhook URL in the Meta Developer Portal.

---

## ⚙️ Environment variables (.env)

Create a `.env` file using `.env.example` and provide the values below:

```env
# Server
PORT=8558

# WhatsApp Business API (Meta)
WHATSAPP_USER_ACCESS_TOKEN=your_whatsapp_access_token
PHONE_NUMBER_ID=your_phone_number_id
WEBHOOK_VERIFICATION_PASSWORD=your_verification_password
VERSION=v23.0

# Google Gemini
GEMINI_API_KEY=your_gemini_api_key

# MongoDB
MONGODB_URI=**given uri**

# Debug
DEBUG=true
```

### `.env.example`

```env
# Server configuration
PORT=8558

# WhatsApp Business API
WHATSAPP_USER_ACCESS_TOKEN=your_whatsapp_access_token
PHONE_NUMBER_ID=your_phone_number_id
WEBHOOK_VERIFICATION_PASSWORD=your_webhook_token
VERSION=v23.0

# Gemini API
GEMINI_API_KEY=your_gemini_api_key

# MongoDB
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database

# Development
DEBUG=true
```

---

## 🔐 Webhook verification (example)

Meta will call your `/webhook` endpoint to verify your server. Example verification GET:

```
GET /webhook?hub.mode=subscribe&hub.challenge=123&hub.verify_token=your_token
```

Implement verification logic in your controller to return the `hub.challenge` when `hub.verify_token` matches `WEBHOOK_VERIFICATION_PASSWORD`.

---

## 📬 API Endpoints

- `GET  /webhook` — Webhook verification (Meta)
- `POST /webhook` — Message webhook (incoming messages from Meta)
- `GET  /debug/messages` — Admin: view messages in MongoDB

**Message webhook payload** matches Meta's WhatsApp Business format. The server should parse entries, extract sender, message content, and message id, then forward context to Gemini and persist conversation.

---

## 💡 Usage examples

**Simple conversation flow**

```
User: Hello!
Model: Hello! How can I assist you today? 😊

User: Remember I like pizza
Model: Got it — I'll remember you like pizza 🍕

User: What do I like?
Mdel: You told me you like pizza! 🍕
```

**Notes**
- The bot stores message history in MongoDB so Gemini can be provided prior conversation context.
- Implement character chunking or summarization for very long histories to stay within Gemini token limits.

---

## 🏗️ Project structure

```
src/
├── config/        # Configuration (env, constants)
├── controller/    # Express route handlers (webhook, debug)
├── service/       # Business logic (GeminiService, WhatsAppService, MessageService)
├── dao/           # Data access objects (MongoDB operations)
├── model/         # Mongoose models (Message, Conversation, User)
├── dto/           # DTOs and input validation
└── app.ts         # Express app + middleware
```

---

## 🔄 Flow explanation

1. User sends message to given WhatsApp number.
2. Meta sends a webhook POST to your server `/webhook`.
3. Server validates and persists incoming message to MongoDB.
4. Server builds context (recent messages, user profile), calls Gemini API via `GeminiService`.
5. Gemini returns a reply. Server persists reply and sends it back to user using the WhatsApp API.
6. Delivery/read statuses from Meta are stored for audit/analytics.

---

## 🛠️ Development scripts

```json
// package.json (scripts)
{
  "dev": "ts-node-dev --respawn --transpile-only src/app.ts",
  "build": "tsc",
  "start": "node dist/app.js",
  "test": "jest"
}
```

---

## ⚠️ Troubleshooting

**Webhook verification fails**
- Ensure `WEBHOOK_VERIFICATION_PASSWORD` matches your Meta app settings
- Server must be publicly reachable (use **ngrok** for local dev)

**Gemini errors**
- Verify `GEMINI_API_KEY` and quotas/permissions in Google AI Studio

**MongoDB connection issues**
- Verify `MONGODB_URI`, network access (IP whitelist) and credentials

**WhatsApp message sending fails**
- Renew access token if expired
- Confirm `PHONE_NUMBER_ID` and correct Graph API version

Enable `DEBUG=true` for verbose logs during development.

---

## 🔒 Security & best practices

- Never commit `.env` or secret keys to Git
- Validate and sanitize incoming webhook payloads
- Use HTTPS for production endpoints
- Rotate API keys and tokens regularly
- Limit stored PII and follow local privacy laws

---

## 🤝 Contributing

1. Fork the repo
2. Create branch: `git checkout -b feature/awesome`
3. Commit: `git commit -m "Add awesome feature"`
4. Push: `git push origin feature/awesome`
5. Open a Pull Request — describe changes and test plan

Please follow the code style (Prettier/ESLint) and add unit tests for new features.

---

## 📄 License

This project is licensed under the **MIT License**. See `LICENSE`.

---

## 🙏 Acknowledgments

- Google Gemini (Google AI)
- Meta (WhatsApp Business API)
- MongoDB
- Express.js and the TypeScript community
- **ngrok** for making local development easy

---

## 📞 Support

If you need help:
- Open an issue in this repository
- Include logs, reproducible steps, and relevant `.env` placeholders (never real secrets)

---

