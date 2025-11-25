import jwt from "jsonwebtoken";
import { prisma } from "../../lib/prisma";
import { CustomError } from "../../utils/customError";
import { generateRefreshToken } from "../../utils/generateRefreshToken";
import { generateToken } from "../../utils/generateToken";
import { passwordUtils } from "../../utils/passwordUtils";

export const registerService = async (name: string, email: string, password: string) => {
  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) throw new CustomError("Email already exists", 400);

  const hashed = await passwordUtils.hashPassword(password);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashed,
    },
  });
  const token = generateToken(user.id.toString(), user.name);
  const refreshToken = generateRefreshToken(user.id.toString());
  await prisma.user.update({ where: { id: user.id }, data: { refreshToken } });
  return { user, token, refreshToken };
};

export const loginService = async (email: string, password: string) => {
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) throw new CustomError("User not found", 404);

  const isMatch = await passwordUtils.checkPassword(password, user.password);

  if (!isMatch) throw new CustomError("Invalid password", 401);

  const token = generateToken(user.id.toString(), user.name);
  const refreshToken = generateRefreshToken(user.id.toString());
  await prisma.user.update({ where: { id: user.id }, data: { refreshToken } });
  return { user, token, refreshToken };
};

export const refreshTokenService = async (incomingRefreshToken: string) => {
  if (!incomingRefreshToken) throw new CustomError("Refresh token required", 400);
  let decoded: any;
  try {
    decoded = jwt.verify(incomingRefreshToken, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET!);
  } catch {
    throw new CustomError("Invalid refresh token", 401);
  }
  const userId = String(decoded?.id || "");
  if (!userId) throw new CustomError("Invalid refresh token payload", 401);
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || user.refreshToken !== incomingRefreshToken) {
    throw new CustomError("Refresh token not recognized", 401);
  }
  const token = generateToken(user.id.toString(), user.name);
  // Rotate refresh token for security
  const newRefreshToken = generateRefreshToken(user.id.toString());
  await prisma.user.update({ where: { id: user.id }, data: { refreshToken: newRefreshToken } });
  return { user, token, refreshToken: newRefreshToken };
};
