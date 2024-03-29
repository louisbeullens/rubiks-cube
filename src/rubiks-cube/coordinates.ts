import { IPoint3D } from "./spatial-util";

const coordinates: IPoint3D[] = [
  // edges
  { x: -1, y: -1, z: 0 }, //  0
  { x: -1, y: 0, z: -1 }, //  1
  { x: -1, y: 1, z: 0 }, //  2
  { x: -1, y: 0, z: 1 }, //  3
  { x: 0, y: -1, z: -1 }, //  4
  { x: 0, y: 1, z: -1 }, //  5
  { x: 0, y: -1, z: 1 }, //  6
  { x: 0, y: 1, z: 1 }, //  7
  { x: 1, y: -1, z: 0 }, //  8
  { x: 1, y: 0, z: -1 }, //  9
  { x: 1, y: 1, z: 0 }, // 10
  { x: 1, y: 0, z: 1 }, // 11
  // corners
  { x: -1, y: -1, z: -1 }, // 12
  { x: -1, y: -1, z: 1 }, // 13
  { x: -1, y: 1, z: 1 }, // 14
  { x: -1, y: 1, z: -1 }, // 15
  { x: 1, y: -1, z: 1 }, // 16
  { x: 1, y: -1, z: -1 }, // 17
  { x: 1, y: 1, z: -1 }, // 18
  { x: 1, y: 1, z: 1 }, // 19
];

export default coordinates;
