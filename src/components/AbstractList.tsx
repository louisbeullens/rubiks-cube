import { Flex } from "./Flex";

export type IListItem<T extends {}> = T & { id: string };

export interface IRenderItemProps<T extends {}> {
  item: IListItem<T>;
  isSelected: boolean;
  onClick: () => void;
  onRemove: () => void;
}

export interface IListProps<T extends {}> {
  value?: IListItem<T>;
  items: IListItem<T>[];
  onChange?: (
    item: IListItem<T> | undefined,
    i: number,
    arr: IListItem<T>[]
  ) => void;
  onRemove?: (item: IListItem<T>, i: number, arr: IListItem<T>[]) => void;
  renderItem?: ({
    item,
    onClick,
    onRemove,
  }: IRenderItemProps<T>) => JSX.Element;
}

const defaultRenderItem = <T extends {}>({
  item,
  isSelected,
  onClick,
  onRemove,
}: IRenderItemProps<T>) => {
  return (
    <div>
      <div {...{ onClick }}>{JSON.stringify(item)}</div>
      <button onClick={onRemove}>-</button>
    </div>
  );
};

export const AbstractList = <T extends {}>({
  value,
  items,
  onChange,
  onRemove,
  renderItem = defaultRenderItem,
}: IListProps<T>) => {
  return (
    <Flex row>
      {items.map((item, i, arr) => {
        const isSelected = item === value;
        return (
          <div key={item.id}>
            {renderItem({
              item,
              isSelected,
              onClick: () => onChange?.(!isSelected ? item : undefined, i, arr),
              onRemove: () => onRemove?.(item, i, arr),
            })}
          </div>
        );
      })}
    </Flex>
  );
};
