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
      listItem.type = data.type;
      listItem.perspective = data.perspective;
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
    <Flex grow column>
      <Flex row>
        {allCubes
          .filter(({ hidden }) => !hidden)
          .map((characteristic) => (
            <Flex key={characteristic.type} grow column>
              <button
                onClick={() => onInsert(characteristic)}
              >{`Add ${characteristic.name}`}</button>
            </Flex>
          ))}
      </Flex>
      <Flex row spaceAround>
        <div
          style={{
            maxWidth: "98vw",
            boxSizing: "border-box",
            overflowX: "scroll",
            scrollbarGutter: "stable",
          }}
        >
          <CubeList
            value={selectedItem}
            {...{
              items,
              onChange: onChangeInternal,
              onRemove,
            }}
          />
        </div>
      </Flex>
    </Flex>
  );
});
