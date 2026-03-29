import { Request, Response, NextFunction } from "express";
import { prisma } from "../../config/prisma";
import { HttpError } from "../../common/middleware/error.middleware";
import { z } from "zod";

const updateProfileSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  avatar: z.string().optional()
});

export const getProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new HttpError(401, "Unauthorized");

    const user = await prisma.user.findUniqueOrThrow({
      where: { id: req.user.userId },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        avatar: true,
        role: true,
        createdAt: true
      }
    });

    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new HttpError(401, "Unauthorized");

    const data = updateProfileSchema.parse(req.body);

    const user = await prisma.user.update({
      where: { id: req.user.userId },
      data,
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        avatar: true,
        role: true
      }
    });

    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

export const getUserStats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new HttpError(401, "Unauthorized");

    const [resumeCount, applicationCount] = await Promise.all([
      prisma.resume.count({ where: { userId: req.user.userId } }),
      prisma.application.count({ where: { userId: req.user.userId } })
    ]);

    res.json({
      success: true,
      data: {
        resumeCount,
        applicationCount,
        memberSince: new Date(),
        plan: req.user.role
      }
    });
  } catch (error) {
    next(error);
  }
};
