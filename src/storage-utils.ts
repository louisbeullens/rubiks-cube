import { IStorageData } from "./components/CubeStorage.types";
import { ECubeType, EPerspective } from "./components/RubiksCube.types";
import { defaultState, getCorePermutation } from "./rubiks-cube/cube-util";
import { coreOrientationMap } from "./rubiks-cube/rotationMap";
import { base64Decode, base64Encode, convertByteSize } from "./utils";

const extractIdRegex = /^cube-(\d+)$/;

export const persistItem = (
  id: string,
  { type, perspective, state }: IStorageData
) => {
  window.localStorage.setItem(
    `cube-${id}`,
    JSON.stringify({ type, perspective, state })
  );
};

export const removeItem = (id: string) => {
  window.localStorage.removeItem(`cube-${id}`);
};

export const createNewItem = (characteristic: any): IStorageData => ({
  type: characteristic.type,
  perspective: EPerspective.THREE_DIMENSIONAL,
  state: defaultState,
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
    const id = extractIdRegex.exec(key)?.[1];
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

export const serializeCube = ({ type, perspective, state }: IStorageData) => {
  const corePermutation = getCorePermutation(state);

  const raw = [
    ...state.slice(0, 12).map((el) => el - 2),
    ...state.slice(12, 20).map((el) => el - 39),
    ...state.slice(20).map((el) => el % 4),
    Object.keys(coreOrientationMap).sort().indexOf(corePermutation),
    type - 1,
    perspective - 1,
  ];

  const serializedCube = convertByteSize(
    raw,
    [...Array.from({ length: 20 }, () => 5), 2, 2, 2, 2, 2, 2, 5, 2, 1],
    8
  );

  return base64Encode(serializedCube);
};

export const deserializeCube = (data: string): IStorageData => {
  const serializedCube = base64Decode(data);

  // prettier-ignore
  const raw = convertByteSize(
        serializedCube, 
        8, 
        [...Array.from({ length: 20 }, () => 5), 2, 2, 2, 2, 2, 2, 5, 2, 1]
    )

  const corePermutation = Object.keys(coreOrientationMap).sort()[raw[26]];

  const state: number[] = [
    ...raw.slice(0, 12).map((el) => el + 2),
    ...raw.slice(12, 20).map((el, i) => el + 39),
    ...raw
      .slice(20, 26)
      .map((el, i) => el + 4 * (Number(corePermutation[i]) + 21)),
  ];

  const type: ECubeType = raw[27] + 1;
  const perspective: EPerspective = raw[28] + 1;

  return {
    type,
    perspective,
    state,
  };
};
