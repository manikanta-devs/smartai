/**
 * AI Career Coach Service
 * Persistent multi-turn conversation with full user context
 * Uses Gemini 1.5 Flash (free tier)
 */

import { genAI } from "../config/gemini.config";
import { prisma } from "../config/prisma";
import { logger } from "../common/utils/logger";

const conversationCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

export interface CoachMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export interface CoachContext {
  name: string;
  resumeScore: number;
  atsScore: number;
  skills: string[];
  experienceYears: number;
  careerLevel: string;
  appliedJobs: number;
  interviewRate: number;
  weakAreas: string[];
  targetRole: string;
  recentAnalysis: {
    matchScore: number;
    verdict: string;
    topGaps: string[];
  } | null;
}

/**
 * Build user context for AI coach
 */
export async function buildUserContext(userId: string): Promise<CoachContext> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      resumes: {
        take: 1,
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!user) {
    throw new Error("User not found");
  }

  // Get user stats
  const resumeCount = await prisma.resume.count({
    where: { userId },
  });

  const appliedCount = await prisma.jobNotification.count({
    where: { userId, notificationSent: true, applied: true },
  });

  const skillGapCount = await prisma.skillGapAnalysis.count({
    where: { userId },
  });

  // Extract resume data if available
  const userResumes = await prisma.resume.findMany({
    where: { userId },
    take: 1,
    orderBy: { createdAt: "desc" }
  });

  const latestResume = userResumes[0];
  const extractedData = latestResume?.extracted ? JSON.parse(latestResume.extracted) : {};

  // Build context object
  return {
    name: user.firstName && user.lastName 
      ? `${user.firstName} ${user.lastName}` 
      : user.email.split('@')[0] || "User",
    resumeScore: latestResume?.overallScore || 0,
    atsScore: latestResume?.atsScore || 0,
    skills: extractedData.skills || [],
    experienceYears: extractedData.years_of_experience || 0,
    careerLevel: extractedData.career_level || "Junior",
    appliedJobs: appliedCount,
    interviewRate: Math.round((appliedCount / Math.max(resumeCount, 1)) * 100),
    weakAreas: extractedData.weak_areas || [],
    targetRole: extractedData.target_role || "Software Engineer",
    recentAnalysis: null, // Can be enhanced with latest analysis
  };
}

/**
 * Send message to AI Career Coach
 */
export async function coachChat(
  userId: string,
  conversationId: string,
  userMessage: string
): Promise<string> {
  try {
    // Get or create conversation
    let conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
          take: 20, // Last 20 messages for context
        },
      },
    });

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          id: conversationId,
          userId,
          messages: {
            create: {
              id: `msg_${Date.now()}`,
              role: "user",
              content: userMessage,
            },
          },
        },
        include: { messages: true },
      });
    } else {
      // Add user message
      await prisma.message.create({
        data: {
          id: `msg_${Date.now()}`,
          conversationId,
          role: "user",
          content: userMessage,
        },
      });
    }

    // Build user context
    const context = await buildUserContext(userId);

    // Build conversation history for AI
    const messageHistory = conversation.messages.map((msg) => ({
      role: msg.role as "user" | "assistant",
      parts: [{ text: msg.content }],
    }));

    // System prompt with full user context
    const systemPrompt = `You are a personal career coach and mentor for ${context.name}.

THEIR PROFILE:
- Current Career Level: ${context.careerLevel}
- Years of Experience: ${context.experienceYears}
- Target Role: ${context.targetRole}
- Resume Score: ${context.resumeScore}/100
- ATS Score: ${context.atsScore}/100
- Top Skills: ${context.skills.slice(0, 5).join(", ")}
- Jobs Applied: ${context.appliedJobs}
- Interview Rate: ${context.interviewRate}%
- Weak Areas to Improve: ${context.weakAreas.join(", ") || "None identified"}

INSTRUCTIONS:
1. Be their personal career advisor - direct, honest, specific
2. Reference their actual profile data in answers
3. Give concrete, actionable advice
4. Be encouraging but realistic
5. If they ask about a specific job/role, reference what you know about them
6. Ask clarifying questions if needed
7. Keep responses concise (2-3 paragraphs max)
8. For technical questions, provide code examples or links when relevant

CONVERSATION CONTEXT:
${messageHistory.length} previous messages in this conversation.
`;

    // Call Gemini API
    const model = genAI.getGenerativeModel({
      model: process.env.GEMINI_MODEL || "gemini-1.5-flash-latest",
      systemInstruction: systemPrompt,
    });

    logger.info("🤖 Coach calling Gemini...");

    const result = await model.generateContent({
      contents: [
        ...messageHistory,
        {
          role: "user",
          parts: [{ text: userMessage }],
        },
      ] as any, // Type assertion due to Gemini API flexibility
    });

    const assistantMessage =
      result.response.candidates?.[0]?.content?.parts?.[0]?.text ||
      "I'm having trouble understanding. Could you rephrase that?";

    // Save assistant response
    await prisma.message.create({
      data: {
        id: `msg_${Date.now()}_response`,
        conversationId,
        role: "assistant",
        content: assistantMessage,
      },
    });

    logger.info("✓ Coach response saved");

    return assistantMessage;
  } catch (error) {
    logger.error("Coach chat failed:", error);
    throw error;
  }
}

/**
 * Get conversation history
 */
export async function getConversationHistory(
  conversationId: string
): Promise<CoachMessage[]> {
  const messages = await prisma.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: "asc" },
  });

  return messages.map((msg) => ({
    role: msg.role as "user" | "assistant",
    content: msg.content,
    timestamp: msg.createdAt,
  }));
}

/**
 * Get all conversations for user
 */
export async function getUserConversations(userId: string) {
  const conversations = await prisma.conversation.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: {
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1, // Last message
      },
    },
  });

  return conversations.map((conv) => ({
    id: conv.id,
    createdAt: conv.createdAt,
    lastMessage: conv.messages[0]?.content || "",
    messageCount: conv.messages.length,
  }));
}

/**
 * Delete conversation
 */
export async function deleteConversation(
  conversationId: string,
  userId: string
): Promise<void> {
  const conv = await prisma.conversation.findUnique({
    where: { id: conversationId },
  });

  if (!conv || conv.userId !== userId) {
    throw new Error("Unauthorized");
  }

  await prisma.message.deleteMany({
    where: { conversationId },
  });

  await prisma.conversation.delete({
    where: { id: conversationId },
  });
}
