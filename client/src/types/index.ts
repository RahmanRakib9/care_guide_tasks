export type UserRole = 'user' | 'admin';

export interface User {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  interests: string[];
  createdAt: string;
  updatedAt?: string;
}

export interface Note {
  _id: string;
  title: string;
  content: string;
  userId: string | User;
  createdAt: string;
  updatedAt?: string;
}

export interface Post {
  _id: string;
  title: string;
  content: string;
  userId: string | User;
  createdAt: string;
  updatedAt?: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface InterestGroup {
  _id: string;
  interest: string;
  totalUsers: number;
  users: Array<{
    _id: string;
    name: string;
    email: string;
    role: UserRole;
    createdAt: string;
  }>;
}

export interface UserWithPosts extends User {
  posts: Post[];
  totalPosts: number;
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (payload: {
    name: string;
    email: string;
    password: string;
    interests: string[];
  }) => Promise<User>;
  logout: () => void;
}
