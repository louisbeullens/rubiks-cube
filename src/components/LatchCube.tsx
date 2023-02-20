import React from "react";
import {
  point2DToIndex,
  TCanFaceRotate,
  COLOR_BITS,
  EDirection,
  TCubeState,
} from "../rubiks-cube";
import { clone } from "../utils";
import {
  defaultRenderFace,
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

const renderFace: TRenderFace = (renderProps) => {
  const elements = defaultRenderFace(renderProps);
  const { state, faceIndex, size, onRightClick } =
    renderProps;
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

export const latchCubeColors = [
  "white",
  "blue",
  "yellow",
  "green",
  "red",
  "grey",
];

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
