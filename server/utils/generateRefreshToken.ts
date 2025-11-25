import jwt, { type Secret, type SignOptions } from "jsonwebtoken";

interface RefreshPayload {
  id: string;
}

export const generateRefreshToken = (id: string) => {
  const payload: RefreshPayload = { id };
  const secret: Secret = (process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET)!;
  const expiresSeconds = Number(process.env.REFRESH_EXPIRES_IN || 60 * 60 * 24 * 30);
  const options: SignOptions = { expiresIn: expiresSeconds };
  return jwt.sign(payload, secret, options);
};
