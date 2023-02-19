import React from "react";
import {
  allMoves,
  canRotateByMoveName,
  COLOR_MASK,
  createSolvedState,
  EFaceIndex,
  point2DToIndex,
  rotateByMoveName,
  TCanFaceRotate,
  TCubeState,
} from "../rubiks-cube";
import { clone } from "../utils";

const SIZE = 50;

export type THandleClick = (
  state: TCubeState,
  faceIndex: EFaceIndex,
  x: number,
  y: number
) => TCubeState;

export type TRenderFace = (renderProps: {
  state: TCubeState;
  faceIndex: EFaceIndex;
  scale: number,
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
  rotateByMoveName: (move: keyof typeof allMoves) => void;
  getState: () => TCubeState;
}

export interface ICubeProps extends React.RefAttributes<ICubeHandle> {
  scale?: number,
  editable?: boolean;
  perspective?: EPerspective;
  colors?: string[];
  state?: TCubeState;
  renderFace?: TRenderFace;
  handleLeftClick?: THandleClick;
  handleRightClick?: THandleClick;
  onLeftClick?: TCallback;
  onRightClick?: TCallback;
  onChange?: TCallback;
  handleCanFaceRotate?: TCanFaceRotate;
}

export enum EPerspective {
  UNFOLDED = 1,
  ISOMETRIC = 2,
}

export const rubiksCubeColors = [
  "white",
  "green",
  "red",
  "blue",
  "orange",
  "yellow",
];

const defaultHandleLeftClick: THandleClick = (state, faceIndex, x, y) => {
  const newState = clone(state);
  const i = point2DToIndex(x, y);
  const currentColorIndex = newState[faceIndex][i] & COLOR_MASK;
  const newColorIndex = (currentColorIndex + 1) % rubiksCubeColors.length;
  newState[faceIndex][i] =
    (newState[faceIndex][i] & ~COLOR_MASK) | newColorIndex;
  return newState;
};

export const defaultRenderFace: TRenderFace = ({
  state,
  faceIndex,
  scale,
  size,
  colors,
  onLeftClick,
  onRightClick,
}) => {
  const faceColors = state[faceIndex].map((el) => el & COLOR_MASK);

  const elements: JSX.Element[] = [];
  for (let y = -1; y <= 1; y++) {
    for (let x = -1; x <= 1; x++) {
      const i = point2DToIndex(x, y);
      elements.push(
        <rect
          key={i}
          x={(x - 0.5) * size}
          y={(y - 0.5) * size}
          width={size}
          height={size}
          stroke="black"
          fill={colors[faceColors[i]]}
          onClick={onLeftClick?.(state, faceIndex, x, y)}
          onContextMenuCapture={onRightClick?.(state, faceIndex, x, y)}
          strokeWidth={1/scale}
        />
      );
    }
  }
  return elements;
};

const perspectives = {
  [EPerspective.UNFOLDED]: {
    [EFaceIndex["y+"]]: {
      transform: `translate(${4.5 * SIZE} ${1.5 * SIZE}) scale(1 1)`,
      textTransform: ``,
    },
    [EFaceIndex["x-"]]: {
      transform: `translate(${1.5 * SIZE} ${4.5 * SIZE}) scale(1 -1)`,
      textTransform: ``,
    },
    [EFaceIndex["z+"]]: {
      transform: `translate(${4.5 * SIZE} ${4.5 * SIZE}) scale(1 -1)`,
      textTransform: ``,
    },
    [EFaceIndex["x+"]]: {
      transform: `translate(${7.5 * SIZE} ${4.5 * SIZE}) scale(-1 -1)`,
      textTransform: ``,
    },
    [EFaceIndex["z-"]]: {
      transform: `translate(${10.5 * SIZE} ${4.5 * SIZE}) scale(-1 -1)`,
      textTransform: ``,
    },
    [EFaceIndex["y-"]]: {
      transform: `translate(${4.5 * SIZE} ${7.5 * SIZE}) scale(1 -1)`,
      textTransform: ``,
    },
  },
  [EPerspective.ISOMETRIC]: {
    [EFaceIndex["y+"]]: {
      transform: `translate(${3 * SIZE} ${3 * SIZE}) rotate(45) scale(${
        Math.SQRT2
      } ${Math.SQRT2})`,
      textTransform: ``,
    },
    [EFaceIndex["x-"]]: {
      transform: `translate(${9 * SIZE} ${3 * SIZE}) skewY(-45) scale(-1 -1)`,
      textTransform: ``,
    },
    [EFaceIndex["z+"]]: {
      transform: `translate(${1.5 * SIZE} ${6 * SIZE}) skewY(45) scale(1 -1)`,
      textTransform: ``,
    },
    [EFaceIndex["x+"]]: {
      transform: `translate(${4.5 * SIZE} ${6 * SIZE}) skewY(-45) scale(-1 -1)`,
      textTransform: ``,
    },
    [EFaceIndex["z-"]]: {
      transform: `translate(${12 * SIZE} ${3 * SIZE}) skewY(45) scale(1 -1)`,
      textTransform: ``,
    },
    [EFaceIndex["y-"]]: {
      transform: `translate(${10.5 * SIZE} ${6 * SIZE}) rotate(45) scale(${
        Math.SQRT2
      } ${Math.SQRT2})`,
      textTransform: ``,
    },
  },
};

export const RubiksCube = React.forwardRef<ICubeHandle, ICubeProps>(
  (
    {
      scale=1,
      editable = true,
      colors = rubiksCubeColors,
      perspective: perspectiveType,
      state: stateProp,
      renderFace: renderFaceProp,
      handleCanFaceRotate,
      handleLeftClick,
      handleRightClick,
      onLeftClick,
      onRightClick,
      onChange,
    },
    forwardedRef
  ) => {
    perspectiveType = perspectiveType || EPerspective.UNFOLDED;
    const renderFace = renderFaceProp || defaultRenderFace;
    handleLeftClick = handleLeftClick || defaultHandleLeftClick;

    const [state, setState] = React.useState(stateProp || createSolvedState());
    const statePropOrState = stateProp || state;

    const perspective = perspectives[perspectiveType];

    const canRotateCubeByMoveName = React.useCallback<
      ICubeHandle["canRotateByMoveName"]
    >(
      (move) =>
        canRotateByMoveName(statePropOrState, move, handleCanFaceRotate),
      [statePropOrState, handleCanFaceRotate]
    );

    const rotateCubeByMoveName = React.useCallback<
      ICubeHandle["rotateByMoveName"]
    >(
      (move) => {
        const newState = rotateByMoveName(
          stateProp || state,
          move,
          handleCanFaceRotate
        );
        if (!newState) {
          return;
        }
        onChange?.(newState, stateProp || state);
        if (!stateProp) {
          setState(newState);
        }
      },
      [state, stateProp, onChange, handleCanFaceRotate]
    );

    const getState = React.useCallback<ICubeHandle["getState"]>(
      () => statePropOrState,
      [statePropOrState]
    );

    React.useImperativeHandle(
      forwardedRef,
      () => ({
        canFaceRotate: handleCanFaceRotate,
        canRotateByMoveName: canRotateCubeByMoveName,
        rotateByMoveName: rotateCubeByMoveName,
        getState,
      }),
      [
        canRotateCubeByMoveName,
        rotateCubeByMoveName,
        getState,
        handleCanFaceRotate,
      ]
    );

    const handleLeftClickWrapper =
      (state: TCubeState, faceIndex: EFaceIndex, x: number, y: number) =>
      () => {
        if (!editable || !handleLeftClick) {
          return;
        }
        const newState = handleLeftClick(state, faceIndex, x, y);
        if (!newState) {
          return;
        }
        if (!stateProp) {
          setState(newState);
        }
        onLeftClick?.(newState, state);
      };

    const handleRightClickWrapper =
      (state: TCubeState, faceIndex: EFaceIndex, x: number, y: number) =>
      (e: React.MouseEvent) => {
        if (!editable || !handleRightClick) {
          return;
        }
        e.preventDefault();
        const newState = handleRightClick(state, faceIndex, x, y);
        if (!newState) {
          return;
        }
        if (!stateProp) {
          setState(newState);
        }
        onRightClick?.(newState, state);
      };

    const width = 14 * SIZE * scale;
    const height = 9 * SIZE * scale;

    return (
      <svg {...{ width, height }}>
        <g transform={`scale(${scale})`}>

        {[0, 1, 2, 3, 4, 5].map((faceIndex: EFaceIndex) => {
          return (
            <g key={faceIndex} transform={perspective[faceIndex].transform}>
              {renderFace({
                state: statePropOrState,
                faceIndex,
                scale,
                size: SIZE,
                colors,
                onLeftClick: handleLeftClickWrapper,
                onRightClick: handleRightClickWrapper
              })}
            </g>
          );
        })}
        </g>
      </svg>
    );
  }
);
