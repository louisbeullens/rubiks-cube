import React from "react";
import { setupGANCube } from "../gan";
import { useLatestRef } from "../hooks";
import { releaseWakeLock, renewWakeLock } from "../wakelock";
import { Flex } from "./Flex";

interface IMoveButtonsProps {
  movesAllowed: Record<string, boolean>;
  onClick?: (move: string) => void;
}

export const MoveButtons = ({ movesAllowed, onClick }: IMoveButtonsProps) => {
  const onClickRef = useLatestRef(onClick);
  const [device, setDevice] = React.useState<BluetoothDevice | null>(null);

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
    document.addEventListener("visibilitychange", visibilityChangeHandler);
    return () => {
      document.removeEventListener("visibilitychange", visibilityChangeHandler);
      device?.gatt?.disconnect();
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

  const ganCb = React.useCallback(async (move: string) => {
    onClickRef.current?.(move);
    await renewWakeLock();
  }, []);

  const onBluetoothButtonClick = async () => {
    if (device?.gatt?.connected) {
      releaseWakeLock();
      device.gatt.disconnect();
      setDevice(null);
      return;
    }
    const ganCube = await setupGANCube(ganCb);
    ganCube.addEventListener("gattserverdisconnected", () => {
      releaseWakeLock();
      setDevice(null);
    });
    setDevice(ganCube);
    await renewWakeLock();
  };

  const ganConnected = device?.gatt?.connected;

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
            {ganConnected ? "Disconnect" : "Connect"}
          </button>
        </Flex>
      </Flex>
    </>
  );
};
