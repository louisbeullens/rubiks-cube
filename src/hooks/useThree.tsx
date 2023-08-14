import React from "react";
import * as Three from "three";
import { ArcballControls as Controls } from "three/examples/jsm/controls/ArcballControls";

export interface ITools {
  scene: Three.Scene;
  camera: Three.PerspectiveCamera;
  canvas: HTMLCanvasElement | null;
  renderer?: Three.WebGLRenderer;
  controls?: Controls;
  render: () => void | undefined;
}

export type TOnAnimateFn = (tools: ITools) => void;

export type TInitFn = (tools: ITools) => {
  onAnimate?: TOnAnimateFn;
} | void;

export const useThree = (width: number, height: number, init?: TInitFn) => {
  const sceneRef = React.useRef(new Three.Scene());
  const cameraRef = React.useRef(
    new Three.PerspectiveCamera(75, width / height, 0.1, 1000)
  );
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const rendererRef = React.useRef<Three.WebGLRenderer | undefined>(undefined);
  const controlsRef = React.useRef<Controls | undefined>(undefined);
  const animationFrameRef = React.useRef<number | undefined>(undefined);

  // render helper
  const renderFnRef = React.useRef(() => {
    return rendererRef.current?.render(sceneRef.current, cameraRef.current);
  });

  // init WebGLRenderer when canvas renders
  const refWithCallback = React.useCallback(
    (canvas: HTMLCanvasElement | null) => {
      canvasRef.current = canvas;
      if (!canvas) {
        rendererRef.current?.dispose();
        rendererRef.current = undefined;
        controlsRef.current?.dispose();
        controlsRef.current = undefined;
        return;
      }

      const renderer = (rendererRef.current = new Three.WebGLRenderer({
        canvas,
      }));
      const controls = (controlsRef.current = new Controls(
        cameraRef.current,
        canvas
      ));

      controls.addEventListener("change", () =>
        renderer.render(sceneRef.current, cameraRef.current)
      );
      controls.enableZoom = false;
      controls.enablePan = false;
    },
    []
  );

  React.useEffect(() => {
    if (!init) {
      return;
    }

    const canvas = canvasRef.current;
    const renderer = rendererRef.current;
    const controls = controlsRef.current;
    const { onAnimate } =
      init({
        scene: sceneRef.current,
        camera: cameraRef.current,
        canvas,
        renderer,
        controls,
        render: renderFnRef.current,
      }) || {};

    if (onAnimate) {
      const animate = () => {
        onAnimate({
          scene: sceneRef.current,
          camera: cameraRef.current,
          canvas,
          renderer,
          controls,
          render: renderFnRef.current,
        });
        animationFrameRef.current = window.requestAnimationFrame(animate);
      };
      animate();
    }
    return () => {
      const animationHandle = animationFrameRef.current;
      if (!animationHandle) {
        return;
      }
      window.cancelAnimationFrame(animationHandle);
    };
  }, [init]);

  return {
    reactElement: (
      <canvas ref={refWithCallback} width={width} height={height} />
    ),
    scene: sceneRef.current,
    camera: cameraRef.current,
    canvasRef,
    rendererRef,
    controlsRef,
    render: renderFnRef.current,
  };
};
