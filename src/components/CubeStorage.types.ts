import { TCubeState } from "../rubiks-cube/types";
import { ECubeType, EPerspective } from "./RubiksCube.types";

export interface IStorageData {
  type: ECubeType;
  perspective: EPerspective;
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
