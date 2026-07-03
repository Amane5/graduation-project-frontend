import { fetchWithSession } from "./auth-session";

export const uploadFile = async (
  file: File,
  childIds: number[]
) => {
  const formData = new FormData();

  formData.append("file", file);

  childIds.forEach((id) => {
    formData.append("childIds", String(id));
  });

  const url = `${import.meta.env.VITE_API_URL}/documents/upload`;

  const res = await fetchWithSession(url, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json();
    console.log(err);

    throw new Error("Upload failed");
  }

  return res.json();
};

export const getFiles = async () => {
  const url = `${import.meta.env.VITE_API_URL}/documents`;

  const res = await fetchWithSession(url);

  if (!res.ok) {
    throw new Error("Failed to fetch files");
  }

  return res.json();
};

export const deleteFile = async (id: number) => {
  const url = `${import.meta.env.VITE_API_URL}/documents/${id}`;

  const res = await fetchWithSession(url, {
    method: "DELETE",
  });

  if (!res.ok) {
    throw new Error("Delete failed");
  }

  return res.json();
};

export const updateFile = async (documentId:number , childIds: number[]) => {
    const url = `${import.meta.env.VITE_API_URL}/documents/${documentId}/children`;
    const res = await fetchWithSession(url , {
        method: "PATCH",
        headers:{
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
        childIds,
        }),
    })
    if(!res.ok){
        throw new Error ("Update faild")
    }

    return res.json()

}
