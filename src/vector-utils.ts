import { TAxisName } from "./rubiks-cube/spatial-util";

interface IPoint3D {
  x: number;
  y: number;
  z: number;
}

export type TVectorEntry = [TAxisName, number];
export type TVectorEntries = TVectorEntry[];

export const vectorToEntries = (point3D: IPoint3D) => {
  return [
    ["x", point3D.x],
    ["y", point3D.y],
    ["z", point3D.z],
  ] as TVectorEntries;
};

export const sortVectorEntries = (entries: TVectorEntries, order = "yzx") => {
  entries.sort(([axisA, valueA], [axisB, valueB]) =>
    Math.abs(valueA) === Math.abs(valueB)
      ? order.indexOf(axisA) - order.indexOf(axisB)
      : Math.abs(valueA) - Math.abs(valueB)
  );
  return entries;
};
