const FIVE_MINUTES = 300000;

let wakeLockSentinel: WakeLockSentinel;
let timeoutId: number | undefined;

export const renewWakeLock = async (ms = FIVE_MINUTES) => {
  try {
    if (wakeLockSentinel === undefined || wakeLockSentinel.released) {
      wakeLockSentinel = await navigator.wakeLock.request("screen");
      wakeLockSentinel.addEventListener("release", () => {
        window.clearTimeout(timeoutId);
        timeoutId = 0;
      });
    }
    window.clearTimeout(timeoutId);
    timeoutId = window.setTimeout(() => wakeLockSentinel?.release(), ms);
  } catch {}
};

export const releaseWakeLock = async () => {
  try {
    await wakeLockSentinel?.release();
  } catch {}
};
