import express from "express";
import { MessageController } from "./controller/message.controller";
import { WebhookController } from "./controller/webhook.controller";
import mongoose from "mongoose";
import { APP_CONFIG } from "./config/app.config";

const app = express();
app.use(express.json());

const messageController = new MessageController();
const webhookController = new WebhookController();

//app.post("/send-message", messageController.sendMessage);

//to subscribe webhook
app.get("/webhook", webhookController.webhook);

//to handle receiving messages
app.post("/webhook", webhookController.webhookMessage);

app.get('/health',(req,res)=>{
    res.send('Healthy Server');
});

mongoose.connect(APP_CONFIG.MONGO_URI).then(()=>{
    console.log('Connected to MongoDB');
    app.listen(8558, () => {
        console.log("Server is running on port 8558");
    });
}).catch((err)=>{
    console.log(err);
});
