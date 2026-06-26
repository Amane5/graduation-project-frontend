export const getChildReport = async (childId:number) =>{
    const token = localStorage.getItem("accessToken")
    const url = `${import.meta.env.VITE_API_URL}/reports/child/${childId}`;
    const res = await fetch(url, {
        method:"GET",
        headers:{
            Authorization:token?`Bearer ${token}`:""
        }
    })
    return  res.json()
}

export const getStoryReport = async (storyId:number) => {
    const token = localStorage.getItem("accessToken")
    const url = `${import.meta.env.VITE_API_URL}/reports/story/${storyId}`;
    const res = await fetch(url, {
        method:"GET",
        headers:{
            Authorization:token?`Bearer ${token}`:""
        }
    })
    return  res.json()
}

export const getChatReport = async (childId:number) => {
    const token = localStorage.getItem("accessToken")
    const url = `${import.meta.env.VITE_API_URL}/analytics/report/${childId}`;
    const res = await fetch(url,{
        method:"GET",
        headers:{
            Authorization:token?`Bearer ${token}`: ''
        }
    })
    return res.json()
}