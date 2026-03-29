import { create } from "zustand";
import { persist } from "zustand/middleware";

export type User = {
  id: string;
  email: string;
  username: string;
  firstName?: string;
  lastName?: string;
  role: string;
};

type AuthStore = {
  user: User | null;
  accessToken: string | null;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setAccessToken: (token: string | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
};

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      isLoading: false,
      setUser: (user) => set({ user }),
      setAccessToken: (token) => set({ accessToken: token }),
      setLoading: (loading) => set({ isLoading: loading }),
      logout: () => set({ user: null, accessToken: null })
    }),
    {
      name: "auth-store",
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken
      })
    }
  )
);
