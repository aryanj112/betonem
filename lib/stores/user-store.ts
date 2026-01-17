import { create } from "zustand";

export interface User {
  id: string;
  phone_number: string;
  username: string;
  display_name: string;
  venmo_username?: string | null;
  avatar_url?: string | null;
  created_at: string;
}

interface UserState {
  user: User | null;
  setUser: (user: User | null) => void;
  clearUser: () => void;
}

export const useUserStore = create<UserState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  clearUser: () => set({ user: null }),
}));

