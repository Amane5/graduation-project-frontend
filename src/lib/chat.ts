import { fetchWithSession } from "./auth-session";

const CLIENT_ID_KEY = "chat_client_id";

export const getClientId = (): string => {
  let id = localStorage.getItem(CLIENT_ID_KEY);
  if (!id) {
    id = `cl_${crypto.randomUUID()}`;
    localStorage.setItem(CLIENT_ID_KEY, id);
  }
  return id;
};

export type DbMessage = {
  id: number;
  conversation_id: number;
  role: "user" | "assistant";
  content: string;
  created_at: string;
};

export type AskMessage = {
  id: number;
  question: string;
  answer: string;
  imageDescription?: string;
  voiceText?: string;
  createdAt: string;
  audioUrl?: string;
  imageUrl?: string;
  responseMode?: string;
  journeyData?: unknown;
};

export type Conversation = {
  id: number;
  title: string;
  lastActivity: string;
};

export const listConversations = async (childId: number) => {
  const res = await fetchWithSession(`${import.meta.env.VITE_API_URL}/conversation/${childId}`);
  const data = await res.json();
  return data.data.data;
};

export const createConversation = async (question: string) => {
  const res = await fetchWithSession(`${import.meta.env.VITE_API_URL}/conversation`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question }),
  });
  const data = await res.json();
  return data.data.data;
};

export const deleteConversation = async (id: number) => {
  const response = await fetchWithSession(`${import.meta.env.VITE_API_URL}/conversation/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error(`Delete failed: ${response.status}`);
  }

  console.log("delteeeee", response);
  return response.json();
};

export const listMessages = async (conversationId: number) => {
  const res = await fetchWithSession(
    `${import.meta.env.VITE_API_URL}/ask/${conversationId}/messages`,
  );
  const data = await res.json();
  return data.data.data;
};

export async function streamChat({
  question,
  conversationId,
  files,
  onDelta,
  onJourneyDelta,
  onDone,
  onAbort,
  onError,
  onAudio,
  onImage,
  mode = "normal",
  signal,
}: {
  question: string;
  conversationId?: number;
  files?: File[];
  mode?: "normal" | "journey";
  onDelta: (chunk: string) => void;
  onJourneyDelta?: (data: {
  section: string;
  chunk: string;
}) => void;
  onDone: (data?: {
    audioUrl?: string;
    imageUrl?: string;
  }) => void;
  onAbort?: () => void;
  onAudio?: (audioUrl: string) => void;
  onImage?: (imageUrl: string) => void;
  onError: (msg: string) => void;
  signal?: AbortSignal;
}) {
  const url = `${import.meta.env.VITE_API_URL}/ai/stream`;

  const formData = new FormData();
  formData.append("question", question);
  formData.append("mode", mode);

  if (conversationId) {
    formData.append("conversationId", String(conversationId));
  }

  if (files && files.length > 0) {
    for (const file of files) {
      formData.append("files", file);
    }
  }

  let resp: Response;

  try {
    resp = await fetchWithSession(url, {
      method: "POST",
      body: formData,
      signal,
    });
    console.log("STREAM RESPONSE", resp);
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      onAbort?.();
      return;
    }
    onError("Network hiccup");
    return;
  }

  if (!resp.ok || !resp.body) {
    onError("Stream failed");
    return;
  }

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();

  let buffer = "";
  let currentEvent = "";

  try {
    while (true) {
      const { done, value } = await reader.read();

      if (done) break;

      buffer += decoder.decode(value, {
        stream: true,
      });

      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        const trimmed = line.trim();

        if (!trimmed) continue;

        if (trimmed.startsWith("event: ")) {
          currentEvent = trimmed.replace("event: ", "");
        }

        if (trimmed.startsWith("data: ")) {
          const raw = trimmed.replace("data: ", "");

          if (currentEvent === "text") {
            try {
              const chunk = JSON.parse(raw);
              onDelta(chunk);
            } catch {
              onDelta(raw);
            }
          } else if (currentEvent === "journey_delta") {
          try {
            const data = JSON.parse(raw);

            onJourneyDelta?.({
              section: data.section,
              chunk: data.chunk,
            });
          } catch (error) {
            console.error("Failed to parse journey_delta", error);
          }
        }
          else if (currentEvent === "audio") {
            const data = JSON.parse(raw);
            onAudio?.(data.audioUrl);
          } else if (currentEvent === "image") {
            const data = JSON.parse(raw);
            onImage?.(data.imageUrl);
          } else if (currentEvent === "done") {
            onDone();
            return;
          }
        }
      }
    }
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      onAbort?.();
      return;
    }

    onError("Stream failed");
    return;
  }

  onDone();
}

export const histoyPage = async (childId: number) => {
  const response = await fetchWithSession(`${import.meta.env.VITE_API_URL}/history/${childId}`);
  const data = await response.json();
  return data.data;
};


export const speechToTextChat = async (audioFile: File) => {
  const url = `${import.meta.env.VITE_API_URL}/ai/speech-to-text`;

  const formData = new FormData();

  formData.append("audio", audioFile);

  const response = await fetchWithSession(url, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);

    throw new Error(
      errorData?.message || "Failed to transcribe audio",
    );
  }

  return response.json();
};
