import React from "react";
import { ICubeCharacteristic } from "../cube-characteristics";
import texture from "../images/number-cube.png";
import { rubiksCubeRotateParams } from "./Cube3D";
import { getRubiksCubeMovesAllowed, RubiksCube } from "./RubiksCube";
import { ECubeType, ICubeProps } from "./RubiksCube.types";

export const earthCubeCharacteristic: ICubeCharacteristic = {
  name: "Earth Cube",
  type: ECubeType.Earth,
  hidden: true,
  texture,
  getMovesAllowed: getRubiksCubeMovesAllowed,
  rotateParams: rubiksCubeRotateParams,
};

export const EarthCube = ({
  cubeState,
  perspective,
  onChange,
}: Omit<ICubeProps, "texture">) => (
  <RubiksCube
    {...{
      cubeState,
      texture,
      perspective,
      onChange,
    }}
  />
);
