import React from "react";
import { ICubeCharacteristic } from "../cube-characteristics";
import texture from "../images/latch-cube.png";
import { stateToCube } from "../rubiks-cube/cube-util";
import latchCubies from "../rubiks-cube/latchCubies";
import { faceNames } from "../rubiks-cube/spatial-util";
import { TCubeState } from "../rubiks-cube/types";
import { getRubiksCubeMovesAllowed, RubiksCube } from "./RubiksCube";
import { ECubeType, ICubeHandle, ICubeProps } from "./RubiksCube.types";

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

export const latchCubeCharacteristic: ICubeCharacteristic = {
  name: "Latch Cube",
  type: ECubeType.Latch,
  texture,
  getMovesAllowed: getLatchCubeMovesAllowed,
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
    }}
  />
));
