// Which world a brain reader gets (ADR 0019, part two). Since 2026-09-09 a
// brain carries artifacts.today and artifacts.evolved. Every reader of a brain
// artifact goes through selectWorldArtifacts, which returns the evolved world
// when it is present, the today world otherwise, and, for a brain saved before
// the split, the single artifacts object at the root, read as today.
//
// The readers are handed the approved snapshot, so a world is approved when it
// is present on that snapshot: the app writes artifacts.evolved only on the
// evolved approve action. There is no per-job choice of world; owner ruling.
//
// This module imports nothing, so the compile path and the copy path can read
// it without pulling the synthesis provider along.

export function worldArtifacts(brain, world) {
  const artifacts = brain?.artifacts;
  if (!artifacts || typeof artifacts !== "object") return null;
  if (artifacts.today || artifacts.evolved) return artifacts[world] || null;
  return world === "today" ? artifacts : null;
}

export function selectWorldArtifacts(brain) {
  const evolved = worldArtifacts(brain, "evolved");
  if (evolved) return { world: "evolved", artifacts: evolved };
  return { world: "today", artifacts: worldArtifacts(brain, "today") || {} };
}
