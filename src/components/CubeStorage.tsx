import React from "react";
import {
  ECubeType,
  getAllCubeCharacteristics,
  getCubeCharacteristicsByType,
  ICubeCharacteristic,
} from "../cube-characteristics";
import { createNewItem, persistItem, retrieveItems } from "../storage-utils";
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
    persistItem(item);
    const newItems = [...items, item];
    setItems(newItems);
    setSelectedItem(item);
    onChange?.(item);
  };

  const onRemove: IListProps<IStorageData>["onRemove"] = (item, i) => {
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
        (createNew &&
          createNewItem(getCubeCharacteristicsByType(ECubeType.Latch)));
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
