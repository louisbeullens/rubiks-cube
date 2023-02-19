export const clone = <T extends any>(state: T): T =>
  JSON.parse(JSON.stringify(state));

export const rad = (deg: number) => (Math.PI * deg) / 180;
