import { Channel, connect } from "amqplib";
import { AppError } from "../utils/ApiError.js";
import { isValid } from "../utils/validation.js";

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
  const connection = await connect({
    protocol,
    port,
    hostname,
    username,
    password,
  });
  channel = await connection.createChannel();
};

export const publishToMailQueue = async (
  message: IMailMessage,
  QueueName: string
) => {
  if (!message || !QueueName) {
    throw new AppError(
      "Invalid values of message and queuename to publish queue"
    );
  }

  const mailMessageBuffer = Buffer.from(JSON.stringify(message)); // ✅ Correct

  await channel.assertQueue(QueueName, {
    durable: true,
  });

  channel.sendToQueue(QueueName, mailMessageBuffer, {
    persistent: true,
  });

  return true;
};
