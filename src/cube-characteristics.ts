import { ECubeType, TRotateParams } from "./components/RubiksCube.types";
import { TCubeState } from "./rubiks-cube/types";

export interface ICubeCharacteristic {
  name: string;
  type: ECubeType;
  hidden?: boolean;
  texture: string;
  getMovesAllowed: (state: TCubeState) => Record<string, boolean>;
  rotateParams: TRotateParams;
}

const registeredCubes: { [type: number]: ICubeCharacteristic } = {};

export const registerCube = (characteristics: ICubeCharacteristic) => {
  registeredCubes[characteristics.type] = characteristics;
};

export const getAllCubeCharacteristics = (): ICubeCharacteristic[] =>
  Object.values(registeredCubes);

export const getCubeCharacteristicsByType = (type: ECubeType) =>
  registeredCubes[type];
