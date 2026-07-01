export const startDrawingStory = async(file:File) => {
    const token = localStorage.getItem("accessToken")
    const formData= new FormData()
    formData.append("image", file)
    const url = `${import.meta.env.VITE_API_URL}/ai/drawing-story/start`;
    const res = await fetch(url, {
        method:"POST",
        headers:{
            Authorization:token?`Bearer ${token}`:"",
        },
        body:formData
    })
    return  res.json()
}

// export const sendDrawingStoryMessage = async(data:any) => {
//     const token = localStorage.getItem("accessToken")
//     const url = `${import.meta.env.VITE_API_URL}/ai/drawing-story/message`;
//     const res = await fetch(url, {
//         method:"POST",
//         headers:{
//             Authorization:token?`Bearer ${token}`:"",
//             "Content-Type": "application/json",
//         },
//         body:JSON.stringify(data)
//     })
//     if (!res.ok) {
//     throw new Error("Failed");
// }
//     return  res.json()
// }

export const sendDrawingStoryMessage = async (data: any) => {
    const token = localStorage.getItem("accessToken");

    const url = `${import.meta.env.VITE_API_URL}/ai/drawing-story/message`;

    const res = await fetch(url, {
        method: "POST",
        headers: {
            Authorization: token ? `Bearer ${token}` : "",
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    });


    return res.json()
};

export const generateStoryFromDrawing = async(data:any) => {
    const token = localStorage.getItem("accessToken")
    const url = `${import.meta.env.VITE_API_URL}/ai/drawing-story/generate-story`;
    const res = await fetch(url, {
        method:"POST",
        headers:{
            Authorization:token?`Bearer ${token}`:"",
            "Content-Type": "application/json",
        },
        body:JSON.stringify(data)
    })
    console.log("STATUS =", res.status);

    const json = await res.json();

    console.log("BODY =", json);

    return json;
}

