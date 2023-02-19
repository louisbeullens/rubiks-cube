import React from "react";
import { EPerspective } from "./components/RubiksCube";
import { CubeController } from "./components/CubeController";
import { LatchCube } from "./components/LatchCube";
import { CubeStorage, Flex } from "./components";

function App() {
  const [cubePerspective, setCubePerspective] = React.useState(
    EPerspective.UNFOLDED
  );

  const onPerspectiveChange = React.useCallback(
    (perspective: EPerspective) => setCubePerspective(perspective),
    []
  );

  return (
    <Flex row width="100vw">
      <CubeController
        // {...{ cubeRef }}
        perspective={cubePerspective}
        {...{ onPerspectiveChange }}
      >
        <LatchCube />
        <CubeStorage />
      </CubeController>
    </Flex>
  );
}

export default App;
