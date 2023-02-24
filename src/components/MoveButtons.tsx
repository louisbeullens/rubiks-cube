import React from "react";

import { usePropOverState } from "../hooks";
import {
  allMoves,
  createSolvedState,
  getAllowedMoves,
  rotateByMoveName,
  TCanFaceRotate,
  TCubeState,
  TMoveNames,
} from "../rubiks-cube";

import { ICubeHandle } from "./RubiksCube.types";

interface IMoveButtonsProps {
  cubeRef?: React.RefObject<ICubeHandle>;
  state?: TCubeState;
  canFaceRotate?: TCanFaceRotate;
  onClick?: (move: TMoveNames, newState: TCubeState) => void;
}

export const MoveButtons = ({
  cubeRef,
  state: stateProp,
  canFaceRotate,
  onClick,
}: IMoveButtonsProps) => {
  // allow component to act on newState from cubeRef.current.rotateByMoveName
  // even in the case that the cube has not rerendered itself
  const [state, setState] = usePropOverState(createSolvedState(), stateProp);

  // update the state when cubeRef.current is available
  React.useEffect(() => {
    if (!cubeRef || !cubeRef.current) {
      return;
    }
    setState(cubeRef.current.getState());
    // eslint-disable-next-line @grncdr/react-hooks/exhaustive-deps
  }, [setState, cubeRef, cubeRef?.current]);

  // internal buttonClick handler
  // prefer stateProp
  // eventually fallback to cubeRef
  const onMoveButtonClickInternal = (move: TMoveNames) => {
    let newState: TCubeState | undefined;
    if (stateProp) {
      newState = rotateByMoveName(state, move, canFaceRotate);
    } else if (cubeRef) {
      newState = cubeRef.current?.rotateByMoveName(move);
    }
    if (!newState) {
      return;
    }
    setState(newState);
    onClick?.(move, newState);
  };

  // get allowed moves for current state
  const enabledMoves = getAllowedMoves(
    state,
    canFaceRotate ?? cubeRef?.current?.canFaceRotate
  );

  return (
    <>
      {Object.keys(allMoves).map((untypedMove) => {
        const move = untypedMove as TMoveNames;
        return (
          <button
            key={move}
            disabled={!enabledMoves.includes(move)}
            onClick={() => onMoveButtonClickInternal(move)}
          >
            {move}
          </button>
        );
      })}
    </>
  );
};
