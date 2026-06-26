export const generateStory = async (data) => {
    const token = localStorage.getItem("accessToken");
    const url = `${import.meta.env.VITE_API_URL}/story/generate`;

    const res = await fetch(url, {
        method: "POST",
        headers: {
        "Content-Type": "application/json",

        Authorization:
            token
            ? `Bearer ${token}`
            : "",
        },

        body: JSON.stringify(data),
    });
    const result = await res.json();

    return result;
}

export const approveStory = async (storyId: number) => {
    const token = localStorage.getItem("accessToken")
    const url = `${import.meta.env.VITE_API_URL}/story/${storyId}/approve`;
    const res = await fetch(url, {
        method:"PATCH",
        headers:{
            "Content-Type": "application/json",
            Authorization:token? `Bearer ${token}` : ''
        }
    })
    const result = await res.json()
    return result
}

export const updateStory = async (storyId:number , data) => {
    const token = localStorage.getItem("accessToken")
    const url = `${import.meta.env.VITE_API_URL}/story/${storyId}`;
    const res = await fetch(url , {
        method:"PUT",
        headers:{
            "Content-Type": "application/json",
            Authorization:token? `Bearer ${token}` : ''
        },
        body:JSON.stringify(data)
    })
    return await res.json()
}

export const getMyStories = async () => {

  const token = localStorage.getItem("accessToken");

  const res = await fetch(
    `${import.meta.env.VITE_API_URL}/story`,
    {
      headers: {
        Authorization: token
          ? `Bearer ${token}`
          : "",
      },
    }
  );

  return await res.json();
};

export const getChildStories = async (childId:number) => {

  const token = localStorage.getItem("accessToken");

  const res = await fetch(
    `${import.meta.env.VITE_API_URL}/story/child/${childId}`,
    {
      headers: {
        Authorization: token
          ? `Bearer ${token}`
          : "",
      },
    }
  );
  console.log("get children stories by father", res)
  return await res.json();
};

export const updateStoryWithAi = async (storyId:number, data) =>{
    const token = localStorage.getItem("accessToken")
    const url = `${import.meta.env.VITE_API_URL}/story/${storyId}/ai-edit`;
    const res = await fetch(url , {
        method:"POST",
        headers:{
            "Content-Type": "application/json",
            Authorization:token? `Bearer ${token}` : ''
        },
        body:JSON.stringify(data)
    })
    return await res.json()
}

export const getStoryEditMessages = async (storyId:number) => {

  const token =
    localStorage.getItem("accessToken");

  const res = await fetch(
    `${import.meta.env.VITE_API_URL}/story/${storyId}/edit-messages`,
    {
      headers: {
        Authorization:
          token
            ? `Bearer ${token}`
            : "",
      },
    }
  );

  return await res.json();
};

export const getChildrenStories = async () => {
  const token = localStorage.getItem("accessToken")
  const res = await fetch(
    `${import.meta.env.VITE_API_URL}/story/children`,
    {
      headers:{
        Authorization:token?`Bearer ${token}` : ""
      }
    }
  )
  return await res.json()
}

export const deleteStory = async (storyId:number) => {
  const token = localStorage.getItem("accessToken")
  const res = await fetch(`${import.meta.env.VITE_API_URL}/story/${storyId}`,
    {
      method: "DELETE",
      headers:{
        Authorization : token? `Bearer ${token}`: ""
      }
    }
  )
  return await res.json()
}

export const generateQuestionAudio = async (questionId: number) => {
  const token = localStorage.getItem("accessToken");

  const res = await fetch(
    `${import.meta.env.VITE_API_URL}/questions/${questionId}/tts`,
    {
      method: "POST",
      headers: {
        Authorization: token ? `Bearer ${token}` : "",
      },
    }
  );

  return await res.json();
};

export const speechToTextQuestion = async (
  questionId: number,
  audioBlob: Blob
) => {
  const token = localStorage.getItem("accessToken");

  const formData = new FormData();

  formData.append(
    "audio",
    audioBlob,
    "answer.webm"
  );

  const res = await fetch(
    `${import.meta.env.VITE_API_URL}/questions/${questionId}/speech-to-text`,
    {
      method: "POST",
      headers: {
        Authorization: token
          ? `Bearer ${token}`
          : "",
      },
      body: formData,
    }
  );

  return await res.json();
};