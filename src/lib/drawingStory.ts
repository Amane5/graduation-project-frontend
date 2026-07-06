import { fetchWithSession } from "./auth-session";

type DrawingStoryPayload = Record<string, unknown>;

export interface DrawingStorySession {
    id: number;
    status: "INTERVIEWING" | "READY" | "GENERATING" | "COMPLETED";
    conversationId: number;
    childId: number;
    drawingImageUrl: string;
    drawingAnalysis: unknown;
    interviewFinished: boolean;
    storyId?: number | null;
    createdAt: string;
    updatedAt: string;
}

export const startDrawingStory = async(file:File) => {
    const formData= new FormData()
    formData.append("image", file)
    const url = `${import.meta.env.VITE_API_URL}/ai/drawing-story/start`;
    const res = await fetchWithSession(url, {
        method:"POST",
        body:formData
    })
    return  res.json()
}

export const sendDrawingStoryMessage = async (data: DrawingStoryPayload) => {
    const url = `${import.meta.env.VITE_API_URL}/ai/drawing-story/message`;

    const res = await fetchWithSession(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    });


    return res.json()
};

export const generateStoryFromDrawing = async(data: DrawingStoryPayload) => {
    const url = `${import.meta.env.VITE_API_URL}/ai/drawing-story/generate-story`;
    const res = await fetchWithSession(url, {
        method:"POST",
        headers:{
            "Content-Type": "application/json",
        },
        body:JSON.stringify(data)
    })
    console.log("STATUS =", res.status);

    const json = await res.json();

    console.log("BODY =", json);

    return json;
}

export const getDrawingStorySession = async (
    conversationId: number,
): Promise<DrawingStorySession | null> => {
    const url = `${import.meta.env.VITE_API_URL}/ai/drawing-story/session/${conversationId}`;
    const res = await fetchWithSession(url);

    if (res.status === 404) {
        return null;
    }

    if (!res.ok) {
        throw new Error(`Failed to load drawing story session: ${res.status}`);
    }

    const json = await res.json();
    return json.data as DrawingStorySession;
}
