import React from "react";

export const createHandle = <T extends {}, V = any>({
  valueKey,
  value,
  setValue,
  initialHandle,
}: {
  valueKey: string;
  value: V;
  setValue: React.Dispatch<React.SetStateAction<V>>;
  initialHandle?: T;
}) =>
  Object.defineProperty(initialHandle ?? {}, valueKey, {
    get: () => value,
    set: (newValue) => setValue(newValue),
  }) as T;
