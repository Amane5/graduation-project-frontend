import { fetchWithSession } from "./auth-session";

export const generateStory = async (data) => {
    const url = `${import.meta.env.VITE_API_URL}/story/generate`;

    const res = await fetchWithSession(url, {
        method: "POST",
        headers: {
        "Content-Type": "application/json",
        },

        body: JSON.stringify(data),
    });
    const result = await res.json();

    return result;
}

export const approveStory = async (storyId: number) => {
    const url = `${import.meta.env.VITE_API_URL}/story/${storyId}/approve`;
    const res = await fetchWithSession(url, {
        method:"PATCH",
        headers:{
            "Content-Type": "application/json",
        }
    })
    const result = await res.json()
    return result
}

export const updateStory = async (storyId:number , data) => {
    const url = `${import.meta.env.VITE_API_URL}/story/${storyId}`;
    const res = await fetchWithSession(url , {
        method:"PUT",
        headers:{
            "Content-Type": "application/json",
        },
        body:JSON.stringify(data)
    })
    return await res.json()
}

export const getMyStories = async () => {
  const res = await fetchWithSession(
    `${import.meta.env.VITE_API_URL}/story`,
  );

  return await res.json();
};

export const getChildStories = async (childId:number) => {
  const res = await fetchWithSession(
    `${import.meta.env.VITE_API_URL}/story/child/${childId}`,
  );
  console.log("get children stories by father", res)
  return await res.json();
};

export const updateStoryWithAi = async (storyId:number, data) =>{
    const url = `${import.meta.env.VITE_API_URL}/story/${storyId}/ai-edit`;
    const res = await fetchWithSession(url , {
        method:"POST",
        headers:{
            "Content-Type": "application/json",
        },
        body:JSON.stringify(data)
    })
    return await res.json()
}

export const getStoryEditMessages = async (storyId:number) => {
  const res = await fetchWithSession(
    `${import.meta.env.VITE_API_URL}/story/${storyId}/edit-messages`,
  );

  return await res.json();
};

export const getChildrenStories = async () => {
  const res = await fetchWithSession(
    `${import.meta.env.VITE_API_URL}/story/children`,
  )
  return await res.json()
}

export const deleteStory = async (storyId:number) => {
  const res = await fetchWithSession(`${import.meta.env.VITE_API_URL}/story/${storyId}`,
    {
      method: "DELETE",
    }
  )
  return await res.json()
}

export const generateQuestionAudio = async (questionId: number) => {
  const res = await fetchWithSession(
    `${import.meta.env.VITE_API_URL}/questions/${questionId}/tts`,
    {
      method: "POST",
    }
  );

  return await res.json();
};

export const speechToTextQuestion = async (
  questionId: number,
  audioBlob: Blob
) => {
  const formData = new FormData();

  formData.append(
    "audio",
    audioBlob,
    "answer.webm"
  );

  const res = await fetchWithSession(
    `${import.meta.env.VITE_API_URL}/questions/${questionId}/speech-to-text`,
    {
      method: "POST",
      body: formData,
    }
  );

  return await res.json();
};
