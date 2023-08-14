import React from "react";
import isEqual from "lodash/isEqual";
import { ICubeCharacteristic } from "../cube-characteristics";
import defaultTexture from "../images/rubiks-cube.png";
import fundamentalOperations from "../rubiks-cube/fundamentalOperations";
import { createOperationMap } from "../rubiks-cube/operation-util";
import { faceNames as untypedFaceNames } from "../rubiks-cube/spatial-util";
import { TCubeState } from "../rubiks-cube/types";
import { Cube3D } from "./Cube3D";
import {
  ECubeType,
  EPerspective,
  ICubeHandle,
  ICubeProps,
} from "./RubiksCube.types";
import SVGCube from "./SVGCube";

const faceNames = untypedFaceNames as Record<string, number>;

const operations = createOperationMap(fundamentalOperations);

export function getRubiksCubeMovesAllowed(state: TCubeState) {
  const result: Record<string, boolean> = {};

  Object.keys(operations)
    .filter((move) => move.length <= 2 && !["M", "E", "S"].includes(move[0]))
    .sort((a, b) =>
      a[0] in faceNames && b[0] in faceNames && a[0] !== b[0]
        ? faceNames[a[0]] - faceNames[b[0]]
        : a.localeCompare(b)
    )
    .forEach((move) => {
      result[move] = true;
    });

  return result;
}

export const rubiksCharacteristic: ICubeCharacteristic = {
  name: "Rubik's Cube",
  type: ECubeType.Rubiks,
  texture: defaultTexture,
  getMovesAllowed: getRubiksCubeMovesAllowed,
};

export const RubiksCube = React.forwardRef<ICubeHandle, ICubeProps>(
  (
    {
      cubeState,
      texture = defaultTexture,
      perspective = EPerspective.UNFOLDED,
      scale = 0.5,
      onChange,
      onSwipeU,
      onSwipeV,
    },
    forwardRef
  ) => {
    switch (perspective) {
      default:
      case EPerspective.UNFOLDED:
      case EPerspective.ISOMETRIC:
        return (
          <SVGCube
            ref={forwardRef}
            {...{
              cubeState,
              texture,
              perspective,
              scale,
              onChange,
              onSwipeU,
              onSwipeV,
            }}
          />
        );
      case EPerspective.THREE_DIMENSIONAL:
        return (
          <Cube3D
            ref={forwardRef}
            {...{
              cubeState,
              texture,
              perspective,
              scale,
              onChange,
              onSwipeU,
              onSwipeV,
            }}
          />
        );
    }
  }
);

export default React.memo(RubiksCube, (prevProps, nextProps) => {
  if (Object.keys(prevProps).length !== Object.keys(nextProps).length) {
    return false;
  }
  for (const key in nextProps) {
    if (
      key === "cubeState" &&
      !isEqual(prevProps.cubeState, nextProps.cubeState)
    ) {
      return false;
    } else if ((prevProps as any)[key] !== (nextProps as any)[key]) {
      return false;
    }
  }
  return true;
});
