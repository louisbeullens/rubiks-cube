import React from "react";
import { useSearchParams } from "react-router-dom";
import { earthCubeCharacteristic } from "./components/EarthCube";
import {
  CubeController,
  CubeStorage,
  Flex,
  IStorageData,
  latchCubeCharacteristic,
  rubiksCharacteristic,
  RubiksCube,
} from "./components";
import { registerCube } from "./cube-characteristics";
import { serializeCube } from "./storage-utils";

registerCube(rubiksCharacteristic);
registerCube(latchCubeCharacteristic);
registerCube(earthCubeCharacteristic);

const protocolRegexp = /^web(?:\+|\s)rubik:\/\/([^/]+)\/?$/;

function App() {
  const [params, setParams] = useSearchParams();

  const onSaveClick = React.useCallback(
    (data: IStorageData) => {
      const permaLink = serializeCube(data);
      setParams({ config: permaLink });
    },
    [setParams]
  );

  // extract permalink from protocol url or fallback to config search param
  const protocol = params.get("protocol") ?? "";
  const parsed = protocolRegexp.exec(protocol);
  const permaLink = parsed?.[1] ?? params.get("config");

  return (
    <>
      <Flex row width="100vw" height="100vh">
        <CubeController permaLink={permaLink} onSaveClick={onSaveClick}>
          <RubiksCube />
          <CubeStorage />
        </CubeController>
      </Flex>
    </>
  );
}

export default App;
