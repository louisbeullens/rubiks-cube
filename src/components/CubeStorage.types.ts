import { ECubeType } from "../cube-characteristics";
import { TCubeState } from "../rubiks-cube";

import { EPerspective } from "./RubiksCube.types";

export interface IStorageData {
  type: ECubeType;
  perspective: EPerspective;
  colors: string[];
  state: TCubeState;
}

export interface ICubeStorageHandle {
  save: (data: IStorageData, createNwe?: boolean) => void;
  load: () => IStorageData | undefined;
}

export interface ICubeStorageProps
  extends React.RefAttributes<ICubeStorageHandle> {
  onChange?: (data: IStorageData | undefined) => void;
}

export const SIZE = 25;
export const CONTAINER_WIDTH = `${15 * SIZE}px`;
