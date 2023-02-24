import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import {
  latchCubeCharacteristics,
  rubiksCubeCharacteristics,
} from "./components";
import { registerCube } from "./cube-characteristics";
import "./index.css";

registerCube(rubiksCubeCharacteristics);
registerCube(latchCubeCharacteristics);

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
