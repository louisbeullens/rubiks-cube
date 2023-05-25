import React from "react";
import { getCubeCharacteristicsByType } from "../cube-characteristics";
import { useLatestRef } from "../hooks";
import { defaultState } from "../rubiks-cube/cube-util";
import { TCubeState } from "../rubiks-cube/types";
import { deserializeCube } from "../storage-utils";
import { clone } from "../utils";
import { CubeStorage } from "./CubeStorage";
import {
  ICubeStorageHandle,
  ICubeStorageProps,
  IStorageData,
} from "./CubeStorage.types";
import { Flex } from "./Flex";
import { MoveButtons } from "./MoveButtons";
import {
  getRubiksCubeMovesAllowed,
  ICubeHandle,
  RubiksCube,
} from "./RubiksCube";
import { ECubeType, EPerspective } from "./RubiksCube.types";

export interface ICubeControlProps {
  cubeRef?: React.RefObject<ICubeHandle>;
  getMovesAllowed?: typeof getRubiksCubeMovesAllowed;
  permaLink?: string | null;
  initialPerspective?: EPerspective;
  onSaveClick?: (data: IStorageData) => void;
  children?: React.ReactElement | React.ReactElement[];
}

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
  const [autoStorage, setAutoStorage] = React.useState(
    permaLink ? false : true
  );
  const [editable, setEditable] = React.useState(true);

  const storageRef = React.useRef<ICubeStorageHandle>(null);

  const perspectiveRef = useLatestRef(perspective);
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

  const onSaveClickInternal = () => {
    const newState = clone(state);
    const data = {
      perspective: perspectiveRef.current,
      type: characteristic.type,
      state: newState,
    };
    onSaveClickRef.current?.(data);
    saveConfig(data, true);
  };

  const onLoadClickInternal = () => {
    const data = storageRef.current?.load();
    if (!data) {
      return;
    }
    loadConfig(data);
  };

  const onCubeChange = (state: TCubeState) => {
    if (!editableRef.current) {
      return;
    }

    setState(state);
  };

  const onMoveButtonClick = (state: TCubeState) => {
    if (cubeRef?.current) {
      cubeRef.current.cubeState = state;
    }
    setState(state);
  };

  // const onSolveClickInternal = () => {
  //
  // };

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
            state={state}
            onClick={onMoveButtonClick}
            getMovesAllowed={
              cubeRef ? getMovesAllowed : characteristic.getMovesAllowed
            }
          />
        </Flex>
        <Flex grow={999} column>
          <Flex row wrap spaceAround>
            <Flex row>
              <button onClick={onLoadClickInternal}>Load</button>
              <button onClick={onSaveClickInternal}>Save</button>
              {/* <button onClick={onSolveClickInternal}>Solve</button> */}
            </Flex>
            <Flex row>
              Perspective
              <select
                onChange={onPerspectiveChange}
                value={perspective}
                style={inputStyle}
              >
                <option value={EPerspective.UNFOLDED}>unfold</option>
                <option value={EPerspective.ISOMETRIC}>isometric</option>
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
