import React from "react";
import {
  point2DToIndex,
  TCanFaceRotate,
  COLOR_BITS,
  EDirection,
  TCubeState,
} from "../rubiks-cube";
import { base64Decode, base64Encode, clone, convertByteSize } from "../utils";
import { IStorageData } from "./CubeController";
import {
  defaultRenderFace,
  EPerspective,
  ICubeHandle,
  ICubeProps,
  RubiksCube,
  THandleClick,
  TRenderFace,
} from "./RubiksCube";

const CONSTRAINT_MASK = 0b11 << COLOR_BITS;
const DISTINCT_CONSTRAINTS = 3;

enum EConstraint {
  CounterClockwise = 1,
  Clockwise = 2,
}

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

export const latchCubeColors = [
  "white",
  "blue",
  "yellow",
  "green",
  "red",
  "grey",
];

export const serializeLatchCube = ({
  perspective = EPerspective.UNFOLDED,
  colors = latchCubeColors,
  state,
}: IStorageData) => {
  const colorIndices = colors.map((color) => allColors.indexOf(color));
  const serializedColors = convertByteSize(colorIndices, 4, 8);
  const serializedState = convertByteSize(
    [
      ...state[0],
      ...state[1],
      ...state[2],
      ...state[3],
      ...state[4],
      ...state[5],
    ],
    5,
    8
  );
  return base64Encode([
    ...serializedState,
    ...serializedColors,
    perspective << 4,
  ]).slice(0, -1);
};

const emptyColorIndices = [0, 0, 0, 0, 0, 0];

export const deserializeLatchCube = (data: string): IStorageData => {
  const decodedData = base64Decode(data);
  const perspective = Math.min(
    (decodedData[37] >> 4) & 0xf,
    EPerspective.ISOMETRIC
  );
  const colorIndices = [
    ...convertByteSize(decodedData.slice(34, 37), 8, 4),
    ...emptyColorIndices,
  ].slice(0, 6);
  const colors = colorIndices.map((el) => allColors[el]);
  const state = createSolvedLatchCubeState();
  const flatState = convertByteSize(decodedData.slice(0, 34), 8, 5);
  state[0] = [...flatState.slice(0, 9), ...state[0]].slice(0, 9);
  state[1] = [...flatState.slice(9, 18), ...state[1]].slice(0, 9);
  state[2] = [...flatState.slice(18, 27), ...state[2]].slice(0, 9);
  state[3] = [...flatState.slice(27, 36), ...state[3]].slice(0, 9);
  state[4] = [...flatState.slice(36, 45), ...state[4]].slice(0, 9);
  state[5] = [...flatState.slice(45, 54), ...state[5]].slice(0, 9);

  return {
    perspective,
    colors,
    state,
  };
};

const renderFace: TRenderFace = (renderProps) => {
  const elements = defaultRenderFace(renderProps);
  const { state, faceIndex, size, onRightClick } = renderProps;
  const faceConstraints = state[faceIndex].map(
    (el) => (el & CONSTRAINT_MASK) >> COLOR_BITS
  );
  for (let y = -1; y <= 1; y++) {
    for (let x = -1; x <= 1; x++) {
      const i = point2DToIndex(x, y);
      const text =
        faceConstraints[i] === EConstraint.Clockwise
          ? "CW"
          : faceConstraints[i] === EConstraint.CounterClockwise
          ? "CCW"
          : "";
      elements.push(
        <text
          key={`${i}t`}
          x={x * size}
          y={y * size}
          stroke="black"
          fill="none"
          onContextMenuCapture={onRightClick?.(state, faceIndex, x, y)}
        >
          {text}
        </text>
      );
    }
  }
  return elements;
};

const handleRightClick: THandleClick = (state, faceIndex, x, y) => {
  const newState = clone(state!);
  const i = point2DToIndex(x, y);
  const currentConstraint =
    (state[faceIndex][i] & CONSTRAINT_MASK) >> COLOR_BITS;
  const newConstraint = (currentConstraint + 1) % DISTINCT_CONSTRAINTS;
  newState[faceIndex][i] =
    (newState[faceIndex][i] & ~CONSTRAINT_MASK) | (newConstraint << COLOR_BITS);
  return newState;
};

const handleCanFaceRotate: TCanFaceRotate = (face, direction?) => {
  const constraints = face
    .map((el) => (el & CONSTRAINT_MASK) >> COLOR_BITS)
    .filter((el) => el);

  if (!constraints.length) {
    return true;
  }
  if (constraints.includes(constraints[0] ^ (CONSTRAINT_MASK >> COLOR_BITS))) {
    return false;
  }
  if (
    direction === EDirection.Clockwise &&
    constraints[0] !== EConstraint.Clockwise
  ) {
    return false;
  } else if (
    direction === EDirection.CounterClockwise &&
    constraints[0] !== EConstraint.CounterClockwise
  ) {
    return false;
  }

  return true;
};

export const createSolvedLatchCubeState = (): TCubeState => [
  [0, 8, 0, 0, 0, 0, 0, 8, 0],
  [1, 17, 1, 1, 1, 1, 1, 17, 1],
  [2, 2, 2, 10, 2, 10, 2, 2, 2],
  [3, 11, 3, 3, 3, 3, 3, 11, 3],
  [4, 4, 4, 20, 4, 20, 4, 4, 4],
  [5, 21, 5, 5, 5, 5, 5, 21, 5],
];

export const LatchCube = React.forwardRef<ICubeHandle, ICubeProps>(
  (props, ref) => {
    return (
      <RubiksCube
        ref={ref}
        colors={latchCubeColors}
        state={createSolvedLatchCubeState()}
        {...{ renderFace, handleCanFaceRotate, handleRightClick }}
        {...props}
      />
    );
  }
);
