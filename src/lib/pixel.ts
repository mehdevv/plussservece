declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

export function trackBooking() {
  try {
    window.fbq?.("track", "Lead");
  } catch {
    /* ignore */
  }
}
