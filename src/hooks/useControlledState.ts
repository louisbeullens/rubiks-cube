import React from "react";
import { useLatestRef } from "./useLatestRef";

export const useControlledState = <T extends any>(stateParam: T, prop?: T) => {
  const propRef = useLatestRef(prop);

  const [value, setValue] = React.useState(stateParam);

  const setStateRef = React.useRef<typeof setValue>((state) => {
    if (propRef.current !== undefined) {
      return;
    }
    setValue(state);
  });

  return [prop ?? value, setStateRef.current, propRef] as const;
};
