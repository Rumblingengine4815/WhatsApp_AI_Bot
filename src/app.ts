import express from "express";
import axios from "axios";
import { MessageController } from "./controller/message.controller";
import { WebhookController } from "./controller/webhook.controller";

const app = express();
app.use(express.json());

const messageController = new MessageController();
const webhookController = new WebhookController();

app.post("/send-message", messageController.sendMessage);
app.get("/webhook", webhookController.webhook); // Added GET route for webhook verification
app.post("/webhook", webhookController.webhookMessage);

app.get("/health", (req, res) => {
    res.send("Server is healthy");
});

app.listen(8558, () => {
    console.log("Server is running on port 8558");
});