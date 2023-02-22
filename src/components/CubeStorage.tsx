import React from "react";
import { createSolvedState, TCubeState } from "../rubiks-cube";
import { CubeList, IListItem, TArrayCallback } from "./CubeList";
import { ICubeControlProps, IStorageData } from "./CubeController";
import { Flex } from "./Flex";
import { EPerspective, rubiksCubeColors } from "./RubiksCube";
import { createSolvedLatchCubeState, latchCubeColors } from "./LatchCube";
import { clone } from "../utils";

export interface ICubeStorageHandle {
  save: (data: IStorageData, createNwe?: boolean) => void;
  load: () => IStorageData | undefined;
}

export interface ICubeStorageProps
  extends React.RefAttributes<ICubeStorageHandle> {
  onChange?: TArrayCallback;
  children?: React.ReactNode;
}

const listWidth = `${16 * 25}px`;

const SOLVED_RUBIKSCUBE_STATE = createSolvedState();
const SOLVED_LATCHCUBE_STATE = createSolvedLatchCubeState();

export const CubeStorage = React.forwardRef<
  ICubeStorageHandle,
  ICubeStorageProps
>(({ onChange, children: Child }, ref) => {
  const [items, setItems] = React.useState<IListItem[]>([]);

  const [selectedItem, setSelectedItem] = React.useState<IListItem | undefined>(
    undefined
  );

  React.useEffect(() => {
    const numKeys = window.localStorage.length;
    const items: IListItem[] = [];
    const keys = Array.from({ length: numKeys }, (el, i) =>
      window.localStorage.key(i)
    ).sort();
    for (const key of keys) {
      if (!key || !key.startsWith("cube-")) {
        continue;
      }
      const id = /cube-(.+)/.exec(key)![1];
      const itemString = window.localStorage.getItem(key);
      if (!itemString) {
        continue;
      }
      const item = JSON.parse(itemString) as IListItem;
      items.push({ ...item, id });
      setItems(items);
      setSelectedItem(items[0]);
      onChange?.(items[0], 0, items);
    }
    //   eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onChangeInternal: TArrayCallback = (item, i, arr) => {
    setSelectedItem(item);
    onChange?.(item, i, arr);
  };

  const persistItem = ({ id, perspective, colors, state }: IListItem) => {
    window.localStorage.setItem(
      `cube-${id}`,
      JSON.stringify({ perspective, colors, state })
    );
  };

  const createNewItem = (colors: string[], state: TCubeState): IListItem => ({
    id: Date.now().toString(),
    perspective: EPerspective.UNFOLDED,
    colors,
    state: clone(state),
  });

  const onInsert = (colors: string[], state: TCubeState) => {
    const item = createNewItem(colors, state);
    persistItem(item);
    const newItems = [...items, item];
    setItems(newItems);
    setSelectedItem(item);
    onChange?.(item, newItems.length - 1, newItems);
  };

  const onRemove: TArrayCallback = (item, i) => {
    if (!item) {
      return;
    }
    window.localStorage.removeItem(`cube-${item.id}`);
    if (item === selectedItem) {
      setSelectedItem(undefined);
    }
    setItems((items) => items.filter((el, j) => j !== i));
  };

  const handleSave = React.useCallback(
    (data: IStorageData, createNew: boolean = false) => {
      const item =
        selectedItem ||
        (createNew && createNewItem(latchCubeColors, SOLVED_LATCHCUBE_STATE));
      if (!item) {
        return;
      }
      if (!selectedItem) {
        setItems((items) => [...items, item]);
        setSelectedItem(item);
      }
      item.perspective = data.perspective;
      item.colors = data.colors || item.colors;
      item.state = data.state;
      persistItem(item);
      const stateAsString = JSON.stringify(item.state);
      navigator.clipboard.writeText(JSON.stringify(stateAsString));
      setItems((items) => [...items]);
    },
    [selectedItem]
  );

  const handleLoad = React.useCallback(() => {
    if (!selectedItem) {
      return;
    }
    return selectedItem;
  }, [selectedItem]);

  React.useImperativeHandle(
    ref,
    () => ({ save: handleSave, load: handleLoad }),
    [handleSave, handleLoad]
  );

  return (
    <>
      {React.isValidElement<ICubeControlProps>(Child)
        ? React.cloneElement(Child, { handleLoad, handleSave })
        : null}
      <div
        style={{
          width: listWidth,
          height: "100vh",
          overflowX: "hidden",
        }}
      >
        <Flex column>
          <CubeList
            value={selectedItem}
            {...{ items, onInsert, onChange: onChangeInternal, onRemove }}
          />
          <div
            style={{
              position: "sticky",
              right: "0px",
              bottom: "0px",
            }}
          >
            <Flex row>
              <Flex grow column>
                <button
                  onClick={() =>
                    onInsert?.(rubiksCubeColors, SOLVED_RUBIKSCUBE_STATE)
                  }
                >
                  add Rubik's Cube
                </button>
              </Flex>
              <Flex grow column>
                <button
                  onClick={() =>
                    onInsert?.(latchCubeColors, SOLVED_LATCHCUBE_STATE)
                  }
                >
                  add Latch Cube
                </button>
              </Flex>
            </Flex>
          </div>
        </Flex>
      </div>
    </>
  );
});
