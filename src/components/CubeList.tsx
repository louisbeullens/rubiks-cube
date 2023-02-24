import { AbstractList, IListProps, IRenderItemProps } from "./AbstractList";
import { IStorageData } from "./CubeStorage.types";
import { LatchCube } from "./LatchCube";

const size = "25px";
const itemPosition = "relative" as const;
const removeButtonStyle = {
  position: "absolute" as const,
  right: size,
  bottom: size,
};

const renderItem = ({
  item,
  isSelected,
  onClick,
  onRemove,
}: IRenderItemProps<IStorageData>) => {
  const border = isSelected ? "2px solid blue" : "1px solid black";
  const style = { position: itemPosition, border, padding: size };

  const { perspective, colors, state } = item;

  return (
    <div {...{ style }}>
      <div {...{ onClick }}>
        <LatchCube scale={0.5} {...{ perspective, colors, state }} />
      </div>
      <button style={removeButtonStyle} onClick={onRemove}>
        -
      </button>
    </div>
  );
};

export const CubeList = ({
  items,
  value,
  onChange,
  onRemove,
}: IListProps<IStorageData>) => {
  const List = AbstractList<IStorageData>;
  return <List {...{ renderItem, items, value, onChange, onRemove }} />;
};
