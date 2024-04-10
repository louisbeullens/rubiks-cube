import _ from "lodash";
import {
  createCubies,
  cubeToState,
  defaultCube,
  defaultState,
  getCorePermutation,
  textToCube,
} from "./cube-util";
import {
  getMutation,
  IMutation,
  mutate,
  negateMutation,
} from "./mutation-util";
import rubikCubies from "./textureCubies";
import { TCube, TCubeState, TCubies } from "./types";

interface IOperation {
  algorithm: string;
  reverseAlgorithm?: string;
  mutation: IMutation;
}

type TUninitializedOperationMap = Record<string, string | IOperation>;
type TOperationMap = Record<string, IOperation>;

function reverseAlgorithm(operations: TOperationMap, algorithm: string) {
  const reverseAlgorithmParts = algorithm
    .split(" ")
    .reverse()
    .map((el) => operations[el]?.reverseAlgorithm);
  if (reverseAlgorithmParts.includes(undefined)) {
    return;
  }
  return reverseAlgorithmParts.join(" ");
}

export function createOperationFromState(
  operationName: string,
  state: TCubeState = defaultState,
  centerPosition: number = 20,
  centerRotation: number = 0
) {
  const mutation = getMutation(state);
  mutation.orientation[centerPosition] = centerRotation;

  return {
    [operationName]: {
      algorithm: operationName,
      mutation,
    },
  };
}

export function createOperationFromCube(
  operationName: string,
  cube: TCube,
  cubies: TCubies = rubikCubies,
  centerPosition?: number,
  centerRotation?: number
) {
  const state = cubeToState(cube, cubies);
  return createOperationFromState(
    operationName,
    state,
    centerPosition,
    centerRotation
  );
}

export function createOperationFromText(
  operationName: string,
  text: string[],
  cubies: TCubies = rubikCubies,
  centerPosition?: number,
  centerRotation?: number
) {
  return createOperationFromCube(
    operationName,
    textToCube(text),
    cubies,
    centerPosition,
    centerRotation
  );
}

function createMutationFromAlgorithm(
  algorithm: string,
  operations: TUninitializedOperationMap,
  solvedState: TCubeState = defaultState
) {
  let tmpState = [...solvedState];
  tmpState = operate(operations, tmpState, algorithm, solvedState);
  return getMutation(tmpState);
}

export function createOperationMap(fundamentalOperations: TOperationMap) {
  return {
    ...fundamentalOperations,
    // fundamental Z operations
    // "B": "X D X'",
    // "S": "X E' X'",
    // "F": "X U X'",
    // X axis
    L2: "L L",
    "L'": "L2 L",
    M2: "M M",
    "M'": "M2 M",
    R2: "R R",
    "R'": "R2 R",
    // "X": "L' M' R",
    X2: "X X",
    "X'": "X2 X",
    // Y axis
    D2: "D D",
    "D'": "D2 D",
    E2: "E E",
    "E'": "E2 E",
    U2: "U U",
    "U'": "U2 U",
    // "Y": "D' E' U",
    Y2: "Y Y",
    "Y'": "Y2 Y",
    // Z axis
    B2: "B B",
    "B'": "B2 B",
    S2: "S S",
    "S'": "S2 S",
    F2: "F F",
    "F'": "F2 F",
    // "Z": "B' S F",
    Z2: "Z Z",
    "Z'": "Z2 Z",
    // rotations
    "012345": "",
    "023415": "Y",
    "034125": "Y2",
    "041235": "Y'",
    104523: "X2 Z",
    120453: "X' Z",
    145203: "X Z",
    152043: "Z",
    201534: "X Y'",
    215304: "X",
    230154: "X Y2",
    253014: "X Y",
    302541: "Z'",
    325401: "X Z'",
    340251: "X' Z'",
    354021: "X2 Z'",
    403512: "X' Y",
    410352: "X'",
    435102: "X Z2",
    451032: "X' Y'",
    514320: "X2",
    521430: "X2 Y'",
    532140: "Z2",
    543210: "X2 Y",
  };
}

function normalizeOperation(
  operations: TUninitializedOperationMap,
  operationName: string,
  solvedState: TCubeState = defaultState
) {
  let operation = operations[operationName];
  if (typeof operation === "string") {
    operation = operations[operationName] = {
      algorithm: operation,
    } as unknown as IOperation;
  }
  if (!operation.mutation) {
    operation.mutation = createMutationFromAlgorithm(
      operation.algorithm,
      operations,
      solvedState
    );
  }
  return operation as IOperation;
}

export function initOperationMap(
  operations: TUninitializedOperationMap,
  solvedState: TCubeState = defaultState
) {
  solvedState = solvedState ?? defaultState;
  for (const [operationName, operation] of Object.entries(operations)) {
    if (typeof operation === "string") {
      normalizeOperation(operations, operationName, solvedState);
    }
  }

  for (const untypedOperation of Object.values(operations)) {
    const operation = untypedOperation as IOperation;
    const negativeMutation = negateMutation(operation.mutation);
    const reverseOperationEntry = findOperationEntryByMutation(
      operations as TOperationMap,
      negativeMutation
    );
    if (!reverseOperationEntry) {
      continue;
    }
    const [reverseOperationName] = reverseOperationEntry;
    operation.reverseAlgorithm = reverseOperationName;
  }

  for (const untypedOperation of Object.values(operations)) {
    const operation = untypedOperation as IOperation;
    if (operation.reverseAlgorithm) {
      continue;
    }
    operation.reverseAlgorithm = reverseAlgorithm(
      operations as TOperationMap,
      operation.algorithm
    );
  }

  return operations as TOperationMap;
}

export function findOperationEntryByMutation(
  operations: TOperationMap,
  { position, orientation }: IMutation
) {
  return Object.entries(operations).find(
    ([k, { mutation: el }]) =>
      el &&
      _.isEqual(el.position, position) &&
      _.isEqual(el.orientation, orientation)
  );
}

export function findOperationEntryByDifference(
  operations: TOperationMap,
  cubeB: TCube,
  cubeA: TCube = defaultCube,
  cubies: TCubies = rubikCubies
) {
  const tmpCubies = createCubies(cubeA, cubies);
  const tmpState = cubeToState(cubeB, tmpCubies);
  const mutation = getMutation(tmpState);
  return findOperationEntryByMutation(operations, mutation);
}

export function operate(
  operations: TUninitializedOperationMap,
  state: TCubeState,
  algorithm: string,
  solvedState: TCubeState = defaultState
) {
  let tmpState = [...state];
  for (const operationName of algorithm.split(" ")) {
    if (!operationName) {
      break;
    }
    let operation = operations[operationName];
    if (typeof operation === "string") {
      operation = normalizeOperation(operations, operationName, solvedState);
    }
    tmpState = mutate(tmpState, operation.mutation);
  }
  return tmpState;
}

export function orientate(
  operations: TUninitializedOperationMap,
  state: TCubeState,
  solvedState: TCubeState = defaultState
) {
  const corePermutation = getCorePermutation(state);
  let operation = operations[corePermutation];
  if (typeof operation === "string") {
    operation = normalizeOperation(operations, corePermutation, solvedState);
  }
  return operation.reverseAlgorithm
    ? operate(operations, state, operation.reverseAlgorithm!, defaultState)
    : state;
}

export function operator(
  operations: TOperationMap,
  solvedState: TCubeState = defaultState
) {
  solvedState = solvedState ?? defaultState;
  return function (state: TCubeState, algorithm: string) {
    return operate(operations, state, algorithm, solvedState);
  };
}
