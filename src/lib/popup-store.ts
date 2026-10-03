import { useSyncExternalStore } from "react";
import { POPUP_CONFIG } from "@/config/popup";

/** Per-browser preference for the retro popup; shared by Settings and RetroPopup without mutating config. */
const KEY = "popupEnabled";
const listeners = new Set<() => void>();

function read(): boolean {
  try {
    const saved = localStorage.getItem(KEY);
    return saved === null ? POPUP_CONFIG.enabled : saved === "true";
  } catch {
    return POPUP_CONFIG.enabled;
  }
}

export function setPopupEnabled(enabled: boolean): void {
  try {
    localStorage.setItem(KEY, String(enabled));
  } catch {
    /* private mode */
  }
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

export function usePopupEnabled(): boolean {
  return useSyncExternalStore(subscribe, read, () => POPUP_CONFIG.enabled);
}
