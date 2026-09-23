/**
 * LIGHT launch gate
 * Unlock: 7 October 2026, 00:00 (UTC-4)
 *
 * Bypass for preview: add ?preview=1 to any URL
 * Force show gate even after unlock: ?force-gate=1
 */
(() => {
  const UNLOCK_ISO = "2026-10-07T00:00:00-04:00";
  const unlockAt = new Date(UNLOCK_ISO).getTime();
  const params = new URLSearchParams(window.location.search);
  const raw = window.location.pathname.replace(/\/+$/, "");
  const path = raw.split("/").pop() || "";
  const isComingSoon = path === "coming-soon" || path === "coming-soon.html";

  if (params.has("preview")) {
    try {
      sessionStorage.setItem("light-preview", "1");
    } catch (_) {}
  }

  if (params.has("force-gate")) {
    try {
      sessionStorage.removeItem("light-preview");
    } catch (_) {}
  }

  let preview = false;
  try {
    preview = sessionStorage.getItem("light-preview") === "1";
  } catch (_) {}

  if (params.has("preview")) preview = true;
  if (params.has("force-gate")) preview = false;

  const now = Date.now();
  const unlocked = now >= unlockAt;

  window.LIGHT_GATE = {
    unlockAt,
    unlocked,
    preview,
    unlockISO: UNLOCK_ISO,
  };

  // After unlock: leave coming-soon → home
  if (unlocked && !params.has("force-gate") && isComingSoon) {
    window.location.replace("/");
    return;
  }

  // Before unlock: hide real site → coming-soon
  if (!unlocked && !preview && !isComingSoon) {
    window.location.replace("/coming-soon");
  }
})();
