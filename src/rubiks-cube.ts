import { clone } from "./utils";

interface IPoint3D {
  x: number;
  y: number;
  z: number;
}

type TAxis = "x" | "y" | "z";
type TColorAndConstraint = number;

export type TFace = TColorAndConstraint[];
export type TCubeState = TFace[];

export enum EFaceIndex {
  "y+",
  "x-",
  "z+",
  "x+",
  "z-",
  "y-",
}

export enum EDirection {
  Clockwise = -1,
  CounterClockwise = 1
}

export const COLOR_MASK = 0b00111;
export const COLOR_BITS = Math.ceil(Math.log2(COLOR_MASK))

export const point2DToIndex = (x: number, y: number) => 3 * y + x + 4;

const rotationInfo: {
  [axis: string]: { matrix: DOMMatrixReadOnly; pointMapping: [TAxis, TAxis] };
} = {
  //    x  y  z  w
  // x  1  0  0  0
  // y  0  0 -1  0
  // z  0  1  0  0
  // w  0  0  0  1
  x: {
    matrix: new DOMMatrixReadOnly([
      1, 0, 0, 0, 0, 0, 1, 0, 0, -1, 0, 0, 0, 0, 0, 1,
    ]),
    pointMapping: ["z", "y"],
  },
  //    x  y  z  w
  // x  0  0  1  0
  // y  0  1  0  0
  // z -1  0  0  0
  // w  0  0  0  1
  y: {
    matrix: new DOMMatrixReadOnly([
      0, 0, -1, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1,
    ]),
    pointMapping: ["x", "z"],
  },
  //    x  y  z  w
  // x  0 -1  0  0
  // y  1  0  0  0
  // z  0  0  1  0
  // w  0  0  0  1
  z: {
    matrix: new DOMMatrixReadOnly([
      0, 1, 0, 0, -1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1,
    ]),
    pointMapping: ["x", "y"],
  },
};

const ijToPoint3D = (i: number, j: number, faceIndex: EFaceIndex) => {
  const faceName = EFaceIndex[faceIndex];
  const { pointMapping } = rotationInfo[faceName[0]];
  const point3D = { x: 0, y: 0, z: 0 };
  const axisDirection = faceName[1] === "-" ? -1 : 1;

  const indexOfXInPoint = pointMapping.indexOf("x");
  const indexOfYInPoint = pointMapping.indexOf("y");
  const indexOfZInPoint = pointMapping.indexOf("z");

  point3D.x =
    indexOfXInPoint === 0 ? i : indexOfXInPoint === 1 ? j : axisDirection;
  point3D.y =
    indexOfYInPoint === 0 ? i : indexOfYInPoint === 1 ? j : axisDirection;
  point3D.z =
    indexOfZInPoint === 0 ? i : indexOfZInPoint === 1 ? j : axisDirection;

  return point3D;
};

const point3DToIj = (point3D: IPoint3D, faceIndex: EFaceIndex) => {
  const faceName = EFaceIndex[faceIndex];
  const axis = faceName[0] as TAxis;
  const axisDirection = faceName[1] === "-" ? -1 : 1;
  if (point3D[axis] !== axisDirection) {
    return undefined;
  }
  const { pointMapping } = rotationInfo[faceName[0]];

  const indexOfXInPoint = pointMapping.indexOf("x");
  const indexOfYInPoint = pointMapping.indexOf("y");
  const { x, y, z } = point3D;
  const i = indexOfXInPoint === 0 ? x : indexOfYInPoint === 0 ? y : z;
  const j = indexOfXInPoint === 1 ? x : indexOfYInPoint === 1 ? y : z;

  return { faceIndex, faceDirection: axisDirection, i, j };
};

const faceIndexToPoint3D = (faceIndex: EFaceIndex) => {
  const faceName = EFaceIndex[faceIndex];
  const axis = faceName[0] as TAxis;
  const axisDirection = faceName[1] === "-" ? -1 : 1;
  const point3D = { x: 0, y: 0, z: 0 };

  point3D[axis] = axisDirection;

  return point3D;
};

const point3DToFaceIndex = ({ x, y, z }: IPoint3D) => {
  let faceIndex: EFaceIndex | undefined;

  faceIndex = x === -1 ? EFaceIndex["x-"] : faceIndex;
  faceIndex = x === 1 ? EFaceIndex["x+"] : faceIndex;
  faceIndex = y === -1 ? EFaceIndex["y-"] : faceIndex;
  faceIndex = y === 1 ? EFaceIndex["y+"] : faceIndex;
  faceIndex = z === -1 ? EFaceIndex["z-"] : faceIndex;
  faceIndex = z === 1 ? EFaceIndex["z+"] : faceIndex;

  return faceIndex;
};

const findFacesOfPoint3D = (point3D: IPoint3D) => {
  const matches: { faceIndex: EFaceIndex; i: number; j: number }[] = [];

  for (let faceIndex = 0; faceIndex < 6; faceIndex++) {
    const ij = point3DToIj(point3D, faceIndex);
    if (!ij) {
      continue;
    }
    matches.push(ij);
  }

  return matches;
};

export const rotate = (
  state: TCubeState,
  faceIndex: EFaceIndex,
  direction?: EDirection,
  canRotate?: TCanFaceRotate
) => {
  state = clone(state);
  const face = state[faceIndex];
  if (canRotate && !canRotate(face, direction)) {
    return;
  }
  const faceName = EFaceIndex[faceIndex];
  const { matrix: rotationMatrix } = rotationInfo[faceName[0]];

  for (let k = -1; k <= 1; k++) {
    let swapI = -1;
    let swapJ = k;
    let i = swapI;
    let j = swapJ;

    if (k <= 0) {
      for (let l = 0; l < 3; l++) {
        const point = ijToPoint3D(i, j, faceIndex);
        const destination = rotationMatrix.transformPoint(point);
        ({ i, j } = point3DToIj(destination, faceIndex)!);

        const color = face[point2DToIndex(swapI, swapJ)];
        face[point2DToIndex(swapI, swapJ)] = face[point2DToIndex(i, j)];
        face[point2DToIndex(i, j)] = color;
      }
    }

    let { faceIndex: sideFaceIndex } = findFacesOfPoint3D(
      ijToPoint3D(-1, 0, faceIndex)
    ).find((el) => el.faceIndex !== faceIndex)!;
    const swapFaceIndex = sideFaceIndex;
    ({ i, j } = point3DToIj(
      ijToPoint3D(swapI, swapJ, faceIndex),
      swapFaceIndex
    )!);
    swapI = i;
    swapJ = j;

    for (let l = 0; l < 3; l++) {
      const point = ijToPoint3D(i, j, sideFaceIndex);
      const destination = rotationMatrix.transformPoint(point);
      const destinationFaceIndex = point3DToFaceIndex(
        rotationMatrix.transformPoint(faceIndexToPoint3D(sideFaceIndex))
      )!;
      ({ i, j } = point3DToIj(destination, destinationFaceIndex)!);
      sideFaceIndex = destinationFaceIndex;

      const color = state[swapFaceIndex][point2DToIndex(swapI, swapJ)];
      state[swapFaceIndex][point2DToIndex(swapI, swapJ)] =
        state[destinationFaceIndex][point2DToIndex(i, j)];
      state[destinationFaceIndex][point2DToIndex(i, j)] = color;
    }
  }

  return state;
};

export const createSolvedState = (): TCubeState => [
  [0, 0, 0, 0, 0, 0, 0, 0, 0],
  [1, 1, 1, 1, 1, 1, 1, 1, 1],
  [2, 2, 2, 2, 2, 2, 2, 2, 2],
  [3, 3, 3, 3, 3, 3, 3, 3, 3],
  [4, 4, 4, 4, 4, 4, 4, 4, 4],
  [5, 5, 5, 5, 5, 5, 5, 5, 5],
];

export const isCubeSolved = (state: TCubeState) => {
  const centerPiece = point2DToIndex(0, 0);

  return state.every(
    (face) =>
      !face.some(
        (el, i, arr) => (el & COLOR_MASK) !== (arr[centerPiece] & COLOR_MASK)
      )
  );
};

type TRotateParam = [EFaceIndex, EDirection | undefined, number];

export const allMoves = {
  B: [EFaceIndex["z-"], -1, 1] as TRotateParam,
  B2: [EFaceIndex["z-"], undefined, 2] as TRotateParam,
  "B'": [EFaceIndex["z-"], 1, -1] as TRotateParam,
  D: [EFaceIndex["y-"], -1, 1] as TRotateParam,
  D2: [EFaceIndex["y-"], undefined, 2] as TRotateParam,
  "D'": [EFaceIndex["y-"], 1, -1] as TRotateParam,
  F: [EFaceIndex["z+"], -1, -1] as TRotateParam,
  F2: [EFaceIndex["z+"], undefined, 2] as TRotateParam,
  "F'": [EFaceIndex["z+"], 1, 1] as TRotateParam,
  L: [EFaceIndex["x-"], -1, 1] as TRotateParam,
  L2: [EFaceIndex["x-"], undefined, 2] as TRotateParam,
  "L'": [EFaceIndex["x-"], 1, -1] as TRotateParam,
  R: [EFaceIndex["x+"], -1, -1] as TRotateParam,
  R2: [EFaceIndex["x+"], undefined, 2] as TRotateParam,
  "R'": [EFaceIndex["x+"], 1, 1] as TRotateParam,
  U: [EFaceIndex["y+"], -1, -1] as TRotateParam,
  U2: [EFaceIndex["y+"], undefined, 2] as TRotateParam,
  "U'": [EFaceIndex["y+"], 1, 1] as TRotateParam,
};

export type TMoveNames = keyof typeof allMoves;

export type TCanFaceRotate = (face: TFace, direction?: EDirection) => boolean;

export const canRotateByMoveName = (
  state: TCubeState,
  move: TMoveNames,
  canRotate?: TCanFaceRotate
) => {
  const params = allMoves[move];
  return canRotate?.(state[params[0]], params[1]) ?? true;
};

export const getAllowedMoves = (
  state: TCubeState,
  canRotate?: TCanFaceRotate
) => {
  return Object.keys(allMoves)
    .map((untypedMove) =>
      canRotateByMoveName(state, untypedMove as TMoveNames, canRotate)
        ? untypedMove
        : ""
    )
    .filter((el) => el) as TMoveNames[];
};

export const rotateByMoveName = (
  state: TCubeState,
  move: TMoveNames,
  canRotate?: TCanFaceRotate
) => {
  const params = allMoves[move];
  const count = (4 + params[2]) % 4;
  let tmp = state;
  for (let i = 0; i < count; i++) {
    const result = rotate(tmp, params[0], params[1], canRotate);
    if (!result) {
      break;
    }
    tmp = result;
  }
  return tmp;
};
