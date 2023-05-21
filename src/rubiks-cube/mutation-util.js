import {
  createCubies,
  cubeToState,
  defaultCube,
  stateToCube,
} from "./cube-util";
import rubikCubies from "./textureCubies";

export const defaultModulusArray = [
  ...Array.from({ length: 12 }, () => 2),
  ...Array.from({ length: 8 }, () => 3),
  ...Array.from({ length: 6 }, () => 4),
];

export function getMutation(state, modulusArray) {
  modulusArray = modulusArray ?? defaultModulusArray;

  return {
    position: state.map((el, i) => Math.floor(el / modulusArray[i]) - i - 1),
    orientation: state.map((el, i) => el % modulusArray[i]),
  };
}

export function negateMutation(mutation, solvedCube, cubies) {
  cubies = cubies ?? rubikCubies;
  solvedCube = solvedCube ?? defaultCube;

  const solvedState = cubeToState(solvedCube, cubies);
  const tmpState = mutate(solvedState, mutation);
  const tmpCubies = createCubies(stateToCube(tmpState), cubies);
  const negateState = cubeToState(solvedCube, tmpCubies);
  return getMutation(negateState);
}

export function mutate(state, { position, orientation }, modulusArray) {
  modulusArray = modulusArray ?? defaultModulusArray;

  return state.map((unused, i) => {
    const id = state[position[i] + i];
    const modulus = modulusArray[i];
    const base = Math.floor(id / modulus);
    return modulus * base + ((id + orientation[i]) % modulus);
  });
}
