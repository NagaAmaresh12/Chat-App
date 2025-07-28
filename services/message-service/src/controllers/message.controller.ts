import { Request, Response } from "express";
export interface AuthRequest extends Request {
  user?: any;
}
export const getMessageBymsgID = async (req: AuthRequest, res: Response) => {};
export const getMsgStatusByMsgID = async (
  req: AuthRequest,
  res: Response
) => {};
export const postReactionsBymsgID = async (
  req: AuthRequest,
  res: Response
) => {};
export const forwardMsgByMessageID = async (
  req: AuthRequest,
  res: Response
) => {};
export const replyMsgByMessageID = async (
  req: AuthRequest,
  res: Response
) => {};
export const editMessageByMsgID = async (req: AuthRequest, res: Response) => {};
export const deleteMessageByMsgID = async (
  req: AuthRequest,
  res: Response
) => {};
export const getMessagesByChatID = async (
  req: AuthRequest,
  res: Response
) => {};
export const createNewMessage = async (req: AuthRequest, res: Response) => {};
export const getMessageThreadByMsgID = async (
  req: AuthRequest,
  res: Response
) => {};
