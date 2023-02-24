import React from "react";

import { ECubeType, ICubeCharacteristic } from "../cube-characteristics";
import { useLatestRef, usePropOverState } from "../hooks";
import {
  canRotateByMoveName,
  COLOR_MASK,
  createSolvedState,
  EFaceIndex,
  point2DToIndex,
  rotateByMoveName,
  TCubeState,
} from "../rubiks-cube";
import { clone } from "../utils";

import {
  EPerspective,
  ICubeHandle,
  ICubeProps,
  THandleClick,
  TRenderFace,
} from "./RubiksCube.types";

const SIZE = 50;

const rubiksCubeColors = ["white", "green", "red", "blue", "orange", "yellow"];

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
          strokeWidth={1 / scale}
        />
      );
    }
  }
  return elements;
};

export const rubiksCubeCharacteristics: ICubeCharacteristic = {
  name: "Rubik's Cube",
  type: ECubeType.Rubiks,
  significantBits: 3,
  colors: rubiksCubeColors,
  createSolvedState,
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
      scale = 1,
      editable = true,
      colors = rubiksCubeColors,
      perspective: perspectiveType,
      state: stateProp,
      initialState,
      renderFace: renderFaceProp,
      handleCanFaceRotate,
      handleLeftClick,
      handleRightClick,
      onChange,
      onLeftClick,
      onRightClick,
    },
    forwardedRef
  ) => {
    perspectiveType = perspectiveType ?? EPerspective.UNFOLDED;
    const renderFace = renderFaceProp ?? defaultRenderFace;
    handleLeftClick = handleLeftClick ?? defaultHandleLeftClick;

    const [state, setState] = usePropOverState(
      initialState ?? createSolvedState(),
      stateProp
    );

    const handleCanFaceRotateRef = useLatestRef(handleCanFaceRotate);
    const handleLeftClickRef = useLatestRef(handleLeftClick);
    const handleRightClickRef = useLatestRef(handleRightClick);
    const onChangeRef = useLatestRef(onChange);
    const onLeftClickRef = useLatestRef(onLeftClick);
    const onRightClickRef = useLatestRef(onRightClick);

    const perspective = perspectives[perspectiveType];

    const canRotateCubeByMoveName = React.useCallback<
      ICubeHandle["canRotateByMoveName"]
    >(
      (move) =>
        canRotateByMoveName(state, move, handleCanFaceRotateRef.current),
      [state]
    );

    const rotateCubeByMoveName = React.useCallback<
      ICubeHandle["rotateByMoveName"]
    >(
      (move) => {
        const newState = rotateByMoveName(
          state,
          move,
          handleCanFaceRotateRef.current
        );
        if (!newState) {
          return undefined;
        }
        setState(newState);
        onChangeRef.current?.(newState, state);
        return newState;
      },
      [state, setState]
    );

    const getState = React.useCallback<ICubeHandle["getState"]>(
      () => state,
      [state]
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
        if (!editable) {
          return;
        }
        const newState = handleLeftClickRef.current(state, faceIndex, x, y);
        if (!newState) {
          return;
        }
        setState(newState);
        onLeftClickRef.current?.(newState, state);
      };

    const handleRightClickWrapper =
      (state: TCubeState, faceIndex: EFaceIndex, x: number, y: number) =>
      (e: React.MouseEvent) => {
        if (!editable) {
          return;
        }
        e.preventDefault();
        const newState = handleRightClickRef.current?.(state, faceIndex, x, y);
        if (!newState) {
          return;
        }
        setState(newState);
        onRightClickRef.current?.(newState, state);
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
                  state,
                  faceIndex,
                  scale,
                  size: SIZE,
                  colors,
                  onLeftClick: handleLeftClickWrapper,
                  onRightClick: handleRightClickWrapper,
                })}
              </g>
            );
          })}
        </g>
      </svg>
    );
  }
);
