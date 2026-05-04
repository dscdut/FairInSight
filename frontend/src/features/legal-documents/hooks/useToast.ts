import { useState, useCallback, useRef } from "react";

export function useToast() {
  const [visible, setVisible] = useState(false);
  const [entering, setEntering] = useState(false);
  const [exiting, setExiting] = useState(false);
  const dismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const exitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback(() => {
    // Clear any pending timers
    if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
    if (exitTimerRef.current) clearTimeout(exitTimerRef.current);

    setExiting(false);
    setVisible(true);
    // Trigger enter animation on next frame
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setEntering(true));
    });

    // Auto-dismiss after 4 seconds
    dismissTimerRef.current = setTimeout(() => {
      dismiss();
    }, 4000);
  }, []);

  const dismiss = useCallback(() => {
    setEntering(false);
    setExiting(true);
    exitTimerRef.current = setTimeout(() => {
      setVisible(false);
      setExiting(false);
    }, 200);
  }, []);

  return { visible, entering, exiting, show, dismiss };
}
