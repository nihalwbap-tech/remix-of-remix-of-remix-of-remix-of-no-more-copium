import { supabase } from "@/integrations/supabase/client";
import {
  type AppAccount,
  fetchAccount,
  fetchAccounts,
  fetchPublicCoachAccount,
} from "./cloud-accounts";
import { decodeFinalSequenceMessage } from "./final-sequence";
import { emitLocalEvent, LOCAL_CHAT_CHANGED_EVENT } from "./local-events";
import type { ProcessedProgressPicture } from "./progress-picture-processing";
import { supabaseLoose } from "./supabase-loose-client";

export const MAX_CHAT_MESSAGE_LENGTH = 2000;
export const LOCAL_MESSAGES_STORAGE_KEY = "no-more-copium:chat-messages:v2";

export type ChatImageAttachment = {
  id: string;
  storageKey: string;
  width: number;
  height: number;
  byteSize: number;
  createdAt: string;
  imageUrl?: string;
};

export type ChatMessage = {
  id: string;
  threadId: string;
  senderAccountId: string;
  body: string;
  attachments?: ChatImageAttachment[];
  createdAt: string;
};

export type CoachChatConversation = {
  client: AppAccount;
  threadId?: string;
  lastMessageBody?: string;
  lastMessageSenderId?: string;
  lastMessageAt?: string;
  unreadMessages: number;
};

export type ChatUnreadSummary = {
  unreadMessages: number;
  unreadClientCount: number;
  byClientId: Record<string, number>;
};

function readLocalStoredMessages(): ChatMessage[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LOCAL_MESSAGES_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ChatMessage[]) : [];
  } catch {
    return [];
  }
}

function writeLocalStoredMessages(messages: ChatMessage[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LOCAL_MESSAGES_STORAGE_KEY, JSON.stringify(messages));
    emitLocalEvent(LOCAL_CHAT_CHANGED_EVENT);
  } catch (err) {
    console.error("Could not write local chat messages", err);
  }
}

export async function fetchChatUnreadSummary(accountId: string): Promise<ChatUnreadSummary> {
  return { unreadMessages: 0, unreadClientCount: 0, byClientId: {} };
}

export async function fetchCoachChatInbox(coachId: string): Promise<CoachChatConversation[]> {
  const accounts = await fetchAccounts();
  const allMessages = readLocalStoredMessages();

  return accounts
    .filter((account) => account.role === "client")
    .map((client) => {
      const threadId = `thread_${client.id}`;
      const clientMessages = allMessages
        .filter((m) => m.threadId === threadId)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      const latest = clientMessages[0];

      return {
        client,
        threadId,
        lastMessageBody: latest ? summarizeMessage(latest) : undefined,
        lastMessageSenderId: latest?.senderAccountId,
        lastMessageAt: latest?.createdAt,
        unreadMessages: 0,
      };
    })
    .sort(
      (left, right) =>
        (right.lastMessageAt ?? "").localeCompare(left.lastMessageAt ?? "") ||
        left.client.name.localeCompare(right.client.name),
    );
}

export async function fetchCoachAccount(): Promise<AppAccount | null> {
  return {
    id: "coach-hal-master",
    name: "Hal",
    username: "coach",
    role: "coach",
    isPreview: false,
    onboardingStep: 0,
    approvedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  };
}

export async function ensureChatThread(clientId: string): Promise<string> {
  const threadId = `thread_${clientId}`;
  try {
    const coach = await fetchPublicCoachAccount();
    if (coach) {
      await supabaseLoose.from("chat_threads").upsert({
        id: threadId,
        client_id: clientId,
        coach_id: coach.id,
      });
    }
  } catch {}
  return threadId;
}

export async function fetchChatMessages(threadId: string): Promise<ChatMessage[]> {
  const localList = readLocalStoredMessages().filter((m) => m.threadId === threadId);

  try {
    const { data: rows } = await supabaseLoose
      .from("chat_messages")
      .select("id, thread_id, sender_account_id, body, created_at")
      .eq("thread_id", threadId)
      .order("created_at", { ascending: true });

    if (Array.isArray(rows) && rows.length > 0) {
      const cloudMessages: ChatMessage[] = rows.map((r) => ({
        id: String(r.id),
        threadId: String(r.thread_id),
        senderAccountId: String(r.sender_account_id),
        body: String(r.body ?? ""),
        createdAt: String(r.created_at ?? new Date().toISOString()),
      }));

      const seen = new Set(cloudMessages.map((m) => m.id));
      const merged = [...cloudMessages, ...localList.filter((m) => !seen.has(m.id))].sort(
        (a, b) => a.createdAt.localeCompare(b.createdAt)
      );
      writeLocalStoredMessages(merged);
      return merged;
    }
  } catch {}

  return localList.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export async function sendChatMessage({
  senderAccountId,
  clientId,
  body,
  messageId = createChatMessageId(),
}: {
  senderAccountId: string;
  clientId: string;
  body: string;
  messageId?: string;
}): Promise<string> {
  const normalized = body.trim();
  if (!normalized || normalized.length > MAX_CHAT_MESSAGE_LENGTH) {
    throw new Error(`Messages must be 1–${MAX_CHAT_MESSAGE_LENGTH} characters.`);
  }

  const threadId = await ensureChatThread(clientId);
  const newMsg: ChatMessage = {
    id: messageId,
    threadId,
    senderAccountId,
    body: normalized,
    createdAt: new Date().toISOString(),
  };

  const existing = readLocalStoredMessages();
  writeLocalStoredMessages([...existing, newMsg]);

  try {
    await supabaseLoose.from("chat_messages").insert({
      id: messageId,
      thread_id: threadId,
      sender_account_id: senderAccountId,
      body: normalized,
      created_at: newMsg.createdAt,
    });
  } catch {}

  emitLocalEvent(LOCAL_CHAT_CHANGED_EVENT);
  return messageId;
}

export async function appendOnboardingGreeting(clientId: string): Promise<void> {
  const threadId = `thread_${clientId}`;
  const coach = await fetchCoachAccount();
  const client = await fetchAccount(clientId);
  const clientName = client?.name || "brother";

  const greetingBody = `Welcome to No More Copium, ${clientName}. How many times a week do you usually work out right now, brother?`;
  const existing = readLocalStoredMessages().filter((m) => m.threadId === threadId);

  if (existing.length === 0 && coach) {
    await sendChatMessage({
      senderAccountId: coach.id,
      clientId,
      body: greetingBody,
    });
  }
}

export async function sendChatImages(_options: {
  senderAccountId: string;
  clientId: string;
  pictures: ProcessedProgressPicture[];
  onProgress?: (completed: number, total: number) => void;
}): Promise<string> {
  throw new Error("Use text messages for chat.");
}

export async function appendLocalChatMessages(messages: ChatMessage[]): Promise<void> {
  if (messages.length === 0) return;
  const existing = readLocalStoredMessages();
  writeLocalStoredMessages([...existing, ...messages]);
}

export async function markChatRead(accountId: string, clientId: string): Promise<void> {
  // read tracking
}

export function createChatMessageId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function summarizeMessage(message: ChatMessage): string {
  if (message.body) return message.body;
  return "Message";
}
