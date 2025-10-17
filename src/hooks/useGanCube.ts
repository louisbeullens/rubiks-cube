import React from "react";
import { GanCube, ganCube } from "../gan";

export const useGanCube = () => {
  const [device, setDevice] = React.useState<GanCube | null>(null);

  React.useEffect(() => {
    const connectHandler = () => {
      setDevice(ganCube);
    };
    const disconnectHandler = () => {
      setDevice(null);
    };
    ganCube.addEventListener("connected", connectHandler);
    ganCube.addEventListener("disconnected", disconnectHandler);
    return () => {
      ganCube.removeEventListener("connected", connectHandler);
      ganCube.removeEventListener("disconnected", disconnectHandler);
    };
  }, []);

  return device;
};
