import { createOperationFromText } from "./operation-util";
import rubiksCubies from "./rubiksCubies";

const fundamentalOperations = {
  ...createOperationFromText(
    "",
    [
      "   000      ",
      "   000      ",
      "   000      ",
      "111222333444",
      "111222333444",
      "111222333444",
      "   555      ",
      "   555      ",
      "   555      ",
    ],
    rubiksCubies,
    21,
    1
  ),
  // X axis
  ...createOperationFromText(
    "L",
    [
      "   400      ",
      "   400      ",
      "   400      ",
      "111022333445",
      "111022333445",
      "111022333445",
      "   255      ",
      "   255      ",
      "   255      ",
    ],
    rubiksCubies,
    21,
    1
  ),
  ...createOperationFromText(
    "M",
    [
      "   040      ",
      "   040      ",
      "   040      ",
      "111202333454",
      "111202333454",
      "111202333454",
      "   525      ",
      "   525      ",
      "   525      ",
    ],
    rubiksCubies
  ),
  ...createOperationFromText(
    "R",
    [
      "   002      ",
      "   002      ",
      "   002      ",
      "111225333044",
      "111225333044",
      "111225333044",
      "   554      ",
      "   554      ",
      "   554      ",
    ],
    rubiksCubies,
    23,
    1
  ),
  ...createOperationFromText(
    "X",
    [
      "   222      ",
      "   222      ",
      "   222      ",
      "111555333000",
      "111555333000",
      "111555333000",
      "   444      ",
      "   444      ",
      "   444      ",
    ],
    rubiksCubies
  ),
  // Y axis
  ...createOperationFromText(
    "D",
    [
      "   000      ",
      "   000      ",
      "   000      ",
      "111222333444",
      "111222333444",
      "444111222333",
      "   555      ",
      "   555      ",
      "   555      ",
    ],
    rubiksCubies,
    25,
    1
  ),
  ...createOperationFromText(
    "E",
    [
      "   000      ",
      "   000      ",
      "   000      ",
      "111222333444",
      "444111222333",
      "111222333444",
      "   555      ",
      "   555      ",
      "   555      ",
    ],
    rubiksCubies
  ),
  ...createOperationFromText(
    "U",
    [
      "   000      ",
      "   000      ",
      "   000      ",
      "222333444111",
      "111222333444",
      "111222333444",
      "   555      ",
      "   555      ",
      "   555      ",
    ],
    rubiksCubies,
    20,
    1
  ),
  ...createOperationFromText(
    "Y",
    [
      "   000      ",
      "   000      ",
      "   000      ",
      "222333444111",
      "222333444111",
      "222333444111",
      "   555      ",
      "   555      ",
      "   555      ",
    ],
    rubiksCubies
  ),
  // Z axis
  ...createOperationFromText(
    "B",
    [
      "   333      ",
      "   000      ",
      "   000      ",
      "011222335444",
      "011222335444",
      "011222335444",
      "   555      ",
      "   555      ",
      "   111      ",
    ],
    rubiksCubies,
    24,
    1
  ),
  ...createOperationFromText(
    "S",
    [
      "   000      ",
      "   111      ",
      "   000      ",
      "151222303444",
      "151222303444",
      "151222303444",
      "   555      ",
      "   333      ",
      "   555      ",
    ],
    rubiksCubies
  ),
  ...createOperationFromText(
    "F",
    [
      "   000      ",
      "   000      ",
      "   111      ",
      "115222033444",
      "115222033444",
      "115222033444",
      "   333      ",
      "   555      ",
      "   555      ",
    ],
    rubiksCubies,
    22,
    1
  ),
  ...createOperationFromText(
    "Z",
    [
      "   111      ",
      "   111      ",
      "   111      ",
      "555222000444",
      "555222000444",
      "555222000444",
      "   333      ",
      "   333      ",
      "   333      ",
    ],
    rubiksCubies
  ),
};

export default fundamentalOperations;
