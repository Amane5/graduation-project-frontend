import { UserType } from '@/contexts/AuthContext'

interface User {
  id: number
  username: string
  email: string
  type: UserType
  firstName: string
  lastName: string
  gender: string

  readingLevel?: string;
  responseLength?: string;
  learningStyle?: string;
  interests?: string[];
  blockedTopics?: string[];
}

export default User
