export interface IFlexProps {
  margin?: string;
  width?: string;
  height?: string;
  padding?: string;
  gap?: string;
  inline?: true;
  grow?: true | number;
  shrink?: true | number;
  direction?: "row" | "column";
  row?: true;
  column?: true;
  justify?: "space-around" | "space-between";
  spaceBetween?: true;
  spaceAround?: true;
  wrap?: true;
  wrapReverse?: true;
  children?: React.ReactNode | React.ReactNode[];
}

export const Flex = ({
  margin,
  width,
  height,
  padding,
  gap,
  inline,
  direction,
  column,
  justify,
  spaceBetween,
  spaceAround,
  wrap,
  wrapReverse,
  grow,
  shrink,
  children,
}: IFlexProps) => {
  const display = inline ? "inline-flex" : "flex";
  const flexDirection = direction || (column ? "column" : "row");
  const flexGrow = grow === true ? 1 : grow;
  const flexShrink = shrink === true ? 1 : shrink;

  const justifyContent =
    justify ||
    (spaceAround ? "space-around" : spaceBetween ? "space-between" : undefined);
  const flexWrap = wrapReverse ? "wrap-reverse" : wrap ? "wrap" : undefined;
  const style: React.CSSProperties = {
    display,
    // boxSizing: 'border-box',
    margin,
    width,
    height,
    padding,
    gap,
    flexDirection,
    justifyContent,
    flexWrap,
    flexGrow,
    flexShrink,
  };
  return <div {...{ style }}>{children}</div>;
};
