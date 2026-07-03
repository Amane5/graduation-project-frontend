import { fetchWithSession } from "./auth-session";

type JsonObject = Record<string, unknown>;

export const createChallenge = async(data: JsonObject) => {
    const url = `${import.meta.env.VITE_API_URL}/challenge`;
    const res = await fetchWithSession(url, {
        method:"POST",
        headers:{
            "Content-Type": "application/json",
        },
        body:JSON.stringify(data)
    })
    return  res.json()
}

export const getChallenges = async() => {
    const url = `${import.meta.env.VITE_API_URL}/challenge`;
    console.log(import.meta.env.VITE_API_URL);
    const res = await fetchWithSession(url, {
        method:"GET",
        headers:{
            "Content-Type": "application/json",
        },
    })
    return  res.json()
}

export const getChallenge = async(challengeId:number) => {
    const url = `${import.meta.env.VITE_API_URL}/challenge/${challengeId}`;
    console.log(url);
    const res = await fetchWithSession(url, {
        method:"GET",
    })
    return  res.json()
}

export const updateChallenge = async(challengeId:number, data: JsonObject) => {
    const url = `${import.meta.env.VITE_API_URL}/challenge/${challengeId}`;
    const res = await fetchWithSession(url, {
        method:"PUT",
        headers:{
            "Content-Type": "application/json",
        },
        body:JSON.stringify(data)
    })
    return  res.json()
}

export const deleteChallenge = async(challengeId:number) => {
    const url = `${import.meta.env.VITE_API_URL}/challenge/${challengeId}`;
    const res = await fetchWithSession(url, {
        method:"DELETE",
    })
    return  res.json()
}

export const getWinner = async(challengeId:number) => {
    const url = `${import.meta.env.VITE_API_URL}/challenge/${challengeId}/winner`;
    const res = await fetchWithSession(url, {
        method:"GET",
    })
    return  res.json()
}

export const getLeaderBoard = async(challengeId:number) => {
    const url = `${import.meta.env.VITE_API_URL}/challenge/${challengeId}/leaderboard`;
    const res = await fetchWithSession(url, {
        method:"GET",
    })
    return  res.json()
}

export const getMyActiveChallenges = async() => {
    const url = `${import.meta.env.VITE_API_URL}/challenge/my-active`;
    const res = await fetchWithSession(url, {
        method:"GET",
    })
    return  res.json()
}

export const getChallengeForPlay = async(challengeId:number) => {
    const url = `${import.meta.env.VITE_API_URL}/challenge/${challengeId}/play`;
    const res = await fetchWithSession(url, {
        method:"GET",
    })
    return  res.json()
}

export const submitAnswer = async(questionId:number, answer:string) => {
    const url = `${import.meta.env.VITE_API_URL}/challenge/question/${questionId}/answer`;
    const res = await fetchWithSession(url, {
        method:"POST",
        headers:{
            "Content-Type": "application/json",
        },
        body:JSON.stringify({answer})
    })
    return  res.json()
}

export const finishChallenge = async(challengeId:number) => {
    const url = `${import.meta.env.VITE_API_URL}/challenge/${challengeId}/finish`;
    const res = await fetchWithSession(url, {
        method:"POST",
    })
    return  res.json()
}

export const getMyResults = async(challengeId:number) => {
    const url = `${import.meta.env.VITE_API_URL}/challenge/${challengeId}/my-results`;
    const res = await fetchWithSession(url, {
        method:"GET",
    })
    return  res.json()
}

export const recommendQuestions = async(participantIds:number[]) => {
    const url = `${import.meta.env.VITE_API_URL}/challenge/recommend-questions`;
    const res = await fetchWithSession(url, {
        method:"POST",
        headers:{
            "Content-Type": "application/json"
        },
        body:JSON.stringify({participantIds})
    })
    return  res.json()
}

export const recommendAnswer = async(question:string) => {
    const url = `${import.meta.env.VITE_API_URL}/challenge/recommend-answers`;
    const res = await fetchWithSession(url, {
        method:"POST",
        headers:{
            "Content-Type": "application/json"
        },
        body:JSON.stringify({question})
    })
    return  res.json()
}
