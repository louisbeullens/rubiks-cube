import React from "react";
import { useSearchParams } from "react-router-dom";

import { CubeController } from "./components/CubeController";
import {
  CubeStorage,
  EPerspective,
  Flex,
  ICubeHandle,
  IStorageData,
  LatchCube,
  MoveButtons,
  RubiksCube,
} from "./components";
import {
  getCubeCharacteristicsByType,
  serializeCube,
} from "./cube-characteristics";

function App() {
  const [params, setParams] = useSearchParams();

  const handleSave = React.useCallback(
    (data: IStorageData, createNew: boolean) => {
      if (!createNew) {
        return;
      }
      const characteristic = getCubeCharacteristicsByType(data.type);
      const permaLink = serializeCube(data, characteristic.significantBits);
      setParams({ config: permaLink });
    },
    [setParams]
  );

  const cubeRef = React.useRef<ICubeHandle>(null);

  return (
    <>
      <Flex row width="100vw" wrapReverse>
        <CubeController
          permaLink={params.get("config")}
          {...{ handleSave }}
          initialPerspective={EPerspective.UNFOLDED}
        >
          <RubiksCube />
          <CubeStorage />
        </CubeController>
      </Flex>
      {/* <LatchCube ref={cubeRef} perspective={EPerspective.ISOMETRIC} />
      <MoveButtons {...{cubeRef}} /> */}
    </>
  );
}

export default App;
