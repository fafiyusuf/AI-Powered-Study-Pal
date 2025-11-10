import { auth } from "../lib/auth.js";
import { Request, Response, NextFunction } from "express";
import { fromNodeHeaders } from "better-auth/node";
import { prisma } from "../lib/prisma";

declare global {
  namespace Express {
    interface Request {
      user?: any; // You can type this better if you know the structure
    }
  }
}

export const verifyUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const session = await auth.api.getSession({
    headers: fromNodeHeaders(req.headers),
  });

  if (!session)
    return res.status(401).json({ error: "Access Denied. No token provided." });

  req.user = session.user;
  next();
};

// export const verifyCompanyAccess = async (
//   req: Request,
//   res: Response,
//   next: NextFunction
// ) => {
//   const session = await auth.api.getSession({
//     headers: fromNodeHeaders(req.headers),
//   });

//   if (!session || !session.user?.id) {
//     return res.status(401).json({ error: "Access Denied. Not authenticated." });
//   }

//   const userId = session.user.id;

//   // Fetch the company that belongs to this user
//   const company = await prisma.company.findUnique({
//     where: {
//       userId: userId,
//     },
//   });

//   if (!company) {
//     return res.status(403).json({
//       error: "Access Denied. No company profile found for this user.",
//     });
//   }

//   // Attach to request for use in routes/controllers
//   req.user = session.user;
//   req.user.companyId = company.id;

//   // If this request is trying to access a companyId from params/body/query, verify ownership
//   const requestedCompanyId =
//     req.user.companyId || req.body.companyId || req.query.companyId;

//   if (requestedCompanyId && requestedCompanyId !== company.id) {
//     return res
//       .status(403)
//       .json({ error: "Access Denied. You do not own this company." });
//   }

//   next();
// };
// export const verifyInternAccess = async (
//   req: Request,
//   res: Response,
//   next: NextFunction
// ) => {
//   const session = await auth.api.getSession({
//     headers: fromNodeHeaders(req.headers),
//   });

//   if (!session || !session.user?.id) {
//     return res
//       .status(401)
//       .json({ error: "Access Denied. Not authenticated." });
//   }

//   const userId = session.user.id;

//   const intern = await prisma.intern.findUnique({
//     where: {
//       userId: userId,
//     },
//   });

//   if (!intern) {
//     return res.status(403).json({
//       error: "Access Denied. No intern profile found for this user.",
//     });
//   }


//   req.user = session.user;
//   req.user.internId = intern.id;

  
//   const requestedInternId =
//     req.params.internId || req.body.internId || req.query.internId;

//   if (requestedInternId && requestedInternId !== intern.id) {
//     return res
//       .status(403)
//       .json({ error: "Access Denied. You do not own this intern profile." });
//   }

//   next();
// };

