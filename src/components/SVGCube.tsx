import React from "react";
import isEqual from "lodash/isEqual";
import { createHandle } from "../component-utils";
import { useControlledState } from "../hooks";
import defaultTexture from "../images/rubiks-cube.png";
import coordinates from "../rubiks-cube/coordinates";
import {
  defaultState,
  getCorePermutation,
  stateToCube,
} from "../rubiks-cube/cube-util";
import { coreOrientationMap } from "../rubiks-cube/rotationMap";
import {
  faceNames as untypedFaceNames,
  uvToPoint3D,
} from "../rubiks-cube/spatial-util";
import { TCubeState } from "../rubiks-cube/types";
import { mod4 } from "../utils";
import { EPerspective, ICubeProps } from "./RubiksCube.types";
import { FACE_SIZE, STICKER_SIZE, SVGFace } from "./SVGFace";

const faceNames = untypedFaceNames as Record<string, number>;

const { SQRT1_2, SQRT2 } = Math;

const PADDING_LEFT =
  (14 * STICKER_SIZE - (2 * FACE_SIZE * SQRT2 + STICKER_SIZE)) / 2;

const PADDING_TOP =
  (11 * STICKER_SIZE - (FACE_SIZE * SQRT2 + FACE_SIZE * SQRT1_2)) / 2;

const perspectives: Record<number, Record<number, string>> = {
  [EPerspective.UNFOLDED]: {
    [faceNames.U]: `translate(${FACE_SIZE + STICKER_SIZE} ${STICKER_SIZE})`,
    [faceNames.L]: `translate(${STICKER_SIZE} ${FACE_SIZE + STICKER_SIZE})`,
    [faceNames.F]: `translate(${FACE_SIZE + STICKER_SIZE} ${
      FACE_SIZE + STICKER_SIZE
    })`,
    [faceNames.R]: `translate(${2 * FACE_SIZE + STICKER_SIZE} ${
      FACE_SIZE + STICKER_SIZE
    })`,
    [faceNames.B]: `translate(${3 * FACE_SIZE + STICKER_SIZE} ${
      FACE_SIZE + STICKER_SIZE
    })`,
    [faceNames.D]: `translate(${FACE_SIZE + STICKER_SIZE} ${
      2 * FACE_SIZE + STICKER_SIZE
    })`,
  },
  [EPerspective.ISOMETRIC]: {
    // U
    [faceNames.U]: `translate(${PADDING_LEFT} ${PADDING_TOP}) scale(${SQRT1_2}) translate(${FACE_SIZE} ${FACE_SIZE}) scale(${SQRT2}) rotate(45) translate(${
      -FACE_SIZE / 2
    } ${-FACE_SIZE / 2})`,
    // L
    [faceNames.L]: `translate(${PADDING_LEFT} ${PADDING_TOP}) translate(${
      FACE_SIZE * SQRT2 + STICKER_SIZE
    }) scale(${-SQRT1_2} ${SQRT1_2}) translate(${-FACE_SIZE}) skewY(45)`,
    // F
    [faceNames.F]: `translate(${PADDING_LEFT} ${PADDING_TOP}) scale(${SQRT1_2}) skewY(45) translate(0 ${FACE_SIZE})`,
    // R
    [faceNames.R]: `translate(${PADDING_LEFT} ${PADDING_TOP}) scale(${SQRT1_2}) skewY(-45) translate(${FACE_SIZE} ${
      FACE_SIZE * 3
    })`,
    // B
    [faceNames.B]: `translate(${PADDING_LEFT} ${PADDING_TOP}) translate(${
      FACE_SIZE * SQRT2 + STICKER_SIZE
    }) scale(${-SQRT1_2} ${SQRT1_2}) translate(${
      -FACE_SIZE * 2
    } ${FACE_SIZE}) skewY(-45)`,
    // D
    [faceNames.D]: `translate(${PADDING_LEFT} ${PADDING_TOP}) translate(${
      FACE_SIZE * SQRT2 + STICKER_SIZE
    }) scale(${SQRT1_2}) translate(${FACE_SIZE} ${
      FACE_SIZE * 2
    }) scale(${SQRT2} ${-SQRT2}) rotate(-45) translate(${-FACE_SIZE / 2} ${
      -FACE_SIZE / 2
    })`,
  },
};

export interface ICubeHandle {
  cubeState: TCubeState;
}

export const SVGCube = React.forwardRef<ICubeHandle, ICubeProps>(
  (
    {
      cubeState: cubeStateProp,
      texture = defaultTexture,
      perspective: perspectiveType = EPerspective.UNFOLDED,
      scale = 0.5,
      onChange,
      onSwipeU,
      onSwipeV,
    },
    forwardRef
  ) => {
    // allow both controlled and uncontrolled input.
    const [cubeState, setCubeState] = useControlledState(
      defaultState,
      cubeStateProp
    );

    const cube = stateToCube(cubeState);

    const onLeftClick = (faceIndex: number, u: number, v: number) => {
      if (u === 0 && v === 0) {
        return;
      }

      const point = uvToPoint3D(faceIndex, u, v);
      const i = coordinates.findIndex(
        ({ x, y, z }) => x === point.x && y === point.y && z === point.z
      );

      const newState = [...cubeState];
      newState[i] =
        i < 12 ? (newState[i] % 24) + 2 : ((newState[i] - 36) % 24) + 39;

      onChange?.(newState);
      setCubeState(newState);
    };

    const onRightClick = (faceIndex: number, u: number, v: number) => {
      const point = uvToPoint3D(faceIndex, u, v);
      let i = coordinates.findIndex(
        ({ x, y, z }) => x === point.x && y === point.y && z === point.z
      );
      i = i === -1 ? 20 + faceIndex : i;

      const modulus = i < 12 ? 2 : i < 20 ? 3 : 4;
      const newState = [...cubeState];

      const base = Math.floor(newState[i] / modulus);
      const orientation = newState[i] % modulus;

      newState[i] = modulus * base + ((orientation + 1) % modulus);

      onChange?.(newState);
      setCubeState(newState);
    };

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

    const perspective = perspectives[perspectiveType];

    const corePermutation = getCorePermutation(cubeState);

    const coreOrientation = (coreOrientationMap as Record<string, number[]>)[
      corePermutation
    ];

    const faceElements: JSX.Element[] = [];

    cube.forEach((face, faceIndex) => {
      faceElements.push(
        <g key={faceIndex} transform={perspective[faceIndex]}>
          <SVGFace
            faceIndex={faceIndex}
            face={face}
            texturePath={texture}
            centerRotation={mod4(coreOrientation[faceIndex], face[4] % 9)}
            onLeftClick={onLeftClick}
            onRightClick={onRightClick}
            onSwipeU={onSwipeU}
            onSwipeV={onSwipeV}
          />
        </g>
      );
    });

    return (
      <svg width={14 * STICKER_SIZE * scale} height={11 * STICKER_SIZE * scale}>
        <g transform={`scale(${scale})`}>{faceElements}</g>
      </svg>
    );
  }
);

export default React.memo(SVGCube, (prevProps, nextProps) => {
  if (Object.keys(prevProps).length !== Object.keys(nextProps).length) {
    return false;
  }
  for (const key in nextProps) {
    if (
      key === "cubeState" &&
      !isEqual(prevProps.cubeState, nextProps.cubeState)
    ) {
      return false;
    } else if ((prevProps as any)[key] !== (nextProps as any)[key]) {
      return false;
    }
  }
  return true;
});
