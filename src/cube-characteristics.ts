import { IStorageData } from "./components/CubeStorage.types";
import {
  EPerspective,
  THandleClick,
  TRenderFace,
} from "./components/RubiksCube.types";
import { createSolvedState, TCanFaceRotate, TCubeState } from "./rubiks-cube";
import { base64Decode, base64Encode, convertByteSize } from "./utils";

export enum ECubeType {
  Rubiks = 1,
  Latch = 2,
}

export interface ICubeCharacteristic {
  name: string;
  type: ECubeType;
  significantBits: number;
  colors: string[];
  createSolvedState: () => TCubeState;
  handleLeftClick?: THandleClick;
  handleRightClick?: THandleClick;
  handleCanFaceRotate?: TCanFaceRotate;
  renderFace?: TRenderFace;
}

const registeredCubes: { [type: number]: ICubeCharacteristic } = {};

export const registerCube = (characteristics: ICubeCharacteristic) => {
  registeredCubes[characteristics.type] = characteristics;
};

export const getAllCubeCharacteristics = (): ICubeCharacteristic[] =>
  Object.values(registeredCubes);

export const getCubeCharacteristicsByType = (type: ECubeType) =>
  registeredCubes[type];

const allColors = [
  "black",
  "white",
  "green",
  "red",
  "blue",
  "orange",
  "yellow",
  "grey",
  "white",
  "white",
  "white",
  "white",
  "white",
  "white",
  "silver",
  "gold",
];

export const serializeCube = (
  { type, perspective, colors, state }: IStorageData,
  significantBits = 5
) => {
  const stateEndIndex = Math.ceil((54 * significantBits) / 8);
  const serializedState = convertByteSize(
    [
      ...state[0],
      ...state[1],
      ...state[2],
      ...state[3],
      ...state[4],
      ...state[5],
    ],
    significantBits,
    8
  );
  serializedState[stateEndIndex - 1] |= (perspective - 1) % 0b11;
  const colorIndices = colors.map((color) => allColors.indexOf(color));
  const serializedColors = convertByteSize(colorIndices, 4, 8);

  return base64Encode([
    ...serializedState,
    ...serializedColors,
    (type - 1) << 4,
  ]).slice(0, -1);
};

const emptyColorIndices = [0, 0, 0, 0, 0, 0];

export const deserializeCube = (data: string): IStorageData => {
  const decodedData = base64Decode(data);
  const type = Math.min(
    ((decodedData.at(-1)! >> 4) & 0xf) + 1,
    ECubeType.Latch
  );
  const characteristic = getCubeCharacteristicsByType(type);
  const significantBits = characteristic.significantBits;
  const state = createSolvedState();
  const stateEndIndex = Math.ceil((54 * significantBits) / 8);
  const colorEndIndex = stateEndIndex + 3;
  const perspective = Math.min(
    ((decodedData[stateEndIndex - 1] | 0) & 0b11) + 1,
    EPerspective.ISOMETRIC
  );
  const flatState = convertByteSize(
    decodedData.slice(0, stateEndIndex),
    8,
    significantBits
  );
  state[0] = [...flatState.slice(0, 9), ...state[0]].slice(0, 9);
  state[1] = [...flatState.slice(9, 18), ...state[1]].slice(0, 9);
  state[2] = [...flatState.slice(18, 27), ...state[2]].slice(0, 9);
  state[3] = [...flatState.slice(27, 36), ...state[3]].slice(0, 9);
  state[4] = [...flatState.slice(36, 45), ...state[4]].slice(0, 9);
  state[5] = [...flatState.slice(45, 54), ...state[5]].slice(0, 9);
  const colorIndices = [
    ...convertByteSize(decodedData.slice(stateEndIndex, colorEndIndex), 8, 4),
    ...emptyColorIndices,
  ].slice(0, 6);
  const colors = colorIndices.map((el) => allColors[el]);

  return {
    type,
    perspective,
    colors,
    state,
  };
};
