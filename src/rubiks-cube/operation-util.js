import _ from "lodash";
import {
  createCubies,
  cubeToState,
  defaultCube,
  defaultState,
  textToCube,
} from "./cube-util";
import { getMutation, mutate, negateMutation } from "./mutation-util";
import rubikCubies from "./textureCubies";

const OPERATION_TEMPLATE = {
  algorithm: undefined,
  reverseAlgorithm: undefined,
  mutation: undefined,
};

function reverseAlgorithm(operations, algorithm) {
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
  operationName,
  state,
  centerPosition,
  centerRotation
) {
  state = state ?? defaultState;
  centerPosition = centerPosition ?? 20;
  centerRotation = centerRotation ?? 0;

  const mutation = getMutation(state);
  mutation.orientation[centerPosition] = centerRotation;

  return {
    [operationName]: {
      ...OPERATION_TEMPLATE,
      algorithm: operationName,
      mutation,
    },
  };
}

export function createOperationFromCube(
  operationName,
  cube,
  cubies,
  centerPosition,
  centerRotation
) {
  cubies = cubies ?? rubikCubies;
  const state = cubeToState(cube, cubies);
  return createOperationFromState(
    operationName,
    state,
    centerPosition,
    centerRotation
  );
}

export function createOperationFromText(
  operationName,
  text,
  cubies,
  centerPosition,
  centerRotation
) {
  return createOperationFromCube(
    operationName,
    textToCube(text),
    cubies,
    centerPosition,
    centerRotation
  );
}

function createMutationFromAlgorithm(algorithm, operations, solvedState) {
  solvedState = solvedState ?? defaultState;
  let tmpState = [...solvedState];
  tmpState = operator(operations, solvedState)(tmpState, algorithm);
  return getMutation(tmpState);
}

export function createOperationMap(fundamentalOperations) {
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

function normalizeOperation(operations, operationName, solvedState) {
  solvedState = solvedState ?? defaultState;
  let operation = operations[operationName];
  if (typeof operation === "string") {
    operation = operations[operationName] = {
      ...OPERATION_TEMPLATE,
      algorithm: operation,
    };
  }
  if (!operation.mutation) {
    operation.mutation = createMutationFromAlgorithm(
      operation.algorithm,
      operations,
      solvedState
    );
  }
  return operation;
}

export function initOperationMap(operations, solvedState) {
  solvedState = solvedState ?? defaultState;
  for (const [operationName, operation] of Object.entries(operations)) {
    if (!operation.mutation) {
      normalizeOperation(operations, operationName, solvedState);
    }
  }

  for (const operation of Object.values(operations)) {
    const negativeMutation = negateMutation(operation.mutation);
    const reverseOperationEntry = findOperationEntryByMutation(
      operations,
      negativeMutation
    );
    if (!reverseOperationEntry) {
      continue;
    }
    const [reverseOperationName] = reverseOperationEntry;
    operation.reverseAlgorithm = reverseOperationName;
  }

  for (const operation of Object.values(operations)) {
    if (operation.reverseAlgorithm) {
      continue;
    }
    operation.reverseAlgorithm = reverseAlgorithm(
      operations,
      operation.algorithm
    );
  }

  return operations;
}

export function findOperationEntryByMutation(
  operations,
  { position, orientation }
) {
  return Object.entries(operations).find(
    ([k, { mutation: el }]) =>
      el &&
      _.isEqual(el.position, position) &&
      _.isEqual(el.orientation, orientation)
  );
}

export function findOperationEntryByDifference(
  operations,
  cubeB,
  cubeA,
  cubies
) {
  cubeA = cubeA ?? defaultCube;
  cubies = cubies ?? rubikCubies;

  const tmpCubies = createCubies(cubeA, cubies);
  const tmpState = cubeToState(cubeB, tmpCubies);
  const mutation = getMutation(tmpState);
  return findOperationEntryByMutation(operations, mutation);
}

export function operate(operations, state, algorithm, solvedState) {
  let tmpState = [...state];
  for (const operationName of algorithm.split(" ")) {
    if (!operationName) {
      break;
    }
    let operation = operations[operationName];
    if (!operation.mutation) {
      operation = normalizeOperation(operations, operationName, solvedState);
    }
    tmpState = mutate(tmpState, operation.mutation);
  }
  return tmpState;
}

export function operator(operations, solvedState) {
  solvedState = solvedState ?? defaultState;
  return function (state, algorithm) {
    return operate(operations, state, algorithm, solvedState);
  };
}
