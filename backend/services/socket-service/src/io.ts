import { Server } from "socket.io";
import { extractTokenFromCookie, verifyAccessToken } from "./utils/verifyToken";

export function initSocketServer(httpServer: any) {
  const CLIENT_URL = process.env.CLIENT_URL;
  console.log("Clinet URL", { CLIENT_URL });

  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      credentials: true,
    },
  });

  // Authentication middleware
  io.use((socket, next) => {
    const cookieHeader = socket.request.headers.cookie;
    // console.log({ cookieHeader });

    const tokens = extractTokenFromCookie(cookieHeader);
    const accessToken = tokens?.accessToken;
    const refreshToken = tokens?.refreshToken;
    // console.log({ accessToken, refreshToken });

    if (!accessToken) return next(new Error("Unauthorized"));

    try {
      const user = verifyAccessToken(accessToken);
      console.log("user from token", { user });

      socket.data.user = user;
      next();
    } catch {
      next(new Error("Invalid token"));
    }
  });

  return io;
}
