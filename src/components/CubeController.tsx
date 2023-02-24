import React from "react";
import {
  deserializeCube,
  ECubeType,
  getCubeCharacteristicsByType,
} from "../cube-characteristics";
import { useLatestRef } from "../hooks";
import {
  getAllowedMoves,
  isCubeSolved,
  TCubeState,
  TMoveNames,
} from "../rubiks-cube";
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
import { EPerspective, ICubeHandle, ICubeProps } from "./RubiksCube.types";

type TAllowedChildProps = ICubeProps | ICubeStorageProps;

export interface ICubeControlProps {
  cubeRef?: React.RefObject<ICubeHandle>;
  permaLink?: string | null;
  initialPerspective?: EPerspective;
  handleLoad?: () => IStorageData | undefined;
  handleSave?: (data: IStorageData, createNew: boolean) => void;
  onMoveButtonClick?: (move: TMoveNames) => void;
  onPerspectiveChange?: (perspective: EPerspective) => void;
  children?:
    | React.ReactElement<TAllowedChildProps>
    | React.ReactElement<TAllowedChildProps>[];
}

export const CubeController = ({
  cubeRef,
  permaLink,
  initialPerspective = EPerspective.UNFOLDED,
  handleLoad,
  handleSave,
  onMoveButtonClick,
  onPerspectiveChange,
  children: untypedChildren,
}: ICubeControlProps) => {
  const children = React.Children.toArray(
    untypedChildren
  ) as React.ReactElement[];

  const Cube = children.find(
    (child) => React.isValidElement(child) && child.type === RubiksCube
  ) as React.ReactElement<ICubeProps> | undefined;

  const Storage = children.find(
    (child) => React.isValidElement(child) && child.type === CubeStorage
  ) as React.ReactElement<ICubeStorageProps> | undefined;

  const [characteristic, setCharacteristic] = React.useState(
    getCubeCharacteristicsByType(ECubeType.Latch)
  );
  const [perspective, setPerspective] = React.useState(initialPerspective);
  const [state, setState] = React.useState(characteristic.createSolvedState());
  const [autoStorage, setAutoStorage] = React.useState(
    permaLink ? false : true
  );
  const [editable, setEditable] = React.useState(true);

  const storageRef = React.useRef<ICubeStorageHandle>(null);

  const perspectiveRef = useLatestRef(perspective);
  const autoStorageRef = useLatestRef(autoStorage);

  // wrap eventCallbacks in ref
  const handleLoadRef = useLatestRef(handleLoad);
  const handleSaveRef = useLatestRef(handleSave);
  const onMoveButtonClickRef = useLatestRef(onMoveButtonClick);
  const onPerspectiveChangeRef = useLatestRef(onPerspectiveChange);

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
    onPerspectiveChangeRef.current?.(
      data.perspective ?? perspectiveRef.current
    );
    setCharacteristic(getCubeCharacteristicsByType(data.type));
    // don't make next render override selected cube
    setAutoStorage(false);
  }, [permaLink]);

  // Save / Load functions
  const saveConfig = React.useCallback(
    (data: IStorageData, createNew = false) => {
      storageRef.current?.save(data, createNew);
      handleSaveRef.current?.(data, createNew);
    },
    []
  );

  const loadConfig = React.useCallback(
    (data: IStorageData) => {
      if (Cube) {
        setPerspective((current) => data.perspective ?? current);
        setCharacteristic(getCubeCharacteristicsByType(data.type));
        setState((current) => data.state ?? current);
      }
      onPerspectiveChangeRef.current?.(
        data.perspective ?? perspectiveRef.current
      );
    },
    [Cube]
  );

  React.useEffect(() => {
    if (!autoStorageRef.current) {
      return;
    }
    saveConfig({
      type: characteristic.type,
      colors: characteristic.colors,
      perspective,
      state,
    });
  }, [perspective, characteristic, state, saveConfig]);

  const onPerspectiveChangeInternal: React.ChangeEventHandler<
    HTMLSelectElement
  > = (e) => {
    const perspective = parseInt(e.target.value);
    setPerspective(perspective);
    onPerspectiveChangeRef.current?.(perspective);
  };

  const onMoveButtonClickInternal = (
    move: TMoveNames,
    newState: TCubeState
  ) => {
    setState(newState);
    onMoveButtonClickRef.current?.(move);
  };

  const onSaveClickInternal = () => {
    const currentState = Cube ? state : cubeRef?.current?.getState();
    if (!currentState) {
      return;
    }
    const newState = clone(currentState);
    const data = {
      perspective: perspectiveRef.current,
      type: characteristic.type,
      colors: characteristic.colors,
      state: newState,
    };
    saveConfig(data, true);
  };

  const onLoadClickInternal = () => {
    const data = storageRef.current?.load() ?? handleLoadRef.current?.();
    if (!data) {
      return;
    }
    loadConfig(data);
  };

  const onSolveClickInternal = () => {
    if (!Cube) {
      return;
    }
    if (isCubeSolved(state)) {
      console.log("solved");
    }
    const allowedMoves = getAllowedMoves(state);
    console.log("allowedMoves", allowedMoves);
  };

  const onCubeChange = React.useCallback((state: TCubeState) => {
    setState(state);
  }, []);

  const onStorageChange = React.useCallback(
    (item?: IStorageData) => {
      if (!autoStorage || !item) {
        return;
      }
      loadConfig(item);
    },
    [autoStorage, loadConfig]
  );

  const renderCube = () => {
    if (!Cube) {
      return;
    }

    return (
      <Flex padding="50px">
        <RubiksCube
          {...{
            editable,
            perspective,
            colors: characteristic.colors,
            state,
            handleCanFaceRotate: characteristic.handleCanFaceRotate,
            handleLeftClick: characteristic.handleLeftClick,
            handleRightClick: characteristic.handleRightClick,
            renderFace: characteristic.renderFace,
            onChange: onCubeChange,
            onLeftClick: onCubeChange,
            onRightClick: onCubeChange,
          }}
        />
      </Flex>
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
    <>
      {renderStorage(0)}
      <Flex grow column>
        {renderCube()}
        <Flex row spaceAround wrap>
          <Flex grow row>
            <MoveButtons
              {...{
                cubeRef,
                state,
                canFaceRotate: characteristic.handleCanFaceRotate,
                onClick: onMoveButtonClickInternal,
              }}
            />
          </Flex>
          <Flex grow row>
            <button onClick={onLoadClickInternal}>Load</button>
            <button onClick={onSaveClickInternal}>Save</button>
            <button onClick={onSolveClickInternal}>Solve</button>
          </Flex>
          <Flex grow row>
            Perspective
            <select
              onChange={onPerspectiveChangeInternal}
              value={perspective}
              style={inputStyle}
            >
              <option value={EPerspective.UNFOLDED}>unfold</option>
              <option value={EPerspective.ISOMETRIC}>isometric</option>
            </select>
          </Flex>
          <Flex grow row>
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
      {renderStorage(1)}
    </>
  );
};
