import {
  allMoves,
  EFaceIndex,
  TCanFaceRotate,
  TCubeState,
} from "../rubiks-cube";

export type THandleClick = (
  state: TCubeState,
  faceIndex: EFaceIndex,
  x: number,
  y: number
) => TCubeState;

export type TRenderFace = (renderProps: {
  state: TCubeState;
  faceIndex: EFaceIndex;
  scale: number;
  size: number;
  colors: string[];
  onLeftClick?: (
    ...params: Parameters<THandleClick>
  ) => React.MouseEventHandler;
  onRightClick?: (
    ...params: Parameters<THandleClick>
  ) => React.MouseEventHandler;
}) => JSX.Element[];

type TCallback = (newState: TCubeState, previousState: TCubeState) => void;

export interface ICubeHandle {
  canFaceRotate?: TCanFaceRotate;
  canRotateByMoveName: (move: keyof typeof allMoves) => boolean;
  rotateByMoveName: (move: keyof typeof allMoves) => TCubeState | undefined;
  getState: () => TCubeState;
}

export interface ICubeProps extends React.RefAttributes<ICubeHandle> {
  scale?: number;
  editable?: boolean;
  perspective?: EPerspective;
  colors?: string[];
  state?: TCubeState;
  initialState?: TCubeState;
  renderFace?: TRenderFace;
  handleCanFaceRotate?: TCanFaceRotate;
  handleLeftClick?: THandleClick;
  handleRightClick?: THandleClick;
  onChange?: TCallback;
  onLeftClick?: TCallback;
  onRightClick?: TCallback;
}

export enum EPerspective {
  UNFOLDED = 1,
  ISOMETRIC = 2,
}
