import { prisma } from "../../lib/prisma";
import { passwordUtils } from "../../utils/passwordUtils";
import { CustomError } from "../../utils/customError";
import { generateToken } from "../../utils/generateToken";

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
   const token = generateToken(user.id.toString(),user.name);

  return { user, token };
};

export const loginService = async (email: string, password: string) => {
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) throw new CustomError("User not found", 404);

  const isMatch = await passwordUtils.checkPassword(password, user.password);

  if (!isMatch) throw new CustomError("Invalid password", 401);

 const token = generateToken(user.id.toString(),user.name);

  return { user, token };
};
