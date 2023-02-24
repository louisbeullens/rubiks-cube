import { IListItem } from "./components/AbstractList";
import { IStorageData } from "./components/CubeStorage.types";
import { EPerspective } from "./components/RubiksCube.types";
import { ICubeCharacteristic } from "./cube-characteristics";

export const persistItem = ({
  id,
  type,
  perspective,
  colors,
  state,
}: IListItem<IStorageData>) => {
  window.localStorage.setItem(
    `cube-${id}`,
    JSON.stringify({ type, perspective, colors, state })
  );
};

export const createNewItem = (
  characteristic: ICubeCharacteristic
): IListItem<IStorageData> => ({
  id: Date.now().toString(),
  type: characteristic.type,
  perspective: EPerspective.UNFOLDED,
  colors: characteristic.colors,
  state: characteristic.createSolvedState(),
});

export const retrieveItem = (id: string) => {
  const itemString = window.localStorage.getItem(id);
  if (!itemString) {
    return;
  }
  const item = JSON.parse(itemString) as IStorageData;
  return { id, ...item };
};

export const retrieveItems = () => {
  const numKeys = window.localStorage.length;
  const items: IListItem<IStorageData>[] = [];
  const keys = Array.from({ length: numKeys }, (el, i) =>
    window.localStorage.key(i)
  ).sort();
  for (const key of keys) {
    if (!key || !key.startsWith("cube-")) {
      continue;
    }
    const item = retrieveItem(key);
    if (!item) {
      continue;
    }
    items.push(item);
  }
  return items;
};
