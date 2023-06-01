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
  onSwipeU?: (faceIndex: number, uDirection: number, vPoint: number) => void;
  onSwipeV?: (faceIndex: number, uPoint: number, vDirection: number) => void;
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
  onSwipeU,
  onSwipeV,
}: IFaceProps) => {
  const elements: JSX.Element[] = [];

  const pointerEvents: Array<[number, number, number]> = [];

  const addPointerEvent = (faceIndex: number, u: number, v: number) => {
    const last = pointerEvents.at(-1);
    if (last && last[0] === faceIndex && last[1] === u && last[2] === v) {
      return;
    }
    pointerEvents.push([faceIndex, u, v]);
    if (pointerEvents.length > 2) {
      pointerEvents.shift();
    }
  };

  const onPointerDownFactory =
    (faceIndex: number, u: number, v: number): ((e: any) => void) =>
    () => {
      pointerEvents.splice(0, Number.POSITIVE_INFINITY);
      addPointerEvent(faceIndex, u, v);
    };

  const onPointerEnterFactory =
    (faceIndex: number, u: number, v: number): ((e: any) => void) =>
    (e: { buttons?: number }) => {
      if (e.buttons === 0) {
        return;
      }
      addPointerEvent(faceIndex, u, v);
    };

  const onPointerUpFactory =
    (faceIndex: number, u: number, v: number): ((e: any) => void) =>
    () => {
      addPointerEvent(faceIndex, u, v);
      if (pointerEvents.length < 2) {
        return;
      }
      const [a, b] = pointerEvents;
      pointerEvents.splice(0, Number.POSITIVE_INFINITY);
      if (!onSwipeU && !onSwipeV) {
        return;
      }
      if (a[0] !== b[0] || (b[1] - a[1] !== 0 && b[2] - a[2] !== 0)) {
        return;
      }
      const normalizedU = Math.sign(b[1] - a[1]);
      const normalizedV = Math.sign(b[2] - a[2]);

      normalizedV === 0
        ? onSwipeU?.(faceIndex, normalizedU, a[2])
        : onSwipeV?.(faceIndex, a[1], normalizedV);
    };

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
        onMouseDown={onPointerDownFactory(
          faceIndex,
          (i % 3) - 1,
          Math.floor(i / 3) - 1
        )}
        onMouseEnter={onPointerEnterFactory(
          faceIndex,
          (i % 3) - 1,
          Math.floor(i / 3) - 1
        )}
        onMouseUp={onPointerUpFactory(
          faceIndex,
          (i % 3) - 1,
          Math.floor(i / 3) - 1
        )}
        onPointerDown={onPointerDownFactory(
          faceIndex,
          (i % 3) - 1,
          Math.floor(i / 3) - 1
        )}
        onPointerEnter={onPointerEnterFactory(
          faceIndex,
          (i % 3) - 1,
          Math.floor(i / 3) - 1
        )}
        onPointerUp={onPointerUpFactory(
          faceIndex,
          (i % 3) - 1,
          Math.floor(i / 3) - 1
        )}
        onTouchStart={onPointerDownFactory(
          faceIndex,
          (i % 3) - 1,
          Math.floor(i / 3) - 1
        )}
        onTouchMove={onPointerEnterFactory(
          faceIndex,
          (i % 3) - 1,
          Math.floor(i / 3) - 1
        )}
        onTouchEnd={onPointerUpFactory(
          faceIndex,
          (i % 3) - 1,
          Math.floor(i / 3) - 1
        )}
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
