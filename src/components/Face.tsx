import React from "react";
import { rotationMap } from "../rubiks-cube/rotationMap";
import { faceInfo } from "../rubiks-cube/spatial-util";

type TOnClick = (faceIndex: number, u: number, v: number) => void;

interface IFaceProps {
  faceIndex: number;
  face: number[];
  texturePath: string;
  centerRotation?: number;
  onLeftClick?: TOnClick;
  onRightClick?: TOnClick;
}

export const STICKER_SIZE = 100;
export const FACE_SIZE = STICKER_SIZE * 3;

export const Face = ({
  faceIndex,
  face,
  texturePath,
  centerRotation = 0,
  onLeftClick,
  onRightClick,
}: IFaceProps) => {
  const elements: JSX.Element[] = [];

  face.forEach((el, i) => {
    const u = (el % 9) % 3;
    const v = Math.floor((el % 9) / 3);

    const stickerFaceIndex = Math.floor(el / 9);
    const { textureU, textureV } = faceInfo[stickerFaceIndex];

    const svgX = ((i % 3) + 0.5) * STICKER_SIZE;
    const svgY = (Math.floor(i / 3) + 0.5) * STICKER_SIZE;
    const imageX = -(textureU * FACE_SIZE + u * STICKER_SIZE);
    const imageY = -(textureV * FACE_SIZE + v * STICKER_SIZE);

    const rotation =
      i === 4
        ? centerRotation
        : (rotationMap as any)[stickerFaceIndex * 9 + i][el];

    elements.push(
      <g
        key={i}
        transform={` translate(${svgX} ${svgY}) rotate(${rotation * 90})`}
        onClick={() =>
          onLeftClick?.(faceIndex, (i % 3) - 1, Math.floor(i / 3) - 1)
        }
        onContextMenuCapture={(e) => {
          e.preventDefault();
          onRightClick?.(faceIndex, (i % 3) - 1, Math.floor(i / 3) - 1);
        }}
      >
        <svg
          x={-STICKER_SIZE / 2}
          y={-STICKER_SIZE / 2}
          width={STICKER_SIZE}
          height={STICKER_SIZE}
        >
          <image
            x={imageX}
            y={imageY}
            href={texturePath}
            width={12 * STICKER_SIZE}
            height={9 * STICKER_SIZE}
          ></image>
        </svg>
      </g>
    );
  });

  return <>{elements}</>;
};
