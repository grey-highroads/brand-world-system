function readAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => resolve({ name: file.name, type: file.type || "application/octet-stream", size: file.size, data: reader.result }));
    reader.addEventListener("error", () => reject(new Error(`Could not read ${file.name}.`)));
    reader.readAsDataURL(file);
  });
}

function safeFilename(filename) {
  const cleaned = String(filename || "source-file").replace(/[^A-Za-z0-9._-]/g, "-").replace(/-+/g, "-");
  return cleaned || "source-file";
}

function uniquePathname(filename) {
  const uniqueId = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return `brand-world-system/sources/${uniqueId}-${safeFilename(filename)}`;
}

async function readPublicError(response, fallback) {
  try {
    const body = await response.json();
    return body?.error || fallback;
  } catch {
    return fallback;
  }
}

window.storeBrandWorldSourceFile = async function storeBrandWorldSourceFile(file) {
  if (["localhost", "127.0.0.1"].includes(window.location.hostname)) return readAsDataUrl(file);
  const pathname = uniquePathname(file.name);
  const contentType = file.type || "application/octet-stream";
  const authorization = await fetch("/api/blob/upload", {
    method: "POST",
    credentials: "same-origin",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ pathname, contentType, size: file.size }),
  });
  if (!authorization.ok) throw new Error(await readPublicError(authorization, "The source upload could not be authorized."));
  const { presignedUrl } = await authorization.json();
  if (!presignedUrl) throw new Error("The source upload could not be authorized.");

  const uploadResponse = await fetch(presignedUrl, {
    method: "PUT",
    headers: { "content-type": contentType },
    body: file,
  });
  if (!uploadResponse.ok) throw new Error(await readPublicError(uploadResponse, "The source file could not be uploaded."));
  const blob = await uploadResponse.json();
  return {
    name: file.name,
    type: blob.contentType || file.type || "application/octet-stream",
    size: file.size,
    blobPathname: blob.pathname || pathname,
  };
};
