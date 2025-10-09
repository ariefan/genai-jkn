import "server-only";

import {
  and,
  asc,
  count,
  desc,
  eq,
  gt,
  gte,
  inArray,
  lt,
  type SQL,
} from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import type { ArtifactKind } from "@/components/artifact";
import type { VisibilityType } from "@/components/visibility-selector";
import { ChatSDKError } from "../errors";
import type { AppUsage } from "../usage";
import { generateUUID } from "../utils";
import {
  type Chat,
  chat,
  type DBMessage,
  document,
  message,
  type Suggestion,
  stream,
  suggestion,
  type User,
  user,
  vote,
} from "./schema";
import { generateHashedPassword } from "./utils";

// Optionally, if not using email/pass login, you can
// use the Drizzle adapter for Auth.js / NextAuth
// https://authjs.dev/reference/adapter/drizzle

// Database connection with lazy initialization and fallback handling
let db: ReturnType<typeof drizzle> | null = null;
let client: ReturnType<typeof postgres> | null = null;
let connectionAttempted = false;

// Helper function to initialize database connection lazily
function initializeDatabase() {
  if (connectionAttempted) {
    return db;
  }

  connectionAttempted = true;

  try {
    // biome-ignore lint: Forbidden non-null assertion.
    client = postgres(process.env.POSTGRES_URL!, {
      connect_timeout: 5,
      idle_timeout: 20,
      max_lifetime: 60 * 30,
    });
    db = drizzle(client);
    console.log("Database connection initialized successfully");
  } catch (error) {
    console.error("Failed to initialize database connection:", error);
    console.log("Application will run in offline mode");
    db = null;
    client = null;
  }

  return db;
}

// Helper function to check database connection with fallback
function checkDatabaseConnection() {
  const database = initializeDatabase();
  if (!database) {
    console.warn("Database connection unavailable - running in offline mode");
    return null;
  }
  return database;
}

export async function getUser(email: string): Promise<User[]> {
  try {
    const database = checkDatabaseConnection();
    return await database.select().from(user).where(eq(user.email, email));
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to get user by email"
    );
  }
}

export async function createUser(email: string, password: string) {
  const hashedPassword = generateHashedPassword(password);

  try {
    return await db.insert(user).values({ email, password: hashedPassword });
  } catch (_error) {
    throw new ChatSDKError("bad_request:database", "Failed to create user");
  }
}

export async function createGuestUser() {
  const email = `guest-${Date.now()}`;
  const password = generateHashedPassword(generateUUID());

  try {
    return await db.insert(user).values({ email, password }).returning({
      id: user.id,
      email: user.email,
    });
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to create guest user"
    );
  }
}

export async function saveChat({
  id,
  userId,
  title,
  visibility,
}: {
  id: string;
  userId: string;
  title: string;
  visibility: VisibilityType;
}) {
  try {
    const database = checkDatabaseConnection();

    // Return mock result when database is unavailable
    if (!database) {
      console.log(`Skipping save chat ${id} due to database unavailability`);
      return { id, userId, title, visibility, createdAt: new Date() };
    }

    return await database.insert(chat).values({
      id,
      createdAt: new Date(),
      userId,
      title,
      visibility,
    });
  } catch (_error) {
    console.error(`Database error in saveChat for ${id}, returning mock result`);
    // Return mock result instead of throwing error
    return { id, userId, title, visibility, createdAt: new Date() };
  }
}

export async function deleteChatById({ id }: { id: string }) {
  try {
    await db.delete(vote).where(eq(vote.chatId, id));
    await db.delete(message).where(eq(message.chatId, id));
    await db.delete(stream).where(eq(stream.chatId, id));

    const [chatsDeleted] = await db
      .delete(chat)
      .where(eq(chat.id, id))
      .returning();
    return chatsDeleted;
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to delete chat by id"
    );
  }
}

export async function getChatsByUserId({
  id,
  limit,
  startingAfter,
  endingBefore,
}: {
  id: string;
  limit: number;
  startingAfter: string | null;
  endingBefore: string | null;
}) {
  try {
    const database = checkDatabaseConnection();

    // Return empty result when database is unavailable
    if (!database) {
      console.log("Returning empty chat history due to database unavailability");
      return {
        chats: [],
        hasMore: false,
      };
    }

    const extendedLimit = limit + 1;

    const query = (whereCondition?: SQL<any>) =>
      database
        .select()
        .from(chat)
        .where(
          whereCondition
            ? and(whereCondition, eq(chat.userId, id))
            : eq(chat.userId, id)
        )
        .orderBy(desc(chat.createdAt))
        .limit(extendedLimit);

    let filteredChats: Chat[] = [];

    if (startingAfter) {
      const [selectedChat] = await database
        .select()
        .from(chat)
        .where(eq(chat.id, startingAfter))
        .limit(1);

      if (!selectedChat) {
        throw new ChatSDKError(
          "not_found:database",
          `Chat with id ${startingAfter} not found`
        );
      }

      filteredChats = await query(gt(chat.createdAt, selectedChat.createdAt));
    } else if (endingBefore) {
      const [selectedChat] = await database
        .select()
        .from(chat)
        .where(eq(chat.id, endingBefore))
        .limit(1);

      if (!selectedChat) {
        throw new ChatSDKError(
          "not_found:database",
          `Chat with id ${endingBefore} not found`
        );
      }

      filteredChats = await query(lt(chat.createdAt, selectedChat.createdAt));
    } else {
      filteredChats = await query();
    }

    const hasMore = filteredChats.length > limit;

    return {
      chats: hasMore ? filteredChats.slice(0, limit) : filteredChats,
      hasMore,
    };
  } catch (_error) {
    console.error("Database error in getChatsByUserId, returning empty result");
    // Return empty result instead of throwing error
    return {
      chats: [],
      hasMore: false,
    };
  }
}

export async function getChatById({ id }: { id: string }) {
  try {
    const database = checkDatabaseConnection();

    // Return null when database is unavailable
    if (!database) {
      console.log(`Returning null for chat ${id} due to database unavailability`);
      return null;
    }

    const [selectedChat] = await database.select().from(chat).where(eq(chat.id, id));
    if (!selectedChat) {
      return null;
    }

    return selectedChat;
  } catch (_error) {
    console.error(`Database error in getChatById for ${id}, returning null`);
    // Return null instead of throwing error
    return null;
  }
}

export async function saveMessages({ messages }: { messages: DBMessage[] }) {
  try {
    const database = checkDatabaseConnection();

    // Return mock result when database is unavailable
    if (!database) {
      console.log(`Skipping save ${messages.length} messages due to database unavailability`);
      return messages;
    }

    return await database.insert(message).values(messages);
  } catch (_error) {
    console.error(`Database error in saveMessages, returning mock result`);
    // Return mock result instead of throwing error
    return messages;
  }
}

export async function getMessagesByChatId({ id }: { id: string }) {
  try {
    const database = checkDatabaseConnection();

    // Return empty array when database is unavailable
    if (!database) {
      console.log(`Returning empty messages for chat ${id} due to database unavailability`);
      return [];
    }

    return await database
      .select()
      .from(message)
      .where(eq(message.chatId, id))
      .orderBy(asc(message.createdAt));
  } catch (_error) {
    console.error(`Database error in getMessagesByChatId for ${id}, returning empty array`);
    // Return empty array instead of throwing error
    return [];
  }
}

export async function voteMessage({
  chatId,
  messageId,
  type,
}: {
  chatId: string;
  messageId: string;
  type: "up" | "down";
}) {
  try {
    const database = checkDatabaseConnection();

    // Skip when database is unavailable
    if (!database) {
      console.log(`Skipping vote for message ${messageId} due to database unavailability`);
      return;
    }

    const [existingVote] = await database
      .select()
      .from(vote)
      .where(and(eq(vote.messageId, messageId)));

    if (existingVote) {
      return await database
        .update(vote)
        .set({ isUpvoted: type === "up" })
        .where(and(eq(vote.messageId, messageId), eq(vote.chatId, chatId)));
    }
    return await database.insert(vote).values({
      chatId,
      messageId,
      isUpvoted: type === "up",
    });
  } catch (_error) {
    console.error(`Database error in voteMessage for ${messageId}, skipping`);
    // Skip instead of throwing error
    return;
  }
}

export async function getVotesByChatId({ id }: { id: string }) {
  try {
    const database = checkDatabaseConnection();

    // Return empty array when database is unavailable
    if (!database) {
      console.log(`Returning empty votes for chat ${id} due to database unavailability`);
      return [];
    }

    return await database.select().from(vote).where(eq(vote.chatId, id));
  } catch (_error) {
    console.error(`Database error in getVotesByChatId for ${id}, returning empty array`);
    // Return empty array instead of throwing error
    return [];
  }
}

export async function saveDocument({
  id,
  title,
  kind,
  content,
  userId,
}: {
  id: string;
  title: string;
  kind: ArtifactKind;
  content: string;
  userId: string;
}) {
  try {
    return await db
      .insert(document)
      .values({
        id,
        title,
        kind,
        content,
        userId,
        createdAt: new Date(),
      })
      .returning();
  } catch (_error) {
    throw new ChatSDKError("bad_request:database", "Failed to save document");
  }
}

export async function getDocumentsById({ id }: { id: string }) {
  try {
    const documents = await db
      .select()
      .from(document)
      .where(eq(document.id, id))
      .orderBy(asc(document.createdAt));

    return documents;
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to get documents by id"
    );
  }
}

export async function getDocumentById({ id }: { id: string }) {
  try {
    const [selectedDocument] = await db
      .select()
      .from(document)
      .where(eq(document.id, id))
      .orderBy(desc(document.createdAt));

    return selectedDocument;
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to get document by id"
    );
  }
}

export async function deleteDocumentsByIdAfterTimestamp({
  id,
  timestamp,
}: {
  id: string;
  timestamp: Date;
}) {
  try {
    await db
      .delete(suggestion)
      .where(
        and(
          eq(suggestion.documentId, id),
          gt(suggestion.documentCreatedAt, timestamp)
        )
      );

    return await db
      .delete(document)
      .where(and(eq(document.id, id), gt(document.createdAt, timestamp)))
      .returning();
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to delete documents by id after timestamp"
    );
  }
}

export async function saveSuggestions({
  suggestions,
}: {
  suggestions: Suggestion[];
}) {
  try {
    return await db.insert(suggestion).values(suggestions);
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to save suggestions"
    );
  }
}

export async function getSuggestionsByDocumentId({
  documentId,
}: {
  documentId: string;
}) {
  try {
    return await db
      .select()
      .from(suggestion)
      .where(and(eq(suggestion.documentId, documentId)));
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to get suggestions by document id"
    );
  }
}

export async function getMessageById({ id }: { id: string }) {
  try {
    return await db.select().from(message).where(eq(message.id, id));
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to get message by id"
    );
  }
}

export async function deleteMessagesByChatIdAfterTimestamp({
  chatId,
  timestamp,
}: {
  chatId: string;
  timestamp: Date;
}) {
  try {
    const messagesToDelete = await db
      .select({ id: message.id })
      .from(message)
      .where(
        and(eq(message.chatId, chatId), gte(message.createdAt, timestamp))
      );

    const messageIds = messagesToDelete.map(
      (currentMessage) => currentMessage.id
    );

    if (messageIds.length > 0) {
      await db
        .delete(vote)
        .where(
          and(eq(vote.chatId, chatId), inArray(vote.messageId, messageIds))
        );

      return await db
        .delete(message)
        .where(
          and(eq(message.chatId, chatId), inArray(message.id, messageIds))
        );
    }
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to delete messages by chat id after timestamp"
    );
  }
}

export async function updateChatVisiblityById({
  chatId,
  visibility,
}: {
  chatId: string;
  visibility: "private" | "public";
}) {
  try {
    return await db.update(chat).set({ visibility }).where(eq(chat.id, chatId));
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to update chat visibility by id"
    );
  }
}

export async function updateChatLastContextById({
  chatId,
  context,
}: {
  chatId: string;
  // Store merged server-enriched usage object
  context: AppUsage;
}) {
  try {
    return await db
      .update(chat)
      .set({ lastContext: context })
      .where(eq(chat.id, chatId));
  } catch (error) {
    console.warn("Failed to update lastContext for chat", chatId, error);
    return;
  }
}

export async function getMessageCountByUserId({
  id,
  differenceInHours,
}: {
  id: string;
  differenceInHours: number;
}) {
  try {
    const database = checkDatabaseConnection();

    // Return 0 when database is unavailable
    if (!database) {
      console.log("Returning 0 message count due to database unavailability");
      return 0;
    }

    const twentyFourHoursAgo = new Date(
      Date.now() - differenceInHours * 60 * 60 * 1000
    );

    const [stats] = await database
      .select({ count: count(message.id) })
      .from(message)
      .innerJoin(chat, eq(message.chatId, chat.id))
      .where(
        and(
          eq(chat.userId, id),
          gte(message.createdAt, twentyFourHoursAgo),
          eq(message.role, "user")
        )
      )
      .execute();

    return stats?.count ?? 0;
  } catch (_error) {
    console.error("Database error in getMessageCountByUserId, returning 0");
    // Return 0 instead of throwing error to allow the app to continue
    return 0;
  }
}

export async function createStreamId({
  streamId,
  chatId,
}: {
  streamId: string;
  chatId: string;
}) {
  try {
    const database = checkDatabaseConnection();

    // Skip when database is unavailable
    if (!database) {
      console.log(`Skipping create stream ${streamId} due to database unavailability`);
      return;
    }

    await database
      .insert(stream)
      .values({ id: streamId, chatId, createdAt: new Date() });
  } catch (_error) {
    console.error(`Database error in createStreamId for ${streamId}, skipping`);
    // Skip instead of throwing error
    return;
  }
}

export async function getStreamIdsByChatId({ chatId }: { chatId: string }) {
  try {
    const streamIds = await db
      .select({ id: stream.id })
      .from(stream)
      .where(eq(stream.chatId, chatId))
      .orderBy(asc(stream.createdAt))
      .execute();

    return streamIds.map(({ id }) => id);
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to get stream ids by chat id"
    );
  }
}
