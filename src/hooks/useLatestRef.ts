import React from "react";

export const useLatestRef = <T extends any>(param: T) => {
  const ref = React.useRef(param);
  React.useEffect(() => {
    ref.current = param;
  }, [param]);

  return ref;
};
