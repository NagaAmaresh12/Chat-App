// src/services/chat/sendChatMessage.ts

import { sendMessage } from "@/services/socket/events/messageEvents.ts";
import type { SendMessagePayload } from "@/types/socketTypes";

export function sendChatPayload(payload: SendMessagePayload) {
  sendMessage(payload);
}
