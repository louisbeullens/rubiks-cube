import { TCubeState } from "../rubiks-cube/types";
import { Flex } from "./Flex";

interface IMoveButtonsProps {
  state: TCubeState;
  movesAllowed: Record<string, boolean>;
  onClick?: (move: string) => void;
}

export const MoveButtons = ({
  state: stateProp,
  movesAllowed,
  onClick,
}: IMoveButtonsProps) => {
  // internal buttonClick handler
  const onMoveButtonClickInternal = (move: string) => {
    onClick?.(move);
  };

  return (
    <>
      {Object.entries(movesAllowed)
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
