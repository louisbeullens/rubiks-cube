import { IStorageData } from "./components/CubeStorage.types";
import { EPerspective } from "./components/RubiksCube.types";
import { ICubeCharacteristic } from "./cube-characteristics";

const extractIdRegex = /^cube-(\d+)$/;

export const persistItem = (
  id: string,
  { type, perspective, colors, state }: IStorageData
) => {
  window.localStorage.setItem(
    `cube-${id}`,
    JSON.stringify({ type, perspective, colors, state })
  );
};

export const removeItem = (id: string) => {
  window.localStorage.removeItem(`cube-${id}`);
};

export const createNewItem = (
  characteristic: ICubeCharacteristic
): IStorageData => ({
  type: characteristic.type,
  perspective: EPerspective.UNFOLDED,
  colors: characteristic.colors,
  state: characteristic.createSolvedState(),
});

export const retrieveItem = (id: string) => {
  const itemString = window.localStorage.getItem(`cube-${id}`);
  if (!itemString) {
    return;
  }
  const item = JSON.parse(itemString) as IStorageData;
  return { ...item };
};

export const retrieveItems = () => {
  const numKeys = window.localStorage.length;
  const items: (IStorageData & { id: string })[] = [];
  const keys = Array.from({ length: numKeys }, (el, i) =>
    window.localStorage.key(i)
  ).sort();
  for (const key of keys) {
    if (!key || !key.startsWith("cube-")) {
      continue;
    }
    const id = extractIdRegex.exec(key)?.at(1);
    if (!id) {
      continue;
    }
    const item = retrieveItem(id);
    if (!item) {
      continue;
    }
    items.push({ id, ...item });
  }
  return items;
};
