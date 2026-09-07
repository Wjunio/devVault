export function compareVersions(versionA: string, versionB: string): number {
  const cleanA = versionA
    .replace(/^[^\d]*/, "")
    .split(".")
    .map((part) => parseInt(part, 10) || 0);

  const cleanB = versionB
    .replace(/^[^\d]*/, "")
    .split(".")
    .map((part) => parseInt(part, 10) || 0);

  const length = Math.max(cleanA.length, cleanB.length);

  for (let i = 0; i < length; i++) {
    const a = cleanA[i] || 0;
    const b = cleanB[i] || 0;

    if (a > b) {
      return 1;
    }

    if (a < b) {
      return -1;
    }
  }

  return 0;
}
