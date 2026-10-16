export const MAX_ITEMS = 10;
let counter = 0;
export const newId = () => `${Date.now()}-${counter++}`;

/** Builds the multipart body shared by Notarize, Verify and Analyse. */
export function buildForm(items, extra = {}) {
  const form = new FormData();
  const files = items.filter((i) => i.kind === "file");
  const urls = items.filter((i) => i.kind === "url");
  files.forEach((i) => form.append("files", i.file, i.file.name));
  form.append("contexts", JSON.stringify(files.map((i) => i.context)));
  form.append("lastModifieds", JSON.stringify(files.map((i) => i.file.lastModified || 0)));
  form.append("urls", JSON.stringify(urls.map((i) => i.url)));
  Object.entries(extra).forEach(([k, v]) => v && form.append(k, v));
  return form;
}

export function getLocation(timeoutMs = 8000) {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) return reject(new Error("Location is not supported on this device"));
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ latitude: p.coords.latitude, longitude: p.coords.longitude, accuracy: p.coords.accuracy }),
      (e) => reject(new Error(e.code === 1 ? "Location permission was denied" : "Could not get your location")),
      { enableHighAccuracy: true, timeout: timeoutMs, maximumAge: 30000 }
    );
  });
}

/** Pulls the SHA-256 out of a certificate QR (a /verify?hash=... link) or a bare hash. */
export function extractHash(text) {
  try {
    const h = new URL(text).searchParams.get("hash");
    if (h && /^[a-f0-9]{64}$/i.test(h)) return h.toLowerCase();
  } catch { /* not a URL */ }
  const m = /[a-f0-9]{64}/i.exec(text || "");
  return m ? m[0].toLowerCase() : null;
}

export const fmtSize = (n) => (n > 1048576 ? `${(n / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`);
