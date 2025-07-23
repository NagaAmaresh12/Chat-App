import { Channel, connect } from "amqplib";
import { createTransport } from "nodemailer";
import { AppError } from "../utils/ApiError.js";
import { isValid } from "../utils/validation.js";
import { config } from "dotenv";
config({
  override: true,
});
interface IMailMessage {
  to: string;
  subject: string;
  text: string;
}

const protocol = process.env.PROTOCOL as string;
const port = Number(process.env.PORT) as number;
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

export const connectToRabbitMQ = async (): Promise<void> => {
  const connection = await connect({
    protocol,
    port,
    hostname,
    username,
    password,
  });
  const channel: Channel = await connection.createChannel();

  await channel.assertQueue("MailQueue", {
    durable: true,
  });
  await channel.consume("MailQueue", async (message: any): Promise<void> => {
    if (!message) {
      throw new Error("Message Does not Exists");
    }
    const MailMessage = JSON.parse(message.context.toString());
    console.log("mail message", MailMessage);

    const username = process.env.username;
    const password = process.env.password;
    const transporter = createTransport({
      host: "smtp.mail.com",
      port: 465,
      auth: {
        user: username,
        pass: password,
      },
    });
    const response = await transporter.sendMail(MailMessage);
    console.log("response of mail", response);
  });
};
