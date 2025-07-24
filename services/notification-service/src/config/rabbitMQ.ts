import { Channel, connect } from "amqplib";
import { createTransport } from "nodemailer";
import { AppError } from "../utils/api.error.js";
import { isValid } from "../utils/validation.js";
import { config } from "dotenv";

config();

interface IMailMessage {
  to: string;
  subject: string;
  text: string;
}

const protocol = process.env.RABBITMQ_PROTOCOL!;
const port = Number(process.env.RABBITMQ_PORT);
const hostname = process.env.RABBITMQ_HOSTNAME!;
const username = process.env.RABBITMQ_USERNAME!;
const password = process.env.RABBITMQ_PASSWORD!;

if (
  !isValid(protocol) ||
  !isValid(port) ||
  !isValid(hostname) ||
  !isValid(username) ||
  !isValid(password)
) {
  throw new AppError("Invalid RabbitMQ credentials", 500);
}

export const connectToRabbitMQ = async (): Promise<void> => {
  console.log({
    protocol,
    port,
    hostname,
    username,
    password,
  });

  const connection = await connect({
    protocol,
    port,
    hostname,
    username,
    password,
  });

  const channel: Channel = await connection.createChannel();
  if (!channel) throw new AppError("RabbitMQ channel not initialized", 500);

  await channel.assertQueue("MailQueue", { durable: true });

  await channel.consume("MailQueue", async (message: any): Promise<void> => {
    if (!message) {
      console.error("Message does not exist");
      return;
    }

    const MailMessage: IMailMessage = JSON.parse(message.content.toString());
    console.log("Received Mail Message:", MailMessage);

    const user = process.env.USER;
    const pass = process.env.PASS;

    if (!user || !pass) {
      throw new AppError("Missing email credentials", 500);
    }

    try {
      const transporter = createTransport({
        host: "smtp.gmail.com",
        port: 465,
        secure: true,
        auth: { user, pass },
      });

      const response = await transporter.sendMail(MailMessage);
      console.log("Mail sent successfully:", response);

      channel.ack(message); // ✅ acknowledge only on success
    } catch (error) {
      console.error("Failed to send mail:", error);
      // No ack so message remains in queue
    }
  });
};
