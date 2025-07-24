import { Channel, connect } from "amqplib";
import { AppError } from "../utils/ApiError.js";
import { isValid } from "../utils/validation.js";
import { config } from "dotenv";
config();
interface IMailMessage {
  to: string;
  subject: string;
  text: string;
}

const protocol = process.env.PROTOCOL as string;
const port = Number(process.env.RABBITMQ_PORT) as number;
const hostname = process.env.HOSTNAME as string;
const username = process.env.USERNAME as string;
const password = process.env.PASSWORD as string;
console.log({
  protocol,
  port,
  hostname,
  username,
  password,
});

if (
  !isValid(protocol) ||
  !isValid(port) ||
  !isValid(hostname) ||
  !isValid(username) ||
  !isValid(password)
) {
  throw new AppError("Invalid Credentials of RabbitMQ", 500);
}

let channel: Channel;

export const connectToRabbitMQ = async (): Promise<void> => {
  try {
    const connection = await connect({
      protocol,
      port,
      hostname,
      username,
      password,
    });
    console.log("✅ RabbitMQ connected");

    channel = await connection.createChannel();
    console.log("✅ Channel created");
  } catch (err) {
    console.error("❌ Failed to connect to RabbitMQ", err);
    throw new AppError("RabbitMQ connection failed", 500);
  }
};

export const publishToMailQueue = async (
  message: IMailMessage,
  QueueName: string
) => {
  console.log({
    protocol,
    port,
    hostname,
    username,
    password,
  });

  if (!message || !QueueName) {
    throw new AppError(
      "Invalid values of message and queuename to publish queue"
    );
  }

  const mailMessageBuffer = Buffer.from(JSON.stringify(message)); // ✅ Correct
  console.log({
    mailMessageBuffer,
    QueueName,
  });

  if (!mailMessageBuffer) {
    throw new AppError("Failed to Get mailMessageBuffer", 500);
  }
  try {
    if (!channel) {
      throw new AppError("RabbitMQ channel not initialized", 500);
    }
    await channel.assertQueue(QueueName, {
      durable: true,
    });

    channel.sendToQueue(QueueName, mailMessageBuffer, {
      persistent: true,
    });

    return true;
  } catch (error) {
    console.error("❌ Failed to publish message to queue:", error);
    return false;
  }
};
