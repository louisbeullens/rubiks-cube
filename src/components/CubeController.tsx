import React from "react";
import { base64Encode, clone } from "../utils";
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
  deserializeLatchCube,
  LatchCube,
  latchCubeColors,
  serializeLatchCube,
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
  permaLink?: string | null;
  perspective?: EPerspective;
  onMoveButtonClick?: (move: TMoveNames) => void;
  onPermaLinkChange?: (token: string) => void;
  onPerspectiveChange?: (perspective: EPerspective) => void;
  handleSave?: (data: IStorageData, createNew?: boolean) => void;
  handleLoad?: () => IStorageData | undefined;
  children?:
    | React.ReactElement<TAllowedChildProps>
    | React.ReactElement<TAllowedChildProps>[];
}

export const CubeController = ({
  cubeRef,
  permaLink,
  perspective: perspectiveProp,
  onPermaLinkChange,
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
  const [colors, setColors] = React.useState<string[]>(latchCubeColors);
  const [state, setState] = React.useState(createSolvedLatchCubeState());
  const [autoStorage, setAutoStorage] = React.useState(true);
  const [editable, setEditable] = React.useState(true);

  // allow for enabled moves to asyncronously renew when this controller
  // does not control the cube state
  const [enabledMoves, setEnabledMoves] = React.useState<TMoveNames[]>([]);

  const cubeRefInternal = React.useRef<ICubeHandle>(null);
  const storageRef = React.useRef<ICubeStorageHandle>(null);

  const perspective = perspectiveProp ?? perspectiveState;

  React.useEffect(() => {
    if (!permaLink) {
      return
    }
    const data = deserializeLatchCube(permaLink)
    if (perspectiveProp === undefined) {
      setPerspective(data.perspective ?? EPerspective.UNFOLDED)
    }
      onPerspectiveChange?.(data.perspective ?? EPerspective.UNFOLDED)
      setColors(colors => data.colors ?? colors)
      setState(data.state)
  }, [permaLink, onPerspectiveChange])

  const onAutoStorageChange = () => setAutoStorage((toggle) => !toggle);
  const onEditableChange = () => setEditable((toggle) => !toggle);

  const onSaveClickInternal = (dataParam?: IStorageData) => {
    const createNew = dataParam ? false : true;
    
    const currentState = Cube ? state : cubeRef?.current?.getState();
    if (!currentState || (!storageRef.current && !handleSave)) {
      return;
    }
    const newState = clone(currentState);
    const data = dataParam || { perspective, colors, state: newState };
    if (createNew) {
      const permaLink = serializeLatchCube(data)
      onPermaLinkChange?.(permaLink)
    }
    if (storageRef.current) {
      storageRef.current.save(data, createNew);
    } else if (handleSave) {
      handleSave(data, createNew);
    }
  };

  // asyncronously rerender to refresh enabledMoves
  const renewEnabledMoves = React.useCallback(() => {
    window.setTimeout(() => setEnabledMoves([]), 10);
  }, []);

  // invoke renewEnabledMoves when component mounts
  // required when controller uses cubeRef
  React.useEffect(() => renewEnabledMoves(), [renewEnabledMoves]);

  const updateAllowedMoves = (
    allowedMoves: TMoveNames[],
    stateParam?: TCubeState
  ) => {
    const currentState =
      stateParam || (Cube ? state : cubeRef?.current?.getState());

    if (!currentState) {
      return;
    }
    const canRotate = Cube
      ? cubeRefInternal.current?.canFaceRotate
      : cubeRef?.current?.canFaceRotate;
    allowedMoves.splice(
      0,
      Infinity,
      ...getAllowedMoves(currentState, canRotate)
    );
  };

  // immediately renew allowedMoves
  updateAllowedMoves(enabledMoves);

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
        renewEnabledMoves();
      }
    },
    [
      Cube,
      perspectiveProp,
      perspective,
      handleLoad,
      onPerspectiveChange,
      renewEnabledMoves,
    ]
  );

  const onSolveClickInternal = () => {
    if (!Cube) {
      return;
    }
    const data = { perspective, colors, state };
    const serializedData = serializeLatchCube(data);
    const deserializedData = deserializeLatchCube(serializedData);
    console.log(
      { ...data, perspective: EPerspective[data.perspective] },
      serializedData,
      {
        ...deserializedData,
        perspective:
          EPerspective[deserializedData.perspective || EPerspective.UNFOLDED],
      }
    );
    if (isCubeSolved(state)) {
      console.log("solved");
    }
    const allowedMoves = getAllowedMoves(state);
    console.log("allowedMoves", allowedMoves);
  };

  const onCubeChange = React.useCallback((state: TCubeState) => {
    setState(state);
    if (autoStorage) {
      onSaveClickInternal({ perspective, colors, state });
    }
  }, [autoStorage]);

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
