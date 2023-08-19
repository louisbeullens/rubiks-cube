let debugActive: boolean = false;
export const initConfig = () => {
  const debugItem = localStorage.getItem("debug");
  debugActive = debugItem ? JSON.parse(debugItem) : false;
};

export const setDebugActive = (value: boolean) => {
  localStorage.setItem("debug", value ? "true" : "false");
  debugActive = value;
};

export const isDebugActive = () => debugActive;
