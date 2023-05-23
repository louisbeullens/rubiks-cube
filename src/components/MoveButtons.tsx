import React from "react";
import { defaultState } from "../rubiks-cube/cube-util";
import fundamentalOperations from "../rubiks-cube/fundamentalOperations";
import {
  createOperationMap,
  initOperationMap,
  operate,
} from "../rubiks-cube/operation-util";
import { TCubeState } from "../rubiks-cube/types";

interface IMoveButtonsProps {
  state: TCubeState;
  onClick?: (newState: TCubeState, move: string) => void;
  getMovesAllowed: (state: TCubeState) => Record<string, boolean>;
}

export const MoveButtons = ({
  state: stateProp,
  onClick,
  getMovesAllowed,
}: IMoveButtonsProps) => {
  const operationsRef = React.useRef(
    initOperationMap(createOperationMap(fundamentalOperations), defaultState)
  );

  // internal buttonClick handler
  const onMoveButtonClickInternal = (move: string) => {
    onClick?.(
      operate(operationsRef.current, stateProp, move, defaultState),
      move
    );
  };

  return (
    <>
      {Object.entries(getMovesAllowed(stateProp)).map(([move, enabled]) => {
        return (
          <button
            key={move}
            disabled={!enabled}
            onClick={() => onMoveButtonClickInternal(move)}
          >
            {move}
          </button>
        );
      })}
    </>
  );
};