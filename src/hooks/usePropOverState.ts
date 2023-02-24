import React from "react";

import { useLatestRef } from "./useLatestRef";

export const usePropOverState = <T extends any>(stateParam: T, prop?: T) => {
  const propRef = useLatestRef(prop);

  const [value, setValue] = React.useState(stateParam);

  const setState = React.useCallback<typeof setValue>((state) => {
    if (propRef.current !== undefined) {
      return;
    }
    setValue(state);
  }, []);

  return [prop ?? value, setState, propRef] as const;
};
