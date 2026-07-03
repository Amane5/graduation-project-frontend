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
  id:number
  question:string
  answer:string
  imageDescription?:string
  voiceText?:string
  createdAt:string
  audioUrl?: string;
  imageUrl?: string;
  responseMode?: string
  journeyData?: unknown
}

export type Conversation = {
  id: number;
  title: string;
  lastActivity: string;
};

export const listConversations = async (childId : number) => {
  const res = await fetchWithSession(`${import.meta.env.VITE_API_URL}/conversation/${childId}`);
  const data = await res.json()
  return data.data.data;
};

export const createConversation = async (question:string) => {
  const res = await fetchWithSession(`${import.meta.env.VITE_API_URL}/conversation`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify( {question} ),
  });
  const data = await res.json();
  return data.data.data;
};

export const deleteConversation = async (id: number) => {
  const r = await fetchWithSession(`${import.meta.env.VITE_API_URL}/conversation/${id}`, {
    method: "DELETE",
  });
   if (!r.ok) {
    throw new Error(`Delete failed: ${r.status}`);
  }
  console.log("delteeeee", r)
  return r.json();
};

export const listMessages = async (conversationId: number) => {
  const res = await fetchWithSession(
    `${import.meta.env.VITE_API_URL}/ask/${conversationId}/messages`,
  );
  const data = await res.json();
  return data.data.data
};

export async function streamChat({
  question,
  conversationId,
  files,
  onDelta,
  onDone,
  onError,
  onAudio,
  onImage,
  mode = "normal",
}: {
  question: string;
  conversationId?: number;
  files?: File[];
  mode?: "normal" | "journey";
  onDelta: (chunk: string) => void;
  onDone: (data?: {
  audioUrl?: string;
  imageUrl?: string;
}) => void;
  onAudio?: (audioUrl: string) => void;
  onImage?: (imageUrl: string) => void;
  onError: (msg: string) => void;
}) {
  const url = `${import.meta.env.VITE_API_URL}/ai/stream`;

  const formData = new FormData();

  formData.append("question", question);

  formData.append("mode", mode);
  if (conversationId) {
    formData.append(
      "conversationId",
      String(conversationId),
    );
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
    });
    console.log("STREAM RESPONSE", resp);
  } catch (e) {
    onError("Network hiccup ðŸ’«");
    return;
  }

  if (!resp.ok || !resp.body) {
    onError("Stream failed ðŸ’«");
    return;
  }

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();

  let buffer = "";
  let currentEvent = "";

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
    }

    else if (currentEvent === "audio") {
      const data = JSON.parse(raw);

      onAudio?.(data.audioUrl);
    }

    else if (currentEvent === "image") {
      const data = JSON.parse(raw);

      onImage?.(data.imageUrl);
    }

    else if (currentEvent === "done") {
      onDone();

      return;
    }
  }
}
  }

  onDone();
}

export const histoyPage = async (childId:number) =>{
  const r = await fetchWithSession(`${import.meta.env.VITE_API_URL}/history/${childId}`);
  const data = await r.json();
  return data.data
}
