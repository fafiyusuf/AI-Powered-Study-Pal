import jwt from "jsonwebtoken";

interface TokenPayload {
  id: string;
  username: string;
}

export const generateToken = (id: string, username: string) => {
  const payload: TokenPayload = { id, username };

  return jwt.sign(payload, process.env.JWT_SECRET!, {
    expiresIn: "7d", // token valid for 7 days
  });
};
