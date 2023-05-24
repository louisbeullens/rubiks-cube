import React from "react";
import { defaultState } from "../rubiks-cube/cube-util";
import fundamentalOperations from "../rubiks-cube/fundamentalOperations";
import {
  createOperationMap,
  initOperationMap,
  operate,
} from "../rubiks-cube/operation-util";
import { TCubeState } from "../rubiks-cube/types";
import { Flex } from "./Flex";

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
      {Object.entries(getMovesAllowed(stateProp))
        .map((el, i, arr) => arr.slice(i, i + 3))
        .filter((el, i) => i % 3 === 0)
        .map((group, i) => (
          <Flex key={i} grow row>
            {group.map(([move, enabled]) => (
              <Flex key={move} grow column>
                <button
                  style={{ lineHeight: "3rem" }}
                  disabled={!enabled}
                  onClick={() => onMoveButtonClickInternal(move)}
                >
                  {move}
                </button>
              </Flex>
            ))}
          </Flex>
        ))}
    </>
  );
};
