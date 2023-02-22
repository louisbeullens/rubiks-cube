import React from "react";
import { EPerspective } from "./components/RubiksCube";
import { CubeController } from "./components/CubeController";
import { LatchCube } from "./components/LatchCube";
import { CubeStorage, Flex } from "./components";
import { useSearchParams } from "react-router-dom";

function App() {
  const [params, setParams] = useSearchParams();
  const onPermaLinkChange = React.useCallback((config: string) => {
    setParams({ config });
  }, []);

  const [cubePerspective, setCubePerspective] = React.useState(
    EPerspective.UNFOLDED
  );

  const onPerspectiveChange = React.useCallback((perspective: EPerspective) => {
    setCubePerspective(perspective);
  }, []);

  return (
    <Flex row width="100vw">
      <CubeController
        permaLink={params.get("config")}
        // {...{ cubeRef }}
        perspective={cubePerspective}
        {...{ onPermaLinkChange, onPerspectiveChange }}
      >
        <LatchCube />
        <CubeStorage />
      </CubeController>
    </Flex>
  );
}

export default App;
