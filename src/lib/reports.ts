import { fetchWithSession } from "./auth-session";

export const getChildReport = async (childId:number) =>{
    const url = `${import.meta.env.VITE_API_URL}/reports/child/${childId}`;
    const res = await fetchWithSession(url, {
        method:"GET",
    })
    return  res.json()
}

export const getStoryReport = async (storyId:number) => {
    const url = `${import.meta.env.VITE_API_URL}/reports/story/${storyId}`;
    const res = await fetchWithSession(url, {
        method:"GET",
    })
    return  res.json()
}

export const getChatReport = async (childId:number) => {
    const url = `${import.meta.env.VITE_API_URL}/analytics/report/${childId}`;
    const res = await fetchWithSession(url,{
        method:"GET",
    })
    return res.json()
}
