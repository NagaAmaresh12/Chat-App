import axios from "axios";

const CHATS_SERVICE = process.env.CHATS_SERVICE! || "http://localhost:3002";
// 🔍 Helper function to safely verify chat access
async function verifyChatAccess(
  chatType: "private" | "group",
  chatId: string,
  headers: Record<string, any>
): Promise<boolean> {
  console.log("====================================");
  console.log({ chatType, chatId, CHATS_SERVICE });
  console.log("====================================");
  try {
    const res = await axios.get(`${CHATS_SERVICE}/${chatType}-chat/${chatId}`, {
      headers,
    });
    console.log("====================================");
    console.log({ res });
    console.log("====================================");
    return res.data?.status === "success";
  } catch (err: any) {
    const status = err.response?.status;
    if (status === 403) return false; // forbidden → not a member
    if (status === 404) return false; // not found → try next type
    console.warn(`⚠️ Chat access check failed for ${chatType}:`, err.message);
    return false;
  }
}
export { verifyChatAccess };
