// import http, { ApiResponse } from "./http";
// export interface Child {
//   // birthDate: string | number | Date;
//   id: string;
//   username: string;
//   birthDate: string;
//   avatarColor: string;
//   avatarEmoji: string;
//   password?: string;
//   firstName?: string;
//   lastName?: string;
//   createdAt?: string;
// }

// export const AVATAR_PRESETS = [
//   { color: "from-primary to-primary-glow", emoji: "🦊" },
//   { color: "from-secondary to-primary-glow", emoji: "🐻" },
//   { color: "from-accent to-secondary", emoji: "🐼" },
//   { color: "from-primary to-secondary", emoji: "🐰" },
//   { color: "from-secondary to-accent", emoji: "🦁" },
//   { color: "from-accent to-primary", emoji: "🐸" },
//   { color: "from-primary-glow to-accent", emoji: "🐨" },
//   { color: "from-secondary to-primary", emoji: "🦄" },
// ];
// export const calcAge = (birthdate?: string): number | null => {
//   if (!birthdate) return null;

//   const birth = new Date(birthdate);

//   if (isNaN(birth.getTime())) return null;

//   const today = new Date();
//   let age = today.getFullYear() - birth.getFullYear();

//   const m = today.getMonth() - birth.getMonth();
//   if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
//     age--;
//   }

//   return age;
// };
// // GET children
// // export const getChildren = () => {
// //   return http.get<ApiResponse<Child[]>>("/children");
// // };
// export const getChildren = async (): Promise<Child[]> => {
//   const res = await http.get<ApiResponse<Child[]>>("/children");
//   return res.data;
// };
// // CREATE
// export const createChild = (data: {
//   firstName: string;
//   lastName: string;
//   username: string;
//   password: string;
//   birthdate: string;
// }) => {
//   return http.post<ApiResponse<Child>>("/children", data);
// };

// // UPDATE
// export const updateChild = (data: {
//   id: string;
//   firstName: string;
//   lastName: string;
//   username: string;
//   birthdate: string;
//   password?: string;
// }) => {
//   return http.put<ApiResponse<Child>>(`/children/${data.id}`, data);
// };

// // DELETE
// export const deleteChildById = (id: string) => {
//   return http.post<ApiResponse<null>>(`/children/${id}/delete`);
// };
// export const getChildById = (id: string) => {
//   return http.get<ApiResponse<Child>>(`/children/${id}`);
// };
import http, { ApiResponse } from "./http";

export interface Child {
  id: string;
  username: string;
  birthDate: string;

  avatarColor: string;
  avatarEmoji: string;

  password?: string;
  firstName?: string;
  lastName?: string;
  gender?:string;
  createdAt?: string;

  readingLevel?: string;
  responseLength?: string;
  learningStyle?: string;
  interests?: string[];
  blockedTopics?: string[];
}

export interface DashboardStats {
  totalChildren: number;
  questionsToday: number;
  activeMinutes: number | null;
}

export const AVATAR_PRESETS = [
  { color: "from-primary to-primary-glow", emoji: "🦊" },
  { color: "from-secondary to-primary-glow", emoji: "🐻" },
  { color: "from-accent to-secondary", emoji: "🐼" },
  { color: "from-primary to-secondary", emoji: "🐰" },
  { color: "from-secondary to-accent", emoji: "🦁" },
  { color: "from-accent to-primary", emoji: "🐸" },
  { color: "from-primary-glow to-accent", emoji: "🐨" },
  { color: "from-secondary to-primary", emoji: "🦄" },
];

export const calcAge = (birthDate?: string): number | null => {
  if (!birthDate) return null;

  const birth = new Date(birthDate);

  if (isNaN(birth.getTime())) return null;

  const today = new Date();

  let age = today.getFullYear() - birth.getFullYear();

  const m = today.getMonth() - birth.getMonth();

  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--;
  }

  return age;
};

// GET
export const getChildren = async (): Promise<Child[]> => {
  const res = await http.get<ApiResponse<Child[]>>("/children");
  return res.data;
};

export const getDashboardStats = () =>
  http.get<ApiResponse<DashboardStats>>("/children/dashboard-stats");

// CREATE
export const createChild = (data: {
  firstName: string;
  lastName: string;
  gender:string
  username: string;
  password: string;
  birthDate: string;

  readingLevel?: string;
  responseLength?: string;
  learningStyle?: string;
  interests?: string[];
  blockedTopics?: string[];
}) => {
  return http.post<ApiResponse<Child>>("/children", data);
};

// UPDATE
export const updateChild = (data: {
  id: string;
  firstName: string;
  lastName: string;
  gender: string;
  username: string;
  birthDate: string;
  password?: string;
  
  readingLevel?: string;
  responseLength?: string;
  learningStyle?: string;
  interests?: string[];
  blockedTopics?: string[];
}) => {
  return http.put<ApiResponse<Child>>(`/children/${data.id}`, data);
};

// DELETE
export const deleteChildById = (id: string) => {
  return http.delete<ApiResponse<null>>(`/children/${id}`);
};

// GET BY ID
export const getChildById = (id: string) => {
  return http.get<ApiResponse<Child>>(`/children/${id}`);
};
