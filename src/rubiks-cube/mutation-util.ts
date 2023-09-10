import {
  createCubies,
  cubeToState,
  defaultCube,
  stateToCube,
} from "./cube-util";
import rubikCubies from "./textureCubies";
import { TCube, TCubeState, TCubies } from "./types";

export interface IMutation {
  position: number[];
  orientation: number[];
}

export const defaultModulusArray = [
  ...Array.from({ length: 12 }, () => 2),
  ...Array.from({ length: 8 }, () => 3),
  ...Array.from({ length: 6 }, () => 4),
];

export function getMutation(
  state: TCubeState,
  modulusArray: number[] = defaultModulusArray
) {
  modulusArray = modulusArray ?? defaultModulusArray;

  return {
    position: state.map((el, i) => Math.floor(el / modulusArray[i]) - i - 1),
    orientation: state.map((el, i) => el % modulusArray[i]),
  };
}

export function negateMutation(
  mutation: IMutation,
  solvedCube: TCube = defaultCube,
  cubies: TCubies = rubikCubies
) {
  const solvedState = cubeToState(solvedCube, cubies);
  const tmpState = mutate(solvedState, mutation);
  const tmpCubies = createCubies(stateToCube(tmpState), cubies);
  const negateState = cubeToState(solvedCube, tmpCubies);
  return getMutation(negateState);
}

export function mutate(
  state: TCubeState,
  { position, orientation }: IMutation,
  modulusArray: number[] = defaultModulusArray
) {
  return state.map((unused, i) => {
    const id = state[position[i] + i];
    const modulus = modulusArray[i];
    const base = Math.floor(id / modulus);
    return modulus * base + ((id + orientation[i]) % modulus);
  });
}
