import coordinates from "./coordinates";
import { getFacesOfPoint3D, IPoint3D, uvToIndex } from "./spatial-util";
import rubikCubies from "./textureCubies";
import { TCube, TCubeState, TCubies } from "./types";

const defaultCoordinateMapping = [
  0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19,
];

export function textToCube(text: string[]) {
  return [
    // U
    [
      ...text[0]
        .slice(3, 6)
        .split("")
        .map((el) => Number(el)),
      ...text[1]
        .slice(3, 6)
        .split("")
        .map((el) => Number(el)),
      ...text[2]
        .slice(3, 6)
        .split("")
        .map((el) => Number(el)),
    ],
    // L
    [
      ...text[3]
        .slice(0, 3)
        .split("")
        .map((el) => Number(el)),
      ...text[4]
        .slice(0, 3)
        .split("")
        .map((el) => Number(el)),
      ...text[5]
        .slice(0, 3)
        .split("")
        .map((el) => Number(el)),
    ],
    // F
    [
      ...text[3]
        .slice(3, 6)
        .split("")
        .map((el) => Number(el)),
      ...text[4]
        .slice(3, 6)
        .split("")
        .map((el) => Number(el)),
      ...text[5]
        .slice(3, 6)
        .split("")
        .map((el) => Number(el)),
    ],
    // R
    [
      ...text[3]
        .slice(6, 9)
        .split("")
        .map((el) => Number(el)),
      ...text[4]
        .slice(6, 9)
        .split("")
        .map((el) => Number(el)),
      ...text[5]
        .slice(6, 9)
        .split("")
        .map((el) => Number(el)),
    ],
    // B
    [
      ...text[3]
        .slice(9, 12)
        .split("")
        .map((el) => Number(el)),
      ...text[4]
        .slice(9, 12)
        .split("")
        .map((el) => Number(el)),
      ...text[5]
        .slice(9, 12)
        .split("")
        .map((el) => Number(el)),
    ],
    // D
    [
      ...text[6]
        .slice(3, 6)
        .split("")
        .map((el) => Number(el)),
      ...text[7]
        .slice(3, 6)
        .split("")
        .map((el) => Number(el)),
      ...text[8]
        .slice(3, 6)
        .split("")
        .map((el) => Number(el)),
    ],
  ];
}

export function cubeToText(cube: TCube) {
  return [
    "   " + cube[0].slice(0, 3).join(""),
    "   " + cube[0].slice(3, 6).join(""),
    "   " + cube[0].slice(6, 9).join(""),
    cube[1].slice(0, 3).join("") +
      cube[2].slice(0, 3).join("") +
      cube[3].slice(0, 3).join("") +
      cube[4].slice(0, 3).join(""),
    cube[1].slice(3, 6).join("") +
      cube[2].slice(3, 6).join("") +
      cube[3].slice(3, 6).join("") +
      cube[4].slice(3, 6).join(""),
    cube[1].slice(6, 9).join("") +
      cube[2].slice(6, 9).join("") +
      cube[3].slice(6, 9).join("") +
      cube[4].slice(6, 9).join(""),
    "   " + cube[5].slice(0, 3).join(""),
    "   " + cube[5].slice(3, 6).join(""),
    "   " + cube[5].slice(6, 9).join(""),
  ];
}

function getCubieInfoByPosition(coordinate: IPoint3D, cube?: TCube) {
  const faces = getFacesOfPoint3D(coordinate);

  const primaryIndex = faces.findIndex(
    ({ axis }) =>
      (coordinate.x && axis === "x") || (!coordinate.x && axis === "y")
  );

  const primaryFace = faces.length === 2 ? faces[primaryIndex] : undefined;
  const secondaryFace =
    faces.length === 2 ? faces[1 - primaryIndex] : undefined;

  const primaryColor =
    cube && primaryFace
      ? cube[primaryFace.faceIndex][uvToIndex(primaryFace.u, primaryFace.v)]
      : undefined;
  const secondaryColor =
    cube && secondaryFace
      ? cube[secondaryFace.faceIndex][
          uvToIndex(secondaryFace.u, secondaryFace.v)
        ]
      : undefined;

  const xFace = faces.find(({ axis }) => axis === "x");
  const yFace = faces.find(({ axis }) => axis === "y");
  const zFace = faces.find(({ axis }) => axis === "z");

  const xColor =
    cube && xFace
      ? cube[xFace.faceIndex][uvToIndex(xFace.u, xFace.v)]
      : undefined;
  const yColor =
    cube && yFace
      ? cube[yFace.faceIndex][uvToIndex(yFace.u, yFace.v)]
      : undefined;
  const zColor =
    cube && zFace
      ? cube[zFace.faceIndex][uvToIndex(zFace.u, zFace.v)]
      : undefined;

  return {
    primaryFace,
    secondaryFace,
    xFace,
    yFace,
    zFace,
    primaryColor,
    secondaryColor,
    xColor,
    yColor,
    zColor,
  };
}

export function createCubies(
  solvedCube: TCube,
  centerCubies: TCubies = rubikCubies
) {
  const cubieEntries = Object.entries(centerCubies).map(([k, v]) => [
    Number(k),
    v,
  ]) as [number, number[]][];

  const cubies: TCubies = {};

  coordinates.slice(0, 12).forEach((coordinate, i) => {
    const { primaryColor, secondaryColor } = getCubieInfoByPosition(
      coordinate,
      solvedCube
    );

    cubies[2 * i + 2] = [primaryColor!, secondaryColor!];
    cubies[2 * i + 3] = [secondaryColor!, primaryColor!];
  });

  coordinates.slice(12, 20).forEach((coordinate, i) => {
    const { xColor, yColor, zColor } = getCubieInfoByPosition(
      coordinate,
      solvedCube
    );

    cubies[3 * i + 39] = [xColor!, yColor!, zColor!];
    if (i % 2) {
      cubies[3 * i + 40] = [yColor!, zColor!, xColor!];
      cubies[3 * i + 41] = [zColor!, xColor!, yColor!];
    } else {
      cubies[3 * i + 40] = [zColor!, xColor!, yColor!];
      cubies[3 * i + 41] = [yColor!, zColor!, xColor!];
    }
  });

  for (let i = 0; i < 6; i++) {
    const [centerId] =
      cubieEntries.find(
        ([k, v]) => v.length === 1 && v[0] === solvedCube[i][4]
      ) ?? [];
    if (!centerId) {
      continue;
    }
    const base = Math.floor(centerId / 4);
    const orientation = centerId % 4;
    for (let j = 0; j < 4; j++) {
      cubies[4 * i + 84 + j] = [
        centerCubies[4 * base + ((orientation + j) % 4)][0],
      ];
    }
  }

  return cubies;
}

export function cubeToState(cube: TCube, cubies: TCubies = rubikCubies) {
  const cubieEntries = Object.entries(cubies).map(([k, v]) => [
    Number(k),
    v,
  ]) as [number, number[]][];

  const state = Array.from({ length: 26 }, () => 0);

  let startOffset = 0;
  let offset = startOffset;
  let coordinate = coordinates[offset];
  for (let i = 0; i < 12; i++) {
    const { primaryColor, secondaryColor } = getCubieInfoByPosition(
      coordinate,
      cube
    );

    const [edgeId] =
      cubieEntries.find(
        ([k, [a, b]]) => a === primaryColor && b === secondaryColor
      ) ?? [];
    if (!edgeId) {
      throw new Error(
        `edge [${primaryColor},${secondaryColor}] does not exists.`
      );
    }

    const base = Math.floor(edgeId / 2);
    const edgeCoordinate = coordinates[base - 1];
    const parity =
      (coordinate.x && edgeCoordinate.x) || (!coordinate.x && !edgeCoordinate.x)
        ? 0
        : 1;

    state[offset] = 2 * base + ((parity + edgeId) % 2);

    if (startOffset === base - 1) {
      startOffset = state.indexOf(0);
      offset = startOffset;
    } else {
      offset = base - 1;
    }
    coordinate = coordinates[offset];
  }

  startOffset = 12;
  offset = startOffset;
  coordinate = coordinates[offset];
  for (let i = 0; i < 8; i++) {
    const { xColor, yColor, zColor } = getCubieInfoByPosition(coordinate, cube);

    const [cornerId] =
      cubieEntries.find(
        ([k, [x, y, z]]) =>
          z === zColor &&
          ((x === xColor && y === yColor) || (x === yColor && y === xColor))
      ) ?? [];
    if (!cornerId) {
      throw new Error(
        `corner [${xColor},${yColor},${zColor}] does not exists.`
      );
    }

    state[offset] = cornerId;

    const base = Math.floor(cornerId / 3);
    if (startOffset === base - 1) {
      startOffset = state.indexOf(0, 12);
      offset = startOffset;
    } else {
      offset = base - 1;
    }
    coordinate = coordinates[offset];
  }

  for (let i = 0; i < 6; i++) {
    const center = cube[i][4];
    const [centerId] =
      cubieEntries.find(([k, v]) => v.length === 1 && v[0] === center) ?? [];
    if (!centerId) {
      throw new Error(`center ${center} does not exists.`);
    }
    state[i + 20] = centerId;
  }

  return state;
}

export function stateToCube(
  state: TCubeState,
  cubies: TCubies = rubikCubies,
  coordinateMapping: number[] = defaultCoordinateMapping
) {
  const cube = [
    Array.from({ length: 9 }, () => 6),
    Array.from({ length: 9 }, () => 6),
    Array.from({ length: 9 }, () => 6),
    Array.from({ length: 9 }, () => 6),
    Array.from({ length: 9 }, () => 6),
    Array.from({ length: 9 }, () => 6),
  ];

  coordinates.slice(0, 12).forEach((coordinate, i) => {
    const { primaryFace, secondaryFace } = getCubieInfoByPosition(coordinate);

    const edgeId = state[i];
    const base = Math.floor(edgeId / 2);
    const edgeCoordinate = coordinates[coordinateMapping[base - 1]];
    const parity =
      (coordinate.x && edgeCoordinate.x) || (!coordinate.x && !edgeCoordinate.x)
        ? 0
        : 1;
    const cubie = cubies[edgeId];
    const [primaryColor, secondaryColor] = cubie;

    cube[primaryFace!.faceIndex][uvToIndex(primaryFace!.u, primaryFace!.v)] =
      parity ? secondaryColor : primaryColor;
    cube[secondaryFace!.faceIndex][
      uvToIndex(secondaryFace!.u, secondaryFace!.v)
    ] = parity ? primaryColor : secondaryColor;
  });

  coordinates.slice(12, 20).forEach((coordinate, i) => {
    const offset = 12 + i;

    const { xFace, yFace, zFace } = getCubieInfoByPosition(coordinate);

    const cornerId = state[offset];
    const base = coordinateMapping[Math.floor(cornerId / 3) - 1];
    const parity = (i + base) % 2 ? 1 : 0;
    const cubie = cubies[cornerId];
    const [xColor, yColor, zColor] = cubie;

    cube[xFace!.faceIndex][uvToIndex(xFace!.u, xFace!.v)] = parity
      ? yColor
      : xColor;
    cube[yFace!.faceIndex][uvToIndex(yFace!.u, yFace!.v)] = parity
      ? xColor
      : yColor;
    cube[zFace!.faceIndex][uvToIndex(zFace!.u, zFace!.v)] = zColor;
  });

  for (let i = 0; i < 6; i++) {
    cube[i][4] = cubies[state[i + 20]][0];
  }

  return cube;
}

export function getCorePermutation(state: TCubeState) {
  return state
    .slice(20)
    .map((el) => Math.floor(el / 4) - 21)
    .join("");
}

export const defaultCubeText = [
  "   000      ",
  "   000      ",
  "   000      ",
  "111222333444",
  "111222333444",
  "111222333444",
  "   555      ",
  "   555      ",
  "   555      ",
];

export const defaultCube = [
  Array.from({ length: 9 }, (unused, i) => i),
  Array.from({ length: 9 }, (unused, i) => i + 9),
  Array.from({ length: 9 }, (unused, i) => i + 18),
  Array.from({ length: 9 }, (unused, i) => i + 27),
  Array.from({ length: 9 }, (unused, i) => i + 36),
  Array.from({ length: 9 }, (unused, i) => i + 45),
];

export const defaultState = [
  2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 39, 42, 45, 48, 51, 54, 57, 60,
  84, 88, 92, 96, 100, 104,
];
