import { useEffect, useState } from "react";
import { POPUP_CONFIG } from "@/config/popup";
import { usePopupEnabled } from "@/lib/popup-store";

/** Windows-95 styled interstitial. Appears once per page load after POPUP_CONFIG.delayMs. */
export default function RetroPopup() {
  const enabled = usePopupEnabled();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    const timer = setTimeout(() => setIsVisible(true), POPUP_CONFIG.delayMs);
    return () => clearTimeout(timer);
  }, [enabled]);

  // Swallow keyboard input while the popup is up, matching the original behavior.
  useEffect(() => {
    if (!isVisible) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isVisible]);

  if (!enabled || !isVisible) return null;

  return (
    <div className="fixed inset-0 z-9999 flex items-center justify-center bg-black/80 font-mono" role="dialog" aria-modal="true">
      <div className="w-[90%] max-w-[700px] bg-white border-[3px] border-[#808080] p-[30px] text-center">
        <div className="flex items-center justify-center gap-5 mb-[30px]">
          <img src="/towers.jpg" alt="Towers" className="w-20 h-20 border-2 border-black object-cover" />
          <div className="flex-1 text-2xl font-bold text-black leading-tight text-center">{POPUP_CONFIG.message}</div>
          <img src="/bush.jpg" alt="Bush" className="w-20 h-20 border-2 border-black object-cover" />
        </div>
        <div className="flex gap-5 justify-center">
          <button
            onClick={() => setIsVisible(false)}
            className="bg-[#00ff00] active:bg-[#00cc00] text-white border-2 border-black px-[30px] py-[15px] text-lg font-bold cursor-pointer font-mono"
          >
            {POPUP_CONFIG.agreeButtonText}
          </button>
          <button
            onClick={() => window.open(POPUP_CONFIG.disagreeLink, "_blank", "noopener")}
            className="bg-[#ff0000] active:bg-[#cc0000] text-white border-2 border-black px-[30px] py-[15px] text-lg font-bold cursor-pointer font-mono"
          >
            {POPUP_CONFIG.disagreeButtonText}
          </button>
        </div>
      </div>
    </div>
  );
}
