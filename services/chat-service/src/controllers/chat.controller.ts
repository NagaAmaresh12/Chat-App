import { Request, Response } from "express";
import { Schema } from "mongoose";
export interface AuthRequest extends Request {
  user?: {
    _id: string | Schema.Types.ObjectId;
    email: string;
  };
}
export const getChatsByUserID = async (req: AuthRequest, res: Response) => {};
export const createNewChat = async (req: AuthRequest, res: Response) => {};
export const getChatByChatID = async (req: AuthRequest, res: Response) => {};
export const editChatByChatID = async (req: AuthRequest, res: Response) => {};
export const deleteChatByChatID = async (req: AuthRequest, res: Response) => {};
