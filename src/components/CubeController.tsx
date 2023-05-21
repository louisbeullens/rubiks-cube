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
import { RubiksCube } from "./RubiksCube";
import { ECubeType, EPerspective } from "./RubiksCube.types";

export interface ICubeControlProps {
  permaLink?: string | null;
  initialPerspective?: EPerspective;
  onSaveClick?: (data: IStorageData) => void;
  children?: React.ReactElement | React.ReactElement[];
}

export const CubeController = ({
  permaLink,
  initialPerspective = EPerspective.UNFOLDED,
  onSaveClick,
  children: untypedChildren,
}: ICubeControlProps) => {
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
    getCubeCharacteristicsByType(ECubeType.Latch)
  );
  const [perspective, setPerspective] = React.useState(initialPerspective);
  const [state, setState] = React.useState(defaultState);
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

  // convert permaLink to states
  React.useEffect(() => {
    if (!permaLink) {
      return;
    }
    const data = deserializeCube(permaLink);
    setPerspective(data.perspective ?? perspectiveRef.current);
    setState(data.state);

    setCharacteristic(getCubeCharacteristicsByType(data.type));
    // don't make next render override selected cube
    setAutoStorage(false);
  }, [permaLink]);

  // Save / Load functions
  const saveConfig = React.useCallback(
    (data: IStorageData, createNew = false) => {
      storageRef.current?.save(data, createNew);
    },
    []
  );

  const loadConfig = React.useCallback((data: IStorageData) => {
    setPerspective((current) => data.perspective ?? current);
    setCharacteristic(getCubeCharacteristicsByType(data.type));
    setState((current) => data.state ?? current);
  }, []);

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
    saveConfig(data, true);
    onSaveClickRef.current?.(data);
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

  // const onSolveClickInternal = () => {
  //
  // };

  const onStorageChange = React.useCallback(
    (item?: IStorageData) => {
      if (!autoStorageRef.current || !item) {
        return;
      }
      loadConfig(item);
    },
    [loadConfig]
  );

  const renderCube = () => {
    if (!Cube) {
      return;
    }

    return (
      <RubiksCube
        cubeState={state}
        texture={characteristic.texture}
        perspective={perspective}
        onChange={onCubeChange}
      />
    );
  };

  const renderStorage = (i: number) => {
    if (!Storage || Storage.key !== children.at(i)?.key) {
      return;
    }
    return React.cloneElement(Storage, {
      ref: storageRef,
      onChange: onStorageChange,
    });
  };

  const inputStyle = React.useMemo(() => ({ margin: "0 1em" }), []);

  return (
    <Flex grow column spaceBetween padding="0 1vw">
      <Flex row spaceAround>
        {renderCube()}
      </Flex>
      <Flex row wrap spaceAround>
        <Flex row wrap>
          <MoveButtons
            state={state}
            onClick={setState}
            getMovesAllowed={characteristic.getMovesAllowed}
          />
        </Flex>
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
      <Flex row spaceAround>
        {renderStorage(1)}
      </Flex>
    </Flex>
  );
};
