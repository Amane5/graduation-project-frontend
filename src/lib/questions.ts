import { fetchWithSession } from "./auth-session";

export const generateQuestions= async (storyId: number) => {
    const url = `${import.meta.env.VITE_API_URL}/questions/story/${storyId}/generate`;
    const res = await fetchWithSession(url , {
        method:"POST",
    })
    return await res.json()
}

export const getQuestions = async (storyId:number) => {
    const url = `${import.meta.env.VITE_API_URL}/questions/story/${storyId}`;
    const res = await fetchWithSession(url , {
        method:"GET",
    })
    return await res.json()
}

export const addQuestions = async (storyId: number, data:{question:string}) => {
    const url = `${import.meta.env.VITE_API_URL}/questions/story/${storyId}/add`;
    const res = await fetchWithSession(url , {
        method:"POST",
        headers:{
            "Content-Type": "application/json",
        },
        body:JSON.stringify(data)
    })
    return await res.json()
}

export const updateQuestion = async (questionId:number, data:{question:string}) => {
    const url = `${import.meta.env.VITE_API_URL}/questions/${questionId}`;
    const res = await fetchWithSession(url , {
        method:"PUT",
        headers:{
            "Content-Type": "application/json",
        },
        body:JSON.stringify(data)
    })
    return await res.json()
}

export const deleteQuestion = async (questionId:number) => {
    const url = `${import.meta.env.VITE_API_URL}/questions/${questionId}`;
    const res = await fetchWithSession(url , {
        method:"DELETE",
    })
    return await res.json()
}

export const approveQuestions = async (storyId:number) => {
    const url = `${import.meta.env.VITE_API_URL}/questions/story/${storyId}/approve`;
    const res = await fetchWithSession(url , {
        method:"PATCH",
    })
    return await res.json()
}

export const regenerateQuestions = async(storyId:number) => {
    const url = `${import.meta.env.VITE_API_URL}/questions/story/${storyId}/regenerate`;
    const res = await fetchWithSession(url , {
        method:"POST",
    })
    return await res.json()
} 

export const submitAnswers = async (storyId:number,data: {
    answers: {
      questionId: number;
      answer: string;
    }[];
  }) =>{
    const url = `${import.meta.env.VITE_API_URL}/questions/${storyId}/answers`;
     const res = await fetchWithSession(url , {
        method:"POST",
        headers:{
            "Content-Type": "application/json",
        },
        body:JSON.stringify(data)
    })
    return await res.json()
}
