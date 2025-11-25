import { NextFunction, Request, Response } from "express";
import { loginService, refreshTokenService, registerService } from "./auth.service";

export const registerUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, email, password } = req.body;

    const data = await registerService(name, email, password);

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data,
    });

  } catch (err) {
    next(err);
  }
};

export const loginUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;

    const data = await loginService(email, password);

    res.json({
      success: true,
      message: "Login successful",
      data,
    });

  } catch (err) {
    next(err);
  }
};

export const refreshTokenHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = req.body as { refreshToken: string };
    const data = await refreshTokenService(refreshToken);
    res.json({ success: true, message: "Token refreshed", data });
  } catch (err) {
    next(err);
  }
};
