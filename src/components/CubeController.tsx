import React from "react";
import { clone } from "../utils";
import {
  allMoves,
  getAllowedMoves,
  isCubeSolved,
  rotateByMoveName,
  TCubeState,
  TMoveNames,
} from "../rubiks-cube";
import { EPerspective, ICubeHandle, ICubeProps } from "./RubiksCube";
import { Flex } from "./Flex";
import {
  createSolvedLatchCubeState,
  LatchCube,
  latchCubeColors,
} from "./LatchCube";
import {
  CubeStorage,
  ICubeStorageHandle,
  ICubeStorageProps,
} from "./CubeStorage";
import { TArrayCallback } from "./CubeList";

export interface IStorageData {
  perspective?: EPerspective;
  colors?: string[];
  state: TCubeState;
}

type TAllowedChildProps = ICubeProps | ICubeStorageProps;

export interface ICubeControlProps {
  cubeRef?: React.RefObject<ICubeHandle>;
  perspective?: EPerspective;
  onMoveButtonClick?: (move: TMoveNames) => void;
  onPerspectiveChange?: (perspective: EPerspective) => void;
  handleSave?: (data: IStorageData, createNew?: boolean) => void;
  handleLoad?: () => IStorageData | undefined;
  children?:
    | React.ReactElement<TAllowedChildProps>
    | React.ReactElement<TAllowedChildProps>[];
}

export const CubeController = ({
  cubeRef,
  perspective: perspectiveProp,
  onMoveButtonClick,
  onPerspectiveChange,
  handleSave,
  handleLoad,
  children: untypedChildren,
}: ICubeControlProps) => {
  const children = React.Children.toArray(
    untypedChildren
  ) as React.ReactElement[];
  const Cube = children.find(
    (child) => React.isValidElement(child) && child.type === LatchCube
  ) as React.ReactElement<ICubeProps> | undefined;

  const Storage = children.find(
    (child) => React.isValidElement(child) && child.type === CubeStorage
  ) as React.ReactElement<ICubeStorageProps> | undefined;

  const [perspectiveState, setPerspective] = React.useState(
    perspectiveProp ?? EPerspective.UNFOLDED
  );
  const perspective = perspectiveProp ?? perspectiveState;

  const [colors, setColors] = React.useState<string[]>(latchCubeColors);
  const [state, setState] = React.useState(createSolvedLatchCubeState());

  const [autoStorage, setAutoStorage] = React.useState(true);
  const [editable, setEditable] = React.useState(true);

  const onAutoStorageChange = () => setAutoStorage((toggle) => !toggle);
  const onEditableChange = () => setEditable((toggle) => !toggle);

  const cubeRefInternal = React.useRef<ICubeHandle>(null);
  const storageRef = React.useRef<ICubeStorageHandle>(null);

  const onSaveClickInternal = (dataParam?: IStorageData) => {
    const createNew = dataParam ? false : true
    const currentState = Cube ? state : cubeRef?.current?.getState();
    if (!currentState || (!storageRef.current && !handleSave)) {
      return;
    }
    const newState = clone(currentState);
    const data = dataParam || { perspective, colors, state: newState };
    if (storageRef.current) {
      storageRef.current.save(data, createNew);
    } else if (handleSave) {
      handleSave(data, createNew);
    }
  };

  const updateAllowedMoves = (stateParam?: TCubeState) => {
    const currentState =
      stateParam || (Cube ? state : cubeRef?.current?.getState());

    if (!currentState) {
      return [];
    }
    const canRotate = Cube
      ? cubeRefInternal.current?.canFaceRotate
      : cubeRef?.current?.canFaceRotate;
    return getAllowedMoves(currentState, canRotate);
  };

  let [enabledMoves, setEnabledMoves] = React.useState<
    ReturnType<typeof getAllowedMoves>
  >([]);
  enabledMoves = updateAllowedMoves();

  const renewButtonStates = React.useCallback(() => {
    window.setTimeout(() => setEnabledMoves([]), 10);
  }, []);

  React.useEffect(() => renewButtonStates(), [renewButtonStates]);

  const onPerspectiveChangeInternal: React.ChangeEventHandler<
    HTMLSelectElement
  > = (e) => {
    const perspective = parseInt(e.target.value);
    if (perspectiveProp === undefined) {
      setPerspective(perspective);
    }
    onPerspectiveChange?.(perspective);
    if (autoStorage) {
      onSaveClickInternal({ perspective, colors, state });
    }
  };

  const onMoveButtonClickInternal = (move: TMoveNames) => {
    if (Cube) {
      const canRotate = cubeRefInternal.current?.canFaceRotate;
      setEditable(false);
      const newState = rotateByMoveName(state, move, canRotate);
      if (!newState) {
        return;
      }
      setState(newState);
      if (autoStorage) {
        onSaveClickInternal({ perspective, colors, state: newState });
      }
    } else if (onMoveButtonClick) {
      onMoveButtonClick(move);
    } else {
      cubeRef?.current?.rotateByMoveName(move);
    }
  };

  const onLoadClickInternal = React.useCallback(
    (dataParam?: IStorageData) => {
      const data = dataParam || storageRef.current?.load() || handleLoad?.();
      if (!data) {
        return;
      }
      const { colors, state: newState } = data;
      if (Cube) {
        if (perspectiveProp !== undefined) {
          onPerspectiveChange?.(data.perspective ?? perspective);
        } else {
          setPerspective(data.perspective ?? perspective);
        }
        setColors((current) => colors || current);
        setState(newState);
      } else {
        renewButtonStates();
      }
    },
    [
      Cube,
      perspectiveProp,
      perspective,
      handleLoad,
      onPerspectiveChange,
      renewButtonStates,
    ]
  );

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

  const onStorageChange = React.useCallback<TArrayCallback>(
    (item) => {
      if (!autoStorage || !item) {
        return;
      }
      onLoadClickInternal(item);
    },
    [autoStorage, onLoadClickInternal]
  );

  const renderCube = () => {
    if (!Cube) {
      return;
    }

    return (
      <Flex padding="50px">
        {React.cloneElement(Cube, {
          ref: cubeRefInternal,
          editable,
          perspective,
          colors,
          state,
          onChange: onCubeChange,
          onLeftClick: onCubeChange,
          onRightClick: onCubeChange,
        })}
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
            {Object.keys(allMoves).map((untypedMove) => {
              const move = untypedMove as TMoveNames;
              return (
                <button
                  key={move}
                  disabled={!enabledMoves.includes(move)}
                  onClick={() => onMoveButtonClickInternal(move)}
                >
                  {move}
                </button>
              );
            })}
          </Flex>
          <Flex grow row>
            <button onClick={() => onLoadClickInternal()}>Load</button>
            <button onClick={() => onSaveClickInternal()}>Save</button>
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
