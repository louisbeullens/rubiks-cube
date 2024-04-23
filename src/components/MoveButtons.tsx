import React from "react";
import { ganCube } from "../gan";
import { useLatestRef } from "../hooks";
import { useGanCube } from "../hooks/useGanCube";
import { releaseWakeLock, renewWakeLock } from "../wakelock";
import { Flex } from "./Flex";

interface IMoveButtonsProps {
  movesAllowed: Record<string, boolean>;
  onClick?: (move: string) => void;
}

export const MoveButtons = ({ movesAllowed, onClick }: IMoveButtonsProps) => {
  const onClickRef = useLatestRef(onClick);
  const device = useGanCube();

  React.useEffect(() => {
    if (!device) {
      return;
    }
    const visibilityChangeHandler = () => {
      if (document.visibilityState === "hidden") {
        return;
      }
      renewWakeLock();
    };
    const moveHandler = async (event: Event) => {
      onClickRef.current?.(ganCube.lastMove);
      await renewWakeLock();
    };
    device.addEventListener("moved", moveHandler);
    document.addEventListener("visibilitychange", visibilityChangeHandler);
    return () => {
      document.removeEventListener("visibilitychange", visibilityChangeHandler);
      device.removeEventListener("moved", moveHandler);
    };
  }, [device]);

  React.useEffect(
    () => () => {
      releaseWakeLock();
    },
    []
  );

  // internal buttonClick handler
  const onMoveButtonClickInternal = (move: string) => {
    onClickRef.current?.(move);
  };

  const onBluetoothButtonClick = async () => {
    if (device?.connected) {
      await releaseWakeLock();
      await device.disconnect();
      return;
    }
    await ganCube.connect();
    await renewWakeLock();
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
      <Flex grow row>
        <Flex grow column>
          <button
            style={{ lineHeight: "3rem" }}
            onClick={onBluetoothButtonClick}
          >
            {device?.connected ? "Disconnect" : "Connect"}
          </button>
        </Flex>
      </Flex>
    </>
  );
};
