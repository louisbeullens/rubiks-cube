import React from "react";
import EventEmitter from "events";
import * as Three from "three";
import { TInitFn, TOnAnimateFn, useThree } from "../hooks/useThree";
import defaultTexture from "../images/rubiks-cube.png";
import { defaultState, stateToCube } from "../rubiks-cube/cube-util";
import fundamentalOperations from "../rubiks-cube/fundamentalOperations";
import {
  createOperationMap,
  findOperationEntryByDifference,
  initOperationMap,
} from "../rubiks-cube/operation-util";
import { faceInfo, faceNames } from "../rubiks-cube/spatial-util";
import { TCubeState } from "../rubiks-cube/types";
import { CubieGeometry } from "../threejs/CubieGeometry";
import { ICubeHandle, ICubeProps } from "./RubiksCube.types";

type TRotateFaceFn = (
  faceIndex: number,
  quarterTurns: number,
  counterClockWise: boolean
) => Promise<void> | undefined;
type TRotationQueue = { axis: Three.Vector3; radian: number }[];

type TRotateParam = [number, number, boolean];

export interface ICubeControls {
  rotate?: TRotateFaceFn;
}

const operations = initOperationMap(createOperationMap(fundamentalOperations));

const rotateParams: Record<string, TRotateParam> = {
  U: [0, 1, false],
  U2: [0, 2, false],
  "U'": [0, 1, true],
  L: [1, 1, true],
  L2: [1, 2, true],
  "L'": [1, 1, false],
  F: [2, 1, false],
  F2: [2, 2, false],
  "F'": [2, 1, true],
  R: [3, 1, false],
  R2: [3, 2, false],
  "R'": [3, 1, true],
  B: [4, 1, true],
  B2: [4, 2, true],
  "B'": [4, 1, false],
  D: [5, 1, true],
  D2: [5, 2, true],
  "D'": [5, 1, false],
};

export const Cube3D = React.forwardRef<ICubeHandle, ICubeProps>(
  (
    { cubeState = defaultState, texture: textureProp = defaultTexture },
    forwardRef
  ) => {
    // store cube state for creating geometry
    const [initialCubeState, setInitialCubeState] = React.useState(cubeState);

    // store current cube
    const cubeRef = React.useRef(stateToCube(initialCubeState));

    const [rotationQueue] = React.useState<TRotationQueue>([]);
    const [dispatcher] = React.useState(new EventEmitter());

    const cubeControlsRef = React.useRef<Partial<ICubeControls>>({});

    const init: TInitFn = React.useCallback(
      ({ scene, camera, controls, render }) => {
        camera.position.x = 2.5;
        camera.position.y = 2.5;
        camera.position.z = 2.5;
        camera.updateProjectionMatrix();
        controls?.update();
        rotationQueue.splice(0);
        scene.clear();
        scene.background = new Three.Color(0xffffff);

        // scene.add(new Three.AxesHelper(3));

        const texture = new Three.TextureLoader().load(textureProp, () => {
          render();
        });

        const material = new Three.MeshBasicMaterial({ map: texture });

        const cubes: Three.Object3D[] = [];
        for (let x = -1; x <= 1; x++) {
          for (let y = -1; y <= 1; y++) {
            for (let z = -1; z <= 1; z++) {
              const cube = new Three.Mesh(
                new CubieGeometry({ x, y, z }, initialCubeState),
                material
              );
              scene.add(cube);
              cubes.push(cube);
              cube.position.x = x;
              cube.position.y = y;
              cube.position.z = z;
            }
          }
        }

        const axes = {
          x: new Three.Vector3(1, 0, 0),
          y: new Three.Vector3(0, 1, 0),
          z: new Three.Vector3(0, 0, 1),
        };

        let group = new Three.Group();
        const prepareRotation = (axis: string, direction: number) => {
          group = new Three.Group();
          scene.add(group);
          group.add(
            ...cubes.filter((el) => (el.position as any)[axis] === direction)
          );
        };

        const applyRotation = ({ axis, radian }: (typeof rotationQueue)[0]) => {
          group.rotateOnAxis(axis, radian);
        };

        const finishRotation = () => {
          for (const cube of [...group.children]) {
            const position = cube.getWorldPosition(new Three.Vector3());
            const quaternation = cube.getWorldQuaternion(
              new Three.Quaternion()
            );
            scene.add(cube);
            cube.position.copy(position);
            cube.rotation.setFromQuaternion(quaternation);
            cube.position.x =
              (0.5 * Math.round((2 * cube.position.x) / 0.5)) / 2;
            cube.position.y =
              (0.5 * Math.round((2 * cube.position.y) / 0.5)) / 2;
            cube.position.z =
              (0.5 * Math.round((2 * cube.position.z) / 0.5)) / 2;
          }
          group.removeFromParent();
        };

        let isRotating = false;
        const rotate = (
          faceIndex: number = faceNames.U,
          quarterTurns: number = 1,
          counterClockWise: boolean = false
        ) => {
          if (isRotating) {
            dispatcher.once("finishRotation", () => {
              rotate(faceIndex, quarterTurns, counterClockWise);
            });
            return;
          }
          isRotating = true;
          const steps = 25;

          const axis = faceInfo[faceIndex].axis;
          const vAxis = (axes as any)[axis] as THREE.Vector3;
          const diretion = faceInfo[faceIndex].direction;
          const radian =
            ((Math.PI / 2) * quarterTurns * (counterClockWise ? 1 : -1)) /
            steps;

          // prepare group
          prepareRotation(axis, diretion);

          // push steps on queue
          for (let j = 0; j < steps; j++) {
            rotationQueue.push({ axis: vAxis, radian });
          }

          // wait for animation loop finished
          return new Promise<void>((resolve) => {
            dispatcher.once("finishRotation", () => {
              isRotating = false;
              return resolve();
            });
          });
        };

        cubeControlsRef.current.rotate = rotate;

        render();

        const onAnimate: TOnAnimateFn = ({ render }) => {
          if (!rotationQueue.length) {
            return;
          }
          const transformation = rotationQueue.shift();
          if (transformation) {
            applyRotation(transformation);
            render();
            if (!rotationQueue.length) {
              finishRotation();
              dispatcher.emit("finishRotation");
            }
          }
        };

        return {
          onAnimate,
        };
      },
      [rotationQueue, dispatcher, textureProp, initialCubeState]
    );

    React.useEffect(() => {
      const initCube = (cubeState: TCubeState) => {
        setInitialCubeState(cubeState);
      };

      // new cube
      const cubeB = stateToCube(cubeState);
      // current cube
      const cubeA = cubeRef.current;
      // always update current cube
      cubeRef.current = cubeB;
      // compare cubes find applied operation
      const operation = findOperationEntryByDifference(
        operations,
        cubeB,
        cubeA
      );
      if (!operation) {
        // recreate cube geometry when operation not found
        initCube(cubeState);
        return;
      }
      const [operationName] = operation;
      if (!(operationName in rotateParams)) {
        // recreate cube geometry when imperative api for operation doesn't exists
        initCube(cubeState);
        return;
      }
      // animate changes
      cubeControlsRef.current.rotate?.(...rotateParams[operationName]);
    }, [cubeState]);

    React.useImperativeHandle(
      forwardRef,
      () => ({
        cubeState,
      }),
      [cubeState]
    );

    const { reactElement } = useThree(350, 275, init);

    return reactElement;
  }
);
