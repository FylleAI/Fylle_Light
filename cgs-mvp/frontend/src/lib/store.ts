import { create } from "zustand";

interface User {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
}

interface AppStore {
  user: User | null;
  contextId: string | null;
  isAuthReady: boolean;
  setUser: (user: User | null) => void;
  setContextId: (id: string | null) => void;
  setAuthReady: (ready: boolean) => void;
  reset: () => void;
}

export const useAppStore = create<AppStore>((set) => ({
  user: null,
  contextId: null,
  isAuthReady: false,
  setUser: (user) => set({ user }),
  setContextId: (id) => set({ contextId: id }),
  setAuthReady: (ready) => set({ isAuthReady: ready }),
  reset: () => set({ user: null, contextId: null }),
}));
