import { create } from "zustand";

export type Screen = "universe" | "journal" | "settings";

interface NavigationState {
  screen: Screen;
  goTo: (screen: Screen) => void;
}

export const useNavigation = create<NavigationState>((set) => ({
  screen: "universe",
  goTo: (screen) => set({ screen }),
}));
