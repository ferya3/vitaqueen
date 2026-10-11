import { create } from 'zustand';

/**
 * Client-side UI state that more than one component reads.
 *
 * The mobile menu is opened from the header, closed from inside the menu, and
 * closed again by a route change; a tiny Zustand store lets each of them do
 * that without threading callbacks through the layout.
 */
type MenuState = {
  menuOpen: boolean;
  openMenu: () => void;
  closeMenu: () => void;
  toggleMenu: () => void;
};

export const useMenuStore = create<MenuState>()((set) => ({
  menuOpen: false,
  openMenu: () => set({ menuOpen: true }),
  closeMenu: () => set({ menuOpen: false }),
  toggleMenu: () => set((state) => ({ menuOpen: !state.menuOpen })),
}));
