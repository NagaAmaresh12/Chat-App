import axios from "axios";
import { Request, Response } from "express";
import { Chat } from "../models/chat.model.js";
import { Schema } from "mongoose";
import { isValid, sendError, sendSuccess } from "../utils/index.js";
export interface AuthRequest extends Request {
  user?: any;
}
const USER_SERVICE = process.env.USER_SERVICE!;
export const createNewSingleChat = async (req: AuthRequest, res: Response) => {
  const { receiverId, initialMessage } = req.body;
  const senderId = req.user.id;
  console.log({
    senderId,
    receiverId,
    initialMessage,
  });

  if (!isValid(senderId) || !isValid(receiverId) || !isValid(initialMessage)) {
    return sendError(res, "Invalid inputs", 400);
  }
  console.log({
    USER_SERVICE,
  });

  if (!USER_SERVICE) {
    sendError(res, "Invalid USER_SERVICE endpoint", 500);
  }

  const { data } = await axios.get(`${USER_SERVICE}/people/${receiverId}`, {
    headers: {
      Authorization: `Bearer ${
        req?.cookies?.accessToken || req?.cookies?.refreshToken
      }`,
    },
  });
  const receiver = data?.data;
  console.log({
    receiver,
  });

  if (!receiver) {
    return sendError(res, "Receiver does not exists", 400);
  }
  let chat;
  try {
    chat = await Chat.findOne(senderId, receiverId);
    if (!chat) {
      chat = await Chat.create({
        participants: [
          {
            user: senderId,
            role: "admin",
          },
          {
            user: receiverId,
            role: "member",
          },
        ],
        lastMessage: "",
      });
    }
  } catch (error) {
    return sendError(res, "Failed to create new Chat", 500, error);
  }
  chat.lastMessage = initialMessage;
  await chat.save();
  return sendSuccess(res, "Chat Created Successfully");
};
export const getSingleChatsByUserID = async (
  req: AuthRequest,
  res: Response
) => {};

export const getSingleChatByChatID = async (
  req: AuthRequest,
  res: Response
) => {};
export const editSingleChatByChatID = async (
  req: AuthRequest,
  res: Response
) => {};
export const deleteSingleChatByChatID = async (
  req: AuthRequest,
  res: Response
) => {};
