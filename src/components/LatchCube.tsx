import React from "react";
import { ICubeCharacteristic } from "../cube-characteristics";
import texture from "../images/latch-cube.png";
import { stateToCube } from "../rubiks-cube/cube-util";
import latchCubies from "../rubiks-cube/latchCubies";
import { faceNames } from "../rubiks-cube/spatial-util";
import { TCubeState } from "../rubiks-cube/types";
import { getRubiksCubeMovesAllowed, RubiksCube } from "./RubiksCube";
import {
  ECubeType,
  ICubeHandle,
  ICubeProps,
  TRotateParam,
  TRotateParams,
} from "./RubiksCube.types";

const directions: Record<string, 1 | undefined | -1> = {
  "": 1,
  "2": undefined,
  "'": -1,
};

function getLatchCubeMovesAllowed(state: TCubeState) {
  const cube = stateToCube(state, latchCubies);

  const result: Record<string, boolean> = {};
  Object.keys(getRubiksCubeMovesAllowed(state)).forEach((move) => {
    result[move] = true;

    const faceName = move[0];
    const face = cube[(faceNames as Record<string, number>)[faceName]];
    if (!face) {
      return;
    }
    const constraint = face.find((el) => el);
    if (!constraint) {
      return;
    }
    const direction: 1 | undefined | -1 = directions[move[1] ?? ""];
    if (
      face.find((el) => el && el !== constraint) ||
      (direction && face.find((el) => el && el !== direction))
    ) {
      result[move] = false;
    }
  });

  return result;
}

const rotateParamFactory =
  (
    faceIndex: number,
    quarterTurns: number = 1,
    counterClockWise: boolean = false
  ) =>
  (state: TCubeState): TRotateParam => {
    const cube = stateToCube(state, latchCubies);

    const face = cube[faceIndex];
    const constraint = face.find((el) => el);
    switch (constraint) {
      case -1:
        return [faceIndex, 2, !counterClockWise];
      case 1:
        return [faceIndex, 2, counterClockWise];
      default:
        return [faceIndex, 2, counterClockWise];
    }
  };

export const latchCubeRotateParams: TRotateParams = {
  U: [0, 1, false],
  U2: rotateParamFactory(0, 2, false),
  "U'": [0, 1, true],
  L: [1, 1, true],
  L2: rotateParamFactory(1, 2, true),
  "L'": [1, 1, false],
  F: [2, 1, false],
  F2: rotateParamFactory(2, 2, false),
  "F'": [2, 1, true],
  R: [3, 1, false],
  R2: rotateParamFactory(3, 2, false),
  "R'": [3, 1, true],
  B: [4, 1, true],
  B2: rotateParamFactory(4, 2, true),
  "B'": [4, 1, false],
  D: [5, 1, true],
  D2: rotateParamFactory(5, 2, true),
  "D'": [5, 1, false],
};

export const latchCubeCharacteristic: ICubeCharacteristic = {
  name: "Latch Cube",
  type: ECubeType.Latch,
  texture,
  getMovesAllowed: getLatchCubeMovesAllowed,
  rotateParams: latchCubeRotateParams,
};

export const LatchCube = React.forwardRef<
  ICubeHandle,
  Omit<ICubeProps, "texture">
>(({ cubeState, perspective, onChange }, forwardRef) => (
  <RubiksCube
    ref={forwardRef}
    {...{
      cubeState,
      texture,
      perspective,
      onChange,
      rotateParams: latchCubeRotateParams,
    }}
  />
));
