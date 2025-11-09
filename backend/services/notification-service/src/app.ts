import express from "express";
import { connectToRabbitMQ } from "./config/rabbitMQ.js";
import { config } from "dotenv";

config();
const app = express();
app.get("/health",(req,res)=>{
    res.json({
        message:"Notification Service is Working"
    })
})
connectToRabbitMQ();

export { app };
