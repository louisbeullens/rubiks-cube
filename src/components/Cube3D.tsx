import React from "react";
import * as Three from "three";
import { createHandle } from "../component-utils";
import { isDebugActive } from "../config";
import { useControlledState, useLatestRef } from "../hooks";
import { TInitFn, TOnAnimateFn, useThree } from "../hooks/useThree";
import defaultTexture from "../images/rubiks-cube.png";
import {
  defaultState,
  getCorePermutation,
  stateToCube,
} from "../rubiks-cube/cube-util";
import fundamentalOperations from "../rubiks-cube/fundamentalOperations";
import {
  createOperationMap,
  findOperationEntryByDifference,
  initOperationMap,
  operate,
  orientate,
} from "../rubiks-cube/operation-util";
import { coreOrientationMap } from "../rubiks-cube/rotationMap";
import {
  faceInfo,
  faceInfoEntries,
  faceNames,
} from "../rubiks-cube/spatial-util";
import { CubieGeometry } from "../threejs/CubieGeometry";
import {
  sortVectorEntries,
  TVectorEntry,
  vectorToEntries,
} from "../vector-utils";
import { ICubeHandle, ICubeProps } from "./RubiksCube.types";

type TRotateFaceFn = (
  faceIndex: number,
  quarterTurns: number,
  counterClockWise: boolean
) => Promise<void> | undefined;

interface IRotationJob {
  initialized: boolean;
  faceIndex: number;
  resolvers: Array<() => void>;
  group: Three.Group;
  radian: number;
  count: number;
}

interface IParallelJobs {
  axisName: string;
  axis: Three.Vector3;
  "-1": IRotationJob;
  "1": IRotationJob;
}

type TRotateParam = [number, number, boolean];

export interface ICubeControls {
  rotate?: TRotateFaceFn;
}

const QUARTERTURN_STEPS = 25;

const operations = initOperationMap(createOperationMap(fundamentalOperations));

export const rubiksCubeRotateParams: Record<string, TRotateParam> = {
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

const getCameraInfo = (camera: Three.PerspectiveCamera) => {
  return {
    position: camera.position.clone(),
    direction: camera.getWorldDirection(new Three.Vector3()),
    up: camera.up.clone(),
    quaternion: camera.quaternion.clone(),
    rotation: camera.rotation.clone(),
  };
};

const axises = {
  x: new Three.Vector3(1, 0, 0),
  y: new Three.Vector3(0, 1, 0),
  z: new Three.Vector3(0, 0, 1),
};

const alternateFaceNames = [
  "White",
  "Green",
  "Red",
  "Blue",
  "Orange",
  "Yellow",
];

export const Cube3D = React.forwardRef<ICubeHandle, ICubeProps>(
  (
    {
      cubeState: cubeStateProp,
      texture: textureProp = defaultTexture,
      rotateParams = rubiksCubeRotateParams,
      onChange,
    },
    forwardRef
  ) => {
    const [cubeState, setCubeState] = useControlledState(
      defaultState,
      cubeStateProp
    );
    const onChangeRef = useLatestRef(onChange);
    // store cube state for creating geometry
    const [initialCubeState, setInitialCubeState] = React.useState(
      orientate(operations, cubeState, defaultState)
    );

    // store current cube
    const cubeRef = React.useRef(stateToCube(initialCubeState));

    const [cameraInfo, setCameraInfo] = React.useState({
      position: new Three.Vector3(),
      direction: new Three.Vector3(),
      up: new Three.Vector3(),
      quaternion: new Three.Quaternion(),
      rotation: new Three.Euler(),
    });

    const [orientation, setOrientation] = React.useState("012345");

    const cubeControlsRef = React.useRef<Partial<ICubeControls>>({});

    const init: TInitFn = React.useCallback(
      ({ scene, camera, controls, render }) => {
        const debugActive = isDebugActive();
        const distance = 2.5;

        controls?.reset();
        scene.clear();
        scene.background = new Three.Color(0xffffff);
        if (debugActive) {
          scene.add(new Three.AxesHelper(distance));
        }

        camera.position.x = distance;
        camera.position.y = distance;
        camera.position.z = distance;
        camera.lookAt(new Three.Vector3(0, 0, 0));
        camera.up.set(-0.4, 0.8, -0.4);
        camera.updateProjectionMatrix();
        setCameraInfo(getCameraInfo(camera));

        if (controls) {
          if (debugActive) {
            scene.add((controls as any)._gizmos);
          }
          controls.enablePan = false;
          controls.minDistance = 4.33;
          controls.addEventListener("change", () => {
            setCameraInfo(getCameraInfo(camera));
          });
          controls.update();
        }

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

        const parallelJobsQueue: IParallelJobs[] = [];

        const prepareJob = (job: IRotationJob) => {
          if (job.faceIndex === -1 || job.initialized) {
            return;
          }
          const face = faceInfo[job.faceIndex];
          const group = new Three.Group();
          scene.add(group);
          group.add(
            ...cubes.filter((el) => el.position[face.axis] === face.direction)
          );
          job.group = group;
          job.initialized = true;
        };

        const prepareRotation = (
          faceIndex: number,
          radian: number,
          count: number,
          resolve: () => void
        ) => {
          const parallelJobs = parallelJobsQueue.at(-1)!;
          const face = faceInfo[faceIndex];

          parallelJobs.axisName = face.axis;
          parallelJobs.axis = axises[face.axis];

          const job = (parallelJobs as any)[face.direction];

          job.faceIndex = faceIndex;
          job.radian = radian;
          job.count += count;
          job.resolvers.push(resolve);
          if (parallelJobsQueue.length === 1) {
            prepareJob(job);
          }
        };

        const applyRotation = (axis: Three.Vector3, job: IRotationJob) => {
          if (!job.count) {
            return;
          }
          const sign = Math.sign(job.count);
          job.group.rotateOnAxis(axis, job.radian * sign);
          job.count -= sign;
          if (!job.count) {
            finishRotation(job);
          }
        };

        const finishRotation = (job: IRotationJob) => {
          for (const cube of [...job.group.children]) {
            const position = cube.getWorldPosition(new Three.Vector3());
            const quaternation = cube.getWorldQuaternion(
              new Three.Quaternion()
            );
            scene.add(cube);
            cube.position.copy(position);
            cube.rotation.setFromQuaternion(quaternation);
            cube.position.x = Math.round(cube.position.x);
            cube.position.y = Math.round(cube.position.y);
            cube.position.z = Math.round(cube.position.z);
          }
          job.group.removeFromParent();
          job.resolvers.forEach((resolve) => resolve());
        };

        const rotate = (
          faceIndex: number = faceNames.U,
          quarterTurns: number = 1,
          counterClockWise: boolean = false
        ) => {
          const face = faceInfo[faceIndex];
          const steps = QUARTERTURN_STEPS;
          const radian = Math.PI / 2 / steps;
          const count = steps * quarterTurns * (counterClockWise ? 1 : -1);

          let parallelJobs = parallelJobsQueue.at(-1);
          if (!parallelJobs || parallelJobs.axisName !== face.axis) {
            parallelJobs = {
              axisName: "",
              axis: new Three.Vector3(),
              "-1": {
                initialized: false,
                faceIndex: -1,
                resolvers: [],
                group: new Three.Group(),
                radian: 0,
                count: 0,
              },
              "1": {
                initialized: false,
                faceIndex: -1,
                resolvers: [],
                group: new Three.Group(),
                radian: 0,
                count: 0,
              },
            };
            parallelJobsQueue.push(parallelJobs);
          }

          // wait for animation loop finished
          return new Promise<void>((resolve) => {
            // prepare group
            prepareRotation(faceIndex, radian, count, resolve);
          });
        };

        cubeControlsRef.current.rotate = rotate;

        render();

        const onAnimate: TOnAnimateFn = ({ render }) => {
          let parallelJobs = parallelJobsQueue.at(0);
          if (!parallelJobs) {
            return;
          }

          applyRotation(parallelJobs.axis, parallelJobs["-1"]);
          applyRotation(parallelJobs.axis, parallelJobs["1"]);
          render();

          if (!parallelJobs["-1"].count && !parallelJobs["1"].count) {
            parallelJobsQueue.shift();
            parallelJobs = parallelJobsQueue.at(0);
            if (!parallelJobs) {
              return;
            }
            prepareJob(parallelJobs["-1"]);
            prepareJob(parallelJobs["1"]);
          }
        };

        return {
          onAnimate,
        };
      },
      [textureProp, initialCubeState]
    );

    React.useEffect(() => {
      const direction = cameraInfo.direction.clone().negate();
      const up = cameraInfo.up.clone();

      let [U] = sortVectorEntries(vectorToEntries(up)).reverse();

      let [F, LR] = sortVectorEntries(
        vectorToEntries(direction).filter(([k]) => k !== U[0])
      ).reverse();

      U[1] = U[1] < 0 ? -1 : 1;
      F[1] = F[1] < 0 ? -1 : 1;
      LR[1] = LR[1] < 0 ? -1 : 1;

      if (U[1] * direction[U[0]] < 0) {
        const D = [U[0], -U[1]] as TVectorEntry;
        U = F;
        F = D;
      }

      const orderMap: Record<string, number> = {
        xy: 1,
        xz: -1,
        yx: -1,
        yz: 1,
        zx: 1,
        zy: -1,
      };

      // default front-right visible
      let L: TVectorEntry = [LR[0], -LR[1]];
      if (U[1] * F[1] * LR[1] * orderMap[`${U[0]}${F[0]}`] < 0) {
        // left-front visible
        const [a, b] = new Three.Vector3(direction[U[0]], direction[F[0]], 0)
          .normalize()
          .toArray();
        if (Math.abs(a - b) < 0.1) {
          L = [F[0], -F[1]];
        } else {
          L = [LR[0], LR[1]];
        }
      }

      const [upFaceIndex] = faceInfoEntries.find(
        ([, v]) => v.axis === U[0] && v.direction === U[1]
      )!;

      const [leftFaceIndex] = faceInfoEntries.find(
        ([, v]) => v.axis === L[0] && v.direction === L[1]
      )!;

      const orientation = Object.keys(coreOrientationMap).find((k) =>
        k.startsWith(`${upFaceIndex}${leftFaceIndex}`)
      )!;

      setOrientation(orientation);
    }, [cameraInfo]);

    React.useEffect(() => {
      if (!onChangeRef.current) {
        return;
      }
      const corePermutation = getCorePermutation(cubeState);
      if (corePermutation === orientation) {
        return;
      }
      let operation = operations[corePermutation];
      if (!operation.reverseAlgorithm) {
        return;
      }
      let tmpState = operate(
        operations,
        cubeState,
        operation.reverseAlgorithm,
        defaultState
      );
      operation = operations[orientation];
      if (!operation.algorithm) {
        onChangeRef.current(tmpState);
        return;
      }
      tmpState = operate(
        operations,
        tmpState,
        operation.algorithm,
        defaultState
      );
      onChangeRef.current(tmpState);
    }, [cubeState, orientation]);

    React.useEffect(() => {
      const tmpState = orientate(operations, cubeState, defaultState);
      // new cube
      const cubeB = stateToCube(tmpState);
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
        console.error("no operation found!");
        setInitialCubeState(tmpState);
        setOrientation("012345");
        return;
      }
      const [operationName] = operation;
      if (operationName === "012345") {
        return;
      }
      if (!(operationName in rotateParams)) {
        console.error(`unknown operationName ${operationName}!`);
        // recreate cube geometry when imperative api for operation doesn't exists
        setInitialCubeState(tmpState);
        setOrientation("012345");
        return;
      }
      // animate changes
      const operationParams = rotateParams[operationName];
      const params =
        typeof operationParams === "function"
          ? operationParams(tmpState)
          : operationParams;
      cubeControlsRef.current.rotate?.(...params);
    }, [cubeState, rotateParams]);

    // add imperative api for uncontrolled input.
    React.useImperativeHandle(
      forwardRef,
      () =>
        createHandle<ICubeHandle>({
          valueKey: "cubeState",
          value: cubeState,
          setValue: setCubeState,
        }),
      [cubeState]
    );

    const { reactElement } = useThree(350, 275, init);

    const upFaceName = alternateFaceNames[Number(orientation[0])];
    const lookAtFaceName = alternateFaceNames[Number(orientation[2])];

    return (
      <div
        style={{
          position: "relative",
          userSelect: "none",
        }}
      >
        {reactElement}
        {isDebugActive() && (
          <div
            style={{
              position: "absolute",
              top: "0px",
              left: "0px",
              color: "red",
              fontSize: "0.5rem",
            }}
          >
            Camera position: ({Math.floor(10 * cameraInfo.position.x) / 10},{" "}
            {Math.floor(10 * cameraInfo.position.y) / 10},{" "}
            {Math.floor(10 * cameraInfo.position.z) / 10})
            <br />
            Camera direction: ({Math.floor(10 * cameraInfo.direction.x) /
              10}, {Math.floor(10 * cameraInfo.direction.y) / 10},{" "}
            {Math.floor(10 * cameraInfo.direction.z) / 10})
            <br />
            Camera up: ({Math.floor(10 * cameraInfo.up.x) / 10},{" "}
            {Math.floor(10 * cameraInfo.up.y) / 10},{" "}
            {Math.floor(10 * cameraInfo.up.z) / 10})
            <br />
            Up: {upFaceName}
            <br />
            Front: {lookAtFaceName}
          </div>
        )}
      </div>
    );
  }
);
