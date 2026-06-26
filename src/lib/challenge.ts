export const createChallenge = async(data:any) => {
    const token = localStorage.getItem("accessToken")
    const url = `${import.meta.env.VITE_API_URL}/challenge`;
    const res = await fetch(url, {
        method:"POST",
        headers:{
            Authorization:token?`Bearer ${token}`:"",
            "Content-Type": "application/json",
        },
        body:JSON.stringify(data)
    })
    return  res.json()
}

export const getChallenges = async() => {
    const token = localStorage.getItem("accessToken")
    const url = `${import.meta.env.VITE_API_URL}/challenge`;
    console.log(import.meta.env.VITE_API_URL);
    const res = await fetch(url, {
        method:"GET",
        headers:{
            Authorization:token?`Bearer ${token}`:"",
            "Content-Type": "application/json",
        },
    })
    return  res.json()
}

export const getChallenge = async(challengeId:number) => {
    const token = localStorage.getItem("accessToken")
    const url = `${import.meta.env.VITE_API_URL}/challenge/${challengeId}`;
    console.log(url);
    const res = await fetch(url, {
        method:"GET",
        headers:{
            Authorization:token?`Bearer ${token}`:"",
        },
    })
    return  res.json()
}

export const updateChallenge = async(challengeId:number, data:any) => {
    const token = localStorage.getItem("accessToken")
    const url = `${import.meta.env.VITE_API_URL}/challenge/${challengeId}`;
    const res = await fetch(url, {
        method:"PUT",
        headers:{
            Authorization:token?`Bearer ${token}`:"",
            "Content-Type": "application/json",
        },
        body:JSON.stringify(data)
    })
    return  res.json()
}

export const deleteChallenge = async(challengeId:number) => {
    const token = localStorage.getItem("accessToken")
    const url = `${import.meta.env.VITE_API_URL}/challenge/${challengeId}`;
    const res = await fetch(url, {
        method:"DELETE",
        headers:{
            Authorization:token?`Bearer ${token}`:"",
        },
    })
    return  res.json()
}

export const getWinner = async(challengeId:number) => {
    const token = localStorage.getItem("accessToken")
    const url = `${import.meta.env.VITE_API_URL}/challenge/${challengeId}/winner`;
    const res = await fetch(url, {
        method:"GET",
        headers:{
            Authorization:token?`Bearer ${token}`:"",
        },
    })
    return  res.json()
}

export const getLeaderBoard = async(challengeId:number) => {
    const token = localStorage.getItem("accessToken")
    const url = `${import.meta.env.VITE_API_URL}/challenge/${challengeId}/leaderboard`;
    const res = await fetch(url, {
        method:"GET",
        headers:{
            Authorization:token?`Bearer ${token}`:"",
        },
    })
    return  res.json()
}

export const getMyActiveChallenges = async() => {
    const token = localStorage.getItem("accessToken")
    const url = `${import.meta.env.VITE_API_URL}/challenge/my-active`;
    const res = await fetch(url, {
        method:"GET",
        headers:{
            Authorization:token?`Bearer ${token}`:"",
        },
    })
    return  res.json()
}

export const getChallengeForPlay = async(challengeId:number) => {
    const token = localStorage.getItem("accessToken")
    const url = `${import.meta.env.VITE_API_URL}/challenge/${challengeId}/play`;
    const res = await fetch(url, {
        method:"GET",
        headers:{
            Authorization:token?`Bearer ${token}`:"",
        },
    })
    return  res.json()
}

export const submitAnswer = async(questionId:number, answer:string) => {
    const token = localStorage.getItem("accessToken")
    const url = `${import.meta.env.VITE_API_URL}/challenge/question/${questionId}/answer`;
    const res = await fetch(url, {
        method:"POST",
        headers:{
            Authorization:token?`Bearer ${token}`:"",
            "Content-Type": "application/json",
        },
        body:JSON.stringify({answer})
    })
    return  res.json()
}

export const finishChallenge = async(challengeId:number) => {
    const token = localStorage.getItem("accessToken")
    const url = `${import.meta.env.VITE_API_URL}/challenge/${challengeId}/finish`;
    const res = await fetch(url, {
        method:"POST",
        headers:{
            Authorization:token?`Bearer ${token}`:"",
        },
    })
    return  res.json()
}

export const getMyResults = async(challengeId:number) => {
    const token = localStorage.getItem("accessToken")
    const url = `${import.meta.env.VITE_API_URL}/challenge/${challengeId}/my-results`;
    const res = await fetch(url, {
        method:"GET",
        headers:{
            Authorization:token?`Bearer ${token}`:"",
        },
    })
    return  res.json()
}

export const recommendQuestions = async(participantIds:number[]) => {
    const token = localStorage.getItem("accessToken")
    const url = `${import.meta.env.VITE_API_URL}/challenge/recommend-questions`;
    const res = await fetch(url, {
        method:"POST",
        headers:{
            Authorization:token?`Bearer ${token}`:"",
            "Content-Type": "application/json"
        },
        body:JSON.stringify({participantIds})
    })
    return  res.json()
}

export const recommendAnswer = async(question:string) => {
    const token = localStorage.getItem("accessToken")
    const url = `${import.meta.env.VITE_API_URL}/challenge/recommend-answers`;
    const res = await fetch(url, {
        method:"POST",
        headers:{
            Authorization:token?`Bearer ${token}`:"",
            "Content-Type": "application/json"
        },
        body:JSON.stringify({question})
    })
    return  res.json()
}