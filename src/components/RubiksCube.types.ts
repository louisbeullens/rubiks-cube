import { TCubeState } from "../rubiks-cube/types";

export enum ECubeType {
  Rubiks = 1,
  Latch = 2,
  Earth = 3,
}

export enum EPerspective {
  UNFOLDED = 1,
  THREE_DIMENSIONAL = 2,
  ISOMETRIC = 3,
}

export interface ICubeProps {
  cubeState?: TCubeState;
  texture?: string;
  perspective?: EPerspective;
  scale?: number;
  onChange?: (cubeState: TCubeState) => void;
  onSwipeU?: (faceIndex: number, uDirection: number, vPoint: number) => void;
  onSwipeV?: (faceIndex: number, uPoint: number, vDirection: number) => void;
}

export interface ICubeHandle {
  cubeState: TCubeState;
}
