import express from "express";
import { connectToRabbitMQ } from "./config/rabbitMQ.js";
import { config } from "dotenv";

config();
const app = express();

connectToRabbitMQ();

export { app };
