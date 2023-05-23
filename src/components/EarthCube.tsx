import React from "react";
import { ICubeCharacteristic } from "../cube-characteristics";
import texture from "../images/earth-cube.png";
import {
  getRubiksCubeMovesAllowed,
  ICubeProps,
  RubiksCube,
} from "./RubiksCube";
import { ECubeType } from "./RubiksCube.types";

export const earthCubeCharacteristic: ICubeCharacteristic = {
  name: "Earth Cube",
  type: ECubeType.Earth,
  hidden: true,
  texture,
  getMovesAllowed: getRubiksCubeMovesAllowed,
};

export const EarthCube: React.FC<Omit<ICubeProps, "texture">> = ({
  cubeState,
  perspective,
  onChange,
}) => (
  <RubiksCube
    {...{
      cubeState,
      texture,
      perspective,
      onChange,
    }}
  />
);