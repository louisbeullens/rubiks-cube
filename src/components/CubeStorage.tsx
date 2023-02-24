import React from "react";
import {
  getAllCubeCharacteristics,
  ICubeCharacteristic,
} from "../cube-characteristics";
import {
  createNewItem,
  persistItem,
  removeItem,
  retrieveItems,
} from "../storage-utils";
import { IListItem, IListProps } from "./AbstractList";
import { CubeList } from "./CubeList";
import {
  CONTAINER_WIDTH,
  ICubeStorageHandle,
  ICubeStorageProps,
  IStorageData,
} from "./CubeStorage.types";
import { Flex } from "./Flex";

export const CubeStorage = React.forwardRef<
  ICubeStorageHandle,
  ICubeStorageProps
>(({ onChange }, ref) => {
  const [items, setItems] = React.useState<IListItem<IStorageData>[]>([]);

  const [selectedItem, setSelectedItem] = React.useState<
    IListItem<IStorageData> | undefined
  >(undefined);

  React.useEffect(() => {
    const items = retrieveItems();
    setItems(items);
    setSelectedItem(items[0]);
    onChange?.(items[0]);
    // eslint-disable-next-line @grncdr/react-hooks/exhaustive-deps
  }, []);

  const onChangeInternal: IListProps<IStorageData>["onChange"] = (item) => {
    setSelectedItem(item);
    onChange?.(item);
  };

  const onInsert = (characteristic: ICubeCharacteristic) => {
    const item = createNewItem(characteristic);
    const id = Date.now().toString();
    const listItem = { id, ...item };
    persistItem(id, item);
    const newItems = [...items, listItem];
    setItems(newItems);
    setSelectedItem(listItem);
    onChange?.(item);
  };

  const onRemove: IListProps<IStorageData>["onRemove"] = (item, i) => {
    removeItem(item.id);
    if (item === selectedItem) {
      setSelectedItem(undefined);
    }
    setItems((items) => items.filter((el, j) => j !== i));
  };

  const handleSave = React.useCallback(
    (data: IStorageData, createNew: boolean = false) => {
      let listItem: IListItem<IStorageData> | undefined = selectedItem;
      if (!listItem && createNew) {
        listItem = { id: Date.now().toString(), ...data };
      }
      if (!listItem) {
        return;
      }
      if (!selectedItem) {
        setSelectedItem(listItem);
        setItems((items) => [...items, listItem!]);
      }
      listItem.perspective = data.perspective;
      listItem.colors = data.colors;
      listItem.state = data.state;
      persistItem(listItem.id, listItem);
      setItems((listItems) => [...listItems]);
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

  const allCubes = getAllCubeCharacteristics();

  return (
    <>
      <div
        style={{
          width: CONTAINER_WIDTH,
          boxSizing: "border-box",
          maxHeight: "100vh",
          overflowX: "hidden",
        }}
      >
        <Flex column>
          <CubeList
            value={selectedItem}
            {...{
              items,
              onChange: onChangeInternal,
              onRemove,
            }}
          />
          <div
            style={{
              position: "sticky",
              right: "0px",
              bottom: "0px",
            }}
          >
            <Flex row>
              {allCubes.map((characteristic) => (
                <Flex key={characteristic.type} grow column>
                  <button
                    onClick={() => onInsert(characteristic)}
                  >{`Add ${characteristic.name}`}</button>
                </Flex>
              ))}
            </Flex>
          </div>
        </Flex>
      </div>
    </>
  );
});
