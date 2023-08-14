import React, { forwardRef } from "react";
import EventEmitter from "events";
import * as Three from "three";
import { TInitFn, TOnAnimateFn, useThree } from "../hooks/useThree";
import defaultTexture from "../images/rubiks-cube.png";
import {
  cubeToState,
  defaultState,
  stateToCube,
} from "../rubiks-cube/cube-util";
import fundamentalOperations from "../rubiks-cube/fundamentalOperations";
import {
  createOperationMap,
  findOperationEntryByDifference,
  initOperationMap,
} from "../rubiks-cube/operation-util";
import { faceInfo, faceNames } from "../rubiks-cube/spatial-util";
import { EFaceIndex } from "../rubiks-cube-old";
import { CubieGeometry } from "../threejs/CubieGeometry";
import { ICubeHandle, ICubeProps } from "./RubiksCube.types";

type TRotateFaceFn = (
  faceIndex: number,
  quarterTurns: number,
  counterClockWise: boolean
) => Promise<void> | undefined;
type TRotationQueue = { axis: Three.Vector3; radian: number }[];
type TCommandQueue = { command: string; undo: boolean }[];

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
    const cubeRef = React.useRef(stateToCube(cubeState));

    const [rotationQueue] = React.useState<TRotationQueue>([]);
    const [dispatcher] = React.useState(new EventEmitter());
    const [commandQueue] = React.useState<TCommandQueue>([]);

    const cubeControlsRef = React.useRef<Partial<ICubeControls>>({});

    // const rotateLeft = (...args: Parameters<TRotateFaceFn>) =>
    //   cubeControlsRef.current.rotateLeft?.(...args);
    // const rotateRight = (...args: Parameters<TRotateFaceFn>) =>
    //   cubeControlsRef.current.rotateRight?.(...args);
    // const rotateDown = (...args: Parameters<TRotateFaceFn>) =>
    //   cubeControlsRef.current.rotateDown?.(...args);
    // const rotateUp = (...args: Parameters<TRotateFaceFn>) =>
    //   cubeControlsRef.current.rotateUp?.(...args);
    // const rotateBack = (...args: Parameters<TRotateFaceFn>) =>
    //   cubeControlsRef.current.rotateBack?.(...args);
    // const rotateFront = (...args: Parameters<TRotateFaceFn>) =>
    //   cubeControlsRef.current.rotateFront?.(...args);

    const init: TInitFn = React.useCallback(
      ({ scene, camera, controls, render }) => {
        const tmpCubeState = cubeToState(cubeRef.current);

        camera.position.x = 4;
        camera.position.y = 4;
        camera.position.z = 4;
        camera.updateProjectionMatrix();
        controls?.update();
        commandQueue.splice(0);
        rotationQueue.splice(0);
        scene.clear();
        scene.background = new Three.Color(0xffffff);

        const texture = new Three.TextureLoader().load(textureProp, () => {
          render();
        });

        const material = new Three.MeshBasicMaterial({ map: texture });

        const cubes: Three.Object3D[] = [];
        for (let x = -1; x <= 1; x++) {
          for (let y = -1; y <= 1; y++) {
            for (let z = -1; z <= 1; z++) {
              const cube = new Three.Mesh(
                new CubieGeometry({ x, y, z }, tmpCubeState),
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

        const rotate = (
          faceIndex: number = faceNames.U,
          quarterTurns: number = 1,
          counterClockWise: boolean = false
        ) => {
          const steps = 100;

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
            dispatcher.once("finishRotation", resolve);
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
      [rotationQueue, commandQueue, dispatcher, textureProp]
    );

    React.useEffect(() => {
      const cubeB = stateToCube(cubeState);
      const cubeA = cubeRef.current;
      const operation = findOperationEntryByDifference(
        operations,
        cubeB,
        cubeA
      );
      if (!operation) {
        return;
      }
      console.log(operation);
      const [operationName] = operation;
      if (!(operationName in rotateParams)) {
        return;
      }
      cubeRef.current = cubeB;
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
