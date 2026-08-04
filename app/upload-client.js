import { upload } from "@vercel/blob/client";

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

window.storeBrandWorldSourceFile = async function storeBrandWorldSourceFile(file) {
  if (["localhost", "127.0.0.1"].includes(window.location.hostname)) return readAsDataUrl(file);
  const pathname = `brand-world-system/sources/${safeFilename(file.name)}`;
  const blob = await upload(pathname, file, {
    access: "private",
    handleUploadUrl: "/api/blob/upload",
    contentType: file.type || "application/octet-stream",
    multipart: file.size > 5 * 1024 * 1024,
  });
  return {
    name: file.name,
    type: blob.contentType || file.type || "application/octet-stream",
    size: file.size,
    blobPathname: blob.pathname,
  };
};
