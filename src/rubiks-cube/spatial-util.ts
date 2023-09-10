export type TAxisName = "x" | "y" | "z";

export interface IPoint3D {
  x: number;
  y: number;
  z: number;
}

interface IFaceInfoEntry {
  axis: TAxisName;
  direction: number;
  textureU: number;
  textureV: number;
  uvMapping: { axis: TAxisName; direction: number }[];
}

export const faceNames = {
  U: 0,
  L: 1,
  F: 2,
  R: 3,
  B: 4,
  D: 5,
};

export const faceIndices = Object.values(faceNames);

export const faceInfo: Record<number, IFaceInfoEntry> = {
  [faceNames.U]: {
    axis: "y",
    direction: 1,
    textureU: 1,
    textureV: 0,
    uvMapping: [
      { axis: "x", direction: 1 },
      { axis: "z", direction: 1 },
    ],
  },
  [faceNames.L]: {
    axis: "x",
    direction: -1,
    textureU: 0,
    textureV: 1,
    uvMapping: [
      { axis: "z", direction: 1 },
      { axis: "y", direction: -1 },
    ],
  },
  [faceNames.F]: {
    axis: "z",
    direction: 1,
    textureU: 1,
    textureV: 1,
    uvMapping: [
      { axis: "x", direction: 1 },
      { axis: "y", direction: -1 },
    ],
  },
  [faceNames.R]: {
    axis: "x",
    direction: 1,
    textureU: 2,
    textureV: 1,
    uvMapping: [
      { axis: "z", direction: -1 },
      { axis: "y", direction: -1 },
    ],
  },
  [faceNames.B]: {
    axis: "z",
    direction: -1,
    textureU: 3,
    textureV: 1,
    uvMapping: [
      { axis: "x", direction: -1 },
      { axis: "y", direction: -1 },
    ],
  },
  [faceNames.D]: {
    axis: "y",
    direction: -1,
    textureU: 1,
    textureV: 2,
    uvMapping: [
      { axis: "x", direction: 1 },
      { axis: "z", direction: -1 },
    ],
  },
};

export function uvToIndex(u: number, v: number) {
  return 3 * v + u + 4;
}

export function point3DtoUv(point3D: IPoint3D, faceIndex: number) {
  const { axis, direction, uvMapping } = faceInfo[faceIndex];

  if (point3D[axis] !== direction) {
    return;
  }

  const [uAxis, vAxis] = uvMapping;
  const { x, y, z } = point3D;

  const u =
    uAxis.axis === "x"
      ? x * uAxis.direction
      : uAxis.axis === "y"
      ? y * uAxis.direction
      : z * uAxis.direction;
  const v =
    vAxis.axis === "x"
      ? x * vAxis.direction
      : vAxis.axis === "y"
      ? y * vAxis.direction
      : z * vAxis.direction;

  return {
    faceIndex,
    axis,
    direction,
    u,
    v,
  };
}

export function uvToPoint3D(faceIndex: number, u: number, v: number) {
  const { axis, direction, uvMapping } = faceInfo[faceIndex];

  const [uAxis, vAxis] = uvMapping;

  const x =
    axis === "x"
      ? direction
      : uAxis.axis === "x"
      ? u * uAxis.direction
      : v * vAxis.direction;

  const y =
    axis === "y"
      ? direction
      : uAxis.axis === "y"
      ? u * uAxis.direction
      : v * vAxis.direction;

  const z =
    axis === "z"
      ? direction
      : uAxis.axis === "z"
      ? u * uAxis.direction
      : v * vAxis.direction;

  return { x, y, z };
}

export function getFacesOfPoint3D(point3D: IPoint3D) {
  const faces: NonNullable<ReturnType<typeof point3DtoUv>>[] = [];
  faceIndices.forEach((faceIndex) => {
    const uvInfo = point3DtoUv(point3D, faceIndex);
    if (!uvInfo) {
      return;
    }
    faces.push(uvInfo);
  });
  return faces;
}
