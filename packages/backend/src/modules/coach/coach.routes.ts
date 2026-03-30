/**
 * Career Coach Routes
 * AI Chat with full user context awareness
 */

import { Router, Request, Response } from "express";
import { requireAuth } from "../../common/middleware/auth.middleware";
import { asyncHandler } from "../../common/utils/errors";
import { createSuccessResponse, createErrorResponse } from "../../common/schemas";
import {
  coachChat,
  getConversationHistory,
  getUserConversations,
  deleteConversation,
} from "../../services/careerCoach.service";

const router = Router();

/**
 * POST /api/coach/message
 * Send message to career coach and get response
 */
router.post(
  "/message",
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const { message, conversationId } = req.body;

    if (!message || typeof message !== "string" || message.trim().length < 5) {
      return res.status(400).json(
        createErrorResponse("Message must be at least 5 characters", [
          { field: "message", message: "Required" },
        ])
      );
    }

    if (!conversationId) {
      return res.status(400).json(
        createErrorResponse("Conversation ID is required", [
          { field: "conversationId", message: "Required" },
        ])
      );
    }

    // Get coach response
    const userId = (req.user as any)?.userId || (req.user as any)?.id || "";
    if (!userId) {
      return res.status(401).json(createErrorResponse("Unauthorized", []));
    }
    const response = await coachChat(
      userId,
      conversationId,
      message.trim()
    );

    return res.json(
      createSuccessResponse({
        message: response,
        conversationId,
        timestamp: new Date(),
      })
    );
  })
);

/**
 * GET /api/coach/conversations
 * Get all conversations for user
 */
router.get(
  "/conversations",
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const conversations = await getUserConversations((req.user as any)?.userId || (req.user as any)?.id || "");

    return res.json(
      createSuccessResponse({
        conversations,
        total: conversations.length,
      })
    );
  })
);

/**
 * GET /api/coach/conversations/:conversationId
 * Get full conversation history
 */
router.get(
  "/conversations/:conversationId",
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const messages = await getConversationHistory(req.params.conversationId);

    return res.json(
      createSuccessResponse({
        messages,
        total: messages.length,
      })
    );
  })
);

/**
 * DELETE /api/coach/conversations/:conversationId
 * Delete a conversation
 */
router.delete(
  "/conversations/:conversationId",
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    await deleteConversation(req.params.conversationId, (req.user as any)?.userId || (req.user as any)?.id || "");

    return res.json(
      createSuccessResponse({
        deleted: true,
      })
    );
  })
);

export default router;
