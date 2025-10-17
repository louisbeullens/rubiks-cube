import React from "react";
import { getCubeCharacteristicsByType } from "../cube-characteristics";
import { ganCube } from "../gan";
import { useLatestRef } from "../hooks";
import { cubeToState, defaultState } from "../rubiks-cube/cube-util";
import fundamentalOperations from "../rubiks-cube/fundamentalOperations";
import {
  createOperationMap,
  initOperationMap,
  operate,
} from "../rubiks-cube/operation-util";
import { TCubeState } from "../rubiks-cube/types";
import { deserializeCube, serializeCube } from "../storage-utils";
import { clone } from "../utils";
import { CubeStorage } from "./CubeStorage";
import {
  ICubeStorageHandle,
  ICubeStorageProps,
  IStorageData,
} from "./CubeStorage.types";
import { Flex } from "./Flex";
import { MoveButtons } from "./MoveButtons";
import { getRubiksCubeMovesAllowed, RubiksCube } from "./RubiksCube";
import { ECubeType, EPerspective, ICubeHandle } from "./RubiksCube.types";

export interface ICubeControlProps {
  cubeRef?: React.RefObject<ICubeHandle>;
  getMovesAllowed?: typeof getRubiksCubeMovesAllowed;
  permaLink?: string | null;
  initialPerspective?: EPerspective;
  onSaveClick?: (data: IStorageData) => void;
  children?: React.ReactElement | React.ReactElement[];
}

const operations = initOperationMap(createOperationMap(fundamentalOperations));

const swipeMap: Record<string, string> = {
  "u:0:-1:-1": "B",
  "v:0:-1:-1": "L'",
  "u:0:-1:1": "F'",
  "v:0:-1:1": "L",
  "u:0:1:-1": "B'",
  "v:0:1:-1": "R",
  "u:0:1:1": "F",
  "v:0:1:1": "R'",
  "u:1:-1:-1": "U",
  "v:1:-1:-1": "B'",
  "u:1:-1:1": "D'",
  "v:1:-1:1": "B",
  "u:1:1:-1": "U'",
  "v:1:1:-1": "F",
  "u:1:1:1": "D",
  "v:1:1:1": "F'",
  "u:2:-1:-1": "U",
  "v:2:-1:-1": "L'",
  "u:2:-1:1": "D'",
  "v:2:-1:1": "L",
  "u:2:1:-1": "U'",
  "v:2:1:-1": "R",
  "u:2:1:1": "D",
  "v:2:1:1": "R'",
  "u:3:-1:-1": "U",
  "v:3:-1:-1": "F'",
  "u:3:-1:1": "D'",
  "v:3:-1:1": "F",
  "u:3:1:-1": "U'",
  "v:3:1:-1": "B",
  "u:3:1:1": "D",
  "v:3:1:1": "B'",
  "u:4:-1:-1": "U",
  "v:4:-1:-1": "R'",
  "u:4:-1:1": "D'",
  "v:4:-1:1": "R",
  "u:4:1:-1": "U'",
  "v:4:1:-1": "L",
  "u:4:1:1": "D",
  "v:4:1:1": "L'",
  "u:5:-1:-1": "F",
  "v:5:-1:-1": "L'",
  "u:5:-1:1": "B'",
  "v:5:-1:1": "L",
  "u:5:1:-1": "F'",
  "v:5:1:-1": "R",
  "u:5:1:1": "B",
  "v:5:1:1": "R'",
};

export const CubeController = ({
  cubeRef,
  getMovesAllowed: getMovesAllowedProp,
  permaLink,
  initialPerspective = EPerspective.UNFOLDED,
  onSaveClick,
  children: untypedChildren,
}: ICubeControlProps) => {
  const getMovesAllowed = getMovesAllowedProp ?? getRubiksCubeMovesAllowed;

  const children = React.Children.toArray(
    untypedChildren
  ) as React.ReactElement[];

  const Cube = children.find(
    (child) => React.isValidElement(child) && child.type === RubiksCube
  ) as React.ReactElement<{}> | undefined;

  const Storage = children.find(
    (child) => React.isValidElement(child) && child.type === CubeStorage
  ) as React.ReactElement<ICubeStorageProps> | undefined;

  const [characteristic, setCharacteristic] = React.useState(
    getCubeCharacteristicsByType(ECubeType.Rubiks)
  );
  const [perspective, setPerspective] = React.useState(initialPerspective);
  const [state, setState] = React.useState(
    cubeRef?.current?.cubeState ?? defaultState
  );
  const stateRef = useLatestRef(state);
  const [autoStorage, setAutoStorage] = React.useState(
    permaLink ? false : true
  );
  const [editable, setEditable] = React.useState(true);

  const storageRef = React.useRef<ICubeStorageHandle>(null);

  const autoStorageRef = useLatestRef(autoStorage);
  const editableRef = useLatestRef(editable);

  // wrap eventCallbacks in ref
  const onSaveClickRef = useLatestRef(onSaveClick);

  const onAutoStorageChange = () => setAutoStorage((toggle) => !toggle);
  const onEditableChange = () => setEditable((toggle) => !toggle);

  const reffedCubeState = cubeRef?.current?.cubeState;

  React.useEffect(() => {
    if (!reffedCubeState) {
      return;
    }
    setState(reffedCubeState);
  }, [reffedCubeState]);

  // Save / Load functions
  const saveConfig = React.useCallback(
    (data: IStorageData, createNew = false) => {
      storageRef.current?.save(data, createNew);
    },
    []
  );

  const loadConfig = React.useCallback(
    (data: IStorageData) => {
      setPerspective((current) => data.perspective ?? current);
      setCharacteristic(getCubeCharacteristicsByType(data.type));
      if (cubeRef?.current) {
        cubeRef.current.cubeState = data.state;
      }
      setState((current) => data.state ?? current);
    },
    [cubeRef]
  );

  // convert permaLink to states
  React.useEffect(() => {
    if (!permaLink) {
      return;
    }
    const data = deserializeCube(permaLink);
    loadConfig(data);
    // don't make next render override selected cube
    setAutoStorage(false);
  }, [permaLink, loadConfig]);

  React.useEffect(() => {
    if (!autoStorageRef.current) {
      return;
    }
    saveConfig({
      type: characteristic.type,
      perspective,
      state,
    });
  }, [perspective, characteristic, state, saveConfig]);

  const onPerspectiveChange: React.ChangeEventHandler<HTMLSelectElement> = (
    e
  ) => {
    const perspective = parseInt(e.target.value);
    setPerspective(perspective);
  };

  const onLoadClickInternal = async () => {
    let data = storageRef.current?.load();
    if (data) {
      loadConfig(data);
      return;
    }
    const ganState = await ganCube.requestFacelets();
    if (!ganState) {
      return;
    }
    data = {
      type: characteristic.type,
      perspective: perspective,
      state: cubeToState(ganState),
    };
    loadConfig(data);
  };

  const onSaveClickInternal = () => {
    const newState = clone(state);
    const data = {
      perspective,
      type: characteristic.type,
      state: newState,
    };
    onSaveClickRef.current?.(data);
    saveConfig(data, true);
  };

  const onShareClickInternal = () => {
    const newState = clone(state);
    const data = {
      title: "Cube",
      url: `https://louisbeullens.github.io/rubiks-cube/?config=${serializeCube(
        {
          perspective,
          type: characteristic.type,
          state: newState,
        }
      )}`,
    };
    navigator.share(data);
  };

  const movesAllowed = cubeRef
    ? getMovesAllowed(state)
    : characteristic.getMovesAllowed(state);

  const onCubeChange = (state: TCubeState) => {
    if (!editableRef.current) {
      return;
    }

    setState(state);
  };

  const onCubeSwipeFactory =
    (uOrV: string) => (faceIndex: number, u: number, v: number) => {
      const key = `${uOrV}:${faceIndex}:${u}:${v}`;
      if (!(key in swipeMap)) {
        return;
      }
      const move = swipeMap[key];
      if (!(move in movesAllowed) || movesAllowed[move] === false) {
        return;
      }
      const newState = operate(operations, state, move);
      if (cubeRef?.current) {
        cubeRef.current.cubeState = newState;
      }
      setState(newState);
    };

  const onMoveButtonClick = (move: string) => {
    const tmpState = stateRef.current;
    if (!(move in operations)) {
      return;
    }
    const tmpMovesAllowed = characteristic.getMovesAllowed(tmpState);
    if (!tmpMovesAllowed[move]) {
      return;
    }
    const newState = operate(operations, tmpState, move);
    if (cubeRef?.current) {
      cubeRef.current.cubeState = newState;
    }
    stateRef.current = newState;
    setState(newState);
  };

  const onScriptClickInternal = async () => {
    let tmpState = stateRef.current;

    const sleep = (ms: number) =>
      new Promise((resolve) => setTimeout(resolve, ms));

    // D R' D L2 R2 U' R U' B U2 D' R D L2 R2 U' R' U D2 F'

    let c = 0;

    for (let j = 0; j < 1; j++) {
      for (const move of "B2 U' B U' L U2 D' B D F2 B2 U' B' U D2 U2 F2".split(
        " "
      )) {
        tmpState = operate(operations, tmpState, move);
        if (cubeRef?.current) {
          cubeRef.current.cubeState = tmpState;
        }
        stateRef.current = tmpState;
        setState(tmpState);
        console.log(++c);
        await sleep(100);
      }

      // for (const move of "U F' U F2 B2 D' F D' L".split(" ")) {
      //   tmpState = operate(operations, tmpState, move);
      //   if (cubeRef?.current) {
      //     cubeRef.current.cubeState = tmpState;
      //   }
      //   stateRef.current = tmpState;
      //   setState(tmpState);
      //   console.log(++c);
      //   await sleep(100);
      // }

      // for (let i = 0; i < 839; i++) {
      //   for (const move of "D R' D L2 R2 U' R U' B U2 D' R D L2 R2 U'".split(
      //     " "
      //   )) {
      //     tmpState = operate(operations, tmpState, move);
      //     if (cubeRef?.current) {
      //       cubeRef.current.cubeState = tmpState;
      //     }
      //     stateRef.current = tmpState;
      //     setState(tmpState);
      //     console.log(++c);
      //     await sleep(100);
      //   }
      // }

      // for (let i = 0; i < 839; i++) {
      //   for (const move of "R' U D2 F'".split(" ")) {
      //     tmpState = operate(operations, tmpState, move);
      //     if (cubeRef?.current) {
      //       cubeRef.current.cubeState = tmpState;
      //     }
      //     stateRef.current = tmpState;
      //     setState(tmpState);
      //     console.log(++c);
      //     await sleep(100);
      //   }
      // }

      // for (const move of "D2 U' F U F2 B2 D' F' B D'".split(" ")) {
      //   tmpState = operate(operations, tmpState, move);
      //   if (cubeRef?.current) {
      //     cubeRef.current.cubeState = tmpState;
      //   }
      //   stateRef.current = tmpState;
      //   setState(tmpState);
      //   console.log(++c);
      //   await sleep(100);
      // }
    }
  };

  const onStorageChange = (item?: IStorageData) => {
    if (!autoStorageRef.current || !item) {
      return;
    }
    loadConfig(item);
  };

  const renderCube = () => {
    if (!Cube) {
      return;
    }

    return (
      <RubiksCube
        scale={0.25}
        cubeState={state}
        texture={characteristic.texture}
        perspective={perspective}
        onChange={onCubeChange}
        onSwipeU={onCubeSwipeFactory("u")}
        onSwipeV={onCubeSwipeFactory("v")}
        rotateParams={characteristic.rotateParams}
      />
    );
  };

  const renderStorage = () => {
    if (!Storage) {
      return;
    }
    return React.cloneElement(Storage, {
      ref: storageRef,
      onChange: onStorageChange,
    });
  };

  const inputStyle = React.useMemo(() => ({ margin: "0 1em" }), []);

  return (
    <Flex grow column spaceBetween padding="0 1vw" gap="1rem">
      <div
        style={{
          backgroundColor: "#FFFFFF",
          position: "sticky",
          top: "0px",
        }}
      >
        <Flex row spaceAround>
          {renderCube()}
        </Flex>
      </div>
      <Flex row wrap spaceAround gap="1rem">
        <Flex grow={1} column>
          <MoveButtons
            onClick={onMoveButtonClick}
            movesAllowed={movesAllowed}
          />
        </Flex>
        <Flex grow={11} column>
          <Flex row wrap spaceAround>
            <Flex row>
              <button onClick={onLoadClickInternal}>Load</button>
              <button onClick={onSaveClickInternal}>Save</button>
              <button onClick={onShareClickInternal}>Share</button>
              {/* <button onClick={onScriptClickInternal}>Script</button> */}
            </Flex>
            <Flex row>
              Perspective
              <select
                onChange={onPerspectiveChange}
                value={perspective}
                style={inputStyle}
              >
                <option value={EPerspective.UNFOLDED}>unfold</option>
                <option value={EPerspective.THREE_DIMENSIONAL}>3D</option>
              </select>
            </Flex>
            <Flex row>
              <input
                type="checkbox"
                checked={autoStorage}
                onChange={onAutoStorageChange}
                style={inputStyle}
              />
              Auto load / Auto save
              <input
                type="checkbox"
                checked={editable}
                onChange={onEditableChange}
                style={inputStyle}
              />
              Editable
            </Flex>
          </Flex>
        </Flex>
      </Flex>
      <Flex row spaceAround>
        {renderStorage()}
      </Flex>
    </Flex>
  );
};
