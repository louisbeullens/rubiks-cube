import { CSSProperties } from "react";
import { getCubeCharacteristicsByType } from "../cube-characteristics";
import { AbstractList, IListProps, IRenderItemProps } from "./AbstractList";
import { IStorageData } from "./CubeStorage.types";
import RubiksCube from "./RubiksCube";
import { EPerspective } from "./RubiksCube.types";

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
  const style: CSSProperties = {
    position: itemPosition,
    border,
    backgroundColor: "#FFFFFF",
  };

  const { type, perspective, state: cubeState } = item;
  const { texture } = getCubeCharacteristicsByType(type);

  return (
    <div {...{ style }}>
      <span {...{ onClick }}>
        <RubiksCube
          {...{ cubeState, texture, scale: 0.25 }}
          perspective={
            perspective === EPerspective.THREE_DIMENSIONAL
              ? EPerspective.ISOMETRIC
              : perspective
          }
        />
      </span>
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
