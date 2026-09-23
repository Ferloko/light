(() => {
  const gate = window.LIGHT_GATE;
  if (!gate) return;

  if (gate.unlocked && !new URLSearchParams(location.search).has("force-gate")) {
    return;
  }

  const root = document.getElementById("countdown");
  if (!root) return;

  const daysEl = root.querySelector('[data-unit="days"]');
  const hoursEl = root.querySelector('[data-unit="hours"]');
  const minutesEl = root.querySelector('[data-unit="minutes"]');
  const secondsEl = root.querySelector('[data-unit="seconds"]');
  const note = document.getElementById("countdown-note");

  const pad = (n) => String(Math.max(0, n)).padStart(2, "0");

  const tick = () => {
    const diff = gate.unlockAt - Date.now();

    if (diff <= 0) {
      daysEl.textContent = "00";
      hoursEl.textContent = "00";
      minutesEl.textContent = "00";
      secondsEl.textContent = "00";
      if (note) note.textContent = "Abriendo LIGHT…";
      window.location.replace("/");
      return;
    }

    const totalSec = Math.floor(diff / 1000);
    const days = Math.floor(totalSec / 86400);
    const hours = Math.floor((totalSec % 86400) / 3600);
    const minutes = Math.floor((totalSec % 3600) / 60);
    const seconds = totalSec % 60;

    daysEl.textContent = pad(days);
    hoursEl.textContent = pad(hours);
    minutesEl.textContent = pad(minutes);
    secondsEl.textContent = pad(seconds);
  };

  tick();
  setInterval(tick, 1000);
})();

(() => {
  const btn = document.getElementById("interest-btn");
  const countEl = document.getElementById("interest-count");
  const hint = document.getElementById("interest-hint");
  const hintText = document.getElementById("interest-hint-text");
  if (!btn || !countEl) return;

  const STORAGE_KEY = "light-interest-liked";
  const TOPIC = "light-magazine-me-interesa-x7k2q";
  const METRIC = "likes";
  const base = `https://tally.legible.sh/${TOPIC}/${METRIC}`;
  const sseUrl = `https://tally.legible.sh/${TOPIC}/sse`;

  let known = null;

  const formatCount = (n) => {
    const value = Number(n);
    if (!Number.isFinite(value) || value < 0) return "—";
    return new Intl.NumberFormat("es").format(Math.floor(value));
  };

  const setOnline = (online) => {
    if (!hint) return;
    hint.classList.toggle("is-online", online);
  };

  const setHint = (text) => {
    if (hintText) hintText.textContent = text;
  };

  const setLiked = (liked) => {
    btn.classList.toggle("is-liked", liked);
    btn.setAttribute("aria-pressed", liked ? "true" : "false");
    btn.disabled = liked;
    const label = btn.querySelector(".interest-label");
    if (label) label.textContent = liked ? "¡Gracias!" : "Me interesa!";
    setHint(
      liked ? "En vivo · tu interés quedó registrado" : "En vivo · sé de los primeros"
    );
  };

  const paintCount = (n, { animate } = {}) => {
    const next = Number(n);
    if (!Number.isFinite(next) || next < 0) return;
    const prev = known;
    known = next;
    countEl.textContent = formatCount(next);
    if (animate && prev !== null && next !== prev) {
      countEl.classList.remove("is-bump");
      void countEl.offsetWidth;
      countEl.classList.add("is-bump");
    }
  };

  const readCount = async () => {
    try {
      const res = await fetch(base, {
        headers: { Accept: "application/json" },
        cache: "no-store",
      });
      if (!res.ok) throw new Error("counter fetch failed");
      const data = await res.json();
      paintCount(data.value ?? 0);
      return true;
    } catch {
      if (known === null) countEl.textContent = "—";
      return false;
    }
  };

  const bumpCount = async () => {
    try {
      const res = await fetch(base, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "text/plain",
        },
        body: "+1",
        cache: "no-store",
      });
      if (!res.ok) throw new Error("counter bump failed");
      const data = await res.json();
      paintCount(data.value ?? 0, { animate: true });
      return true;
    } catch {
      return false;
    }
  };

  const listenLive = () => {
    if (!("EventSource" in window)) {
      setOnline(false);
      setInterval(readCount, 2000);
      return;
    }

    const source = new EventSource(sseUrl);

    source.addEventListener("open", () => {
      setOnline(true);
    });

    source.addEventListener("update", (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.metric && data.metric !== METRIC) return;
        paintCount(data.value ?? 0, { animate: true });
        setOnline(true);
      } catch {
        /* ignore malformed frames */
      }
    });

    source.onerror = () => {
      setOnline(false);
    };
  };

  const alreadyLiked = localStorage.getItem(STORAGE_KEY) === "1";
  setLiked(alreadyLiked);
  readCount().then((ok) => {
    if (ok) setOnline(true);
  });
  listenLive();

  btn.addEventListener("click", async () => {
    if (localStorage.getItem(STORAGE_KEY) === "1") return;

    btn.disabled = true;
    const ok = await bumpCount();
    if (!ok) {
      btn.disabled = false;
      setHint("Inténtalo de nuevo en un momento");
      return;
    }

    localStorage.setItem(STORAGE_KEY, "1");
    setLiked(true);
  });
})();
