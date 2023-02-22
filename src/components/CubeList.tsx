import React from "react";
import { TCubeState } from "../rubiks-cube";
import { Flex } from "./Flex";
import { LatchCube } from "./LatchCube";
import { EPerspective } from "./RubiksCube";

export interface IListItem {
  id: string;
  perspective?: EPerspective;
  colors?: string[];
  state: TCubeState;
}

export type TArrayCallback = (
  value: IListItem | undefined,
  i: number,
  arr: IListItem[]
) => void;

interface ICubeListProps {
  value?: IListItem;
  items: IListItem[];
  onChange?: TArrayCallback;
  onRemove?: TArrayCallback;
}

export const CubeList = ({
  value,
  items,
  onChange,
  onRemove,
}: ICubeListProps) => {
  const size = "25px";
  const position = "relative" as const;
  const padding = size;
  const border = "1px solid black";
  const style = { position, border, padding };

  return (
    <Flex column>
      {items.map((item, i) => {
        const isSelectedItem = item === value;
        const customBorder = isSelectedItem ? "2px solid blue" : border;
        return (
          <div key={item.id} style={{ ...style, border: customBorder }}>
            <div
              onClick={() =>
                onChange?.(!isSelectedItem ? item : undefined, i, items)
              }
            >
              <LatchCube editable={false} scale={0.5} {...item} />
            </div>
            <button
              onClick={() => onRemove?.(items[i], i, items)}
              style={{ position: "absolute", right: size, bottom: size }}
            >
              -
            </button>
          </div>
        );
      })}
    </Flex>
  );
};
