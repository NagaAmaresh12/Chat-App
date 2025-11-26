import jwt from "jsonwebtoken";

export function extractTokenFromCookie(
  cookieHeader?: string
): { accessToken: string | null; refreshToken: string | null } | null {
  if (!cookieHeader) return null;
  const cookies = Object.fromEntries(
    cookieHeader.split(";").map((c) => c.trim().split("="))
  );
  const accessToken = cookies["accessToken"];
  const refreshToken = cookies["refreshToken"];
  console.log({ accessToken, refreshToken });

  return {
    accessToken,
    refreshToken,
  };
}

export function verifyAccessToken(token: string) {
  return jwt.verify(token, process.env.JWT_SECRET_KEY!) as {
    userId: string;
    username: string;
    email: string;
    tokenType: string;
  };
}
