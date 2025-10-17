import { CubeUtil } from "./rubiks-cube/cube-util";
import ganCubies from "./rubiks-cube/ganCubies";
import { aesDecrypt, aesEncrypt, iv, key } from "./aes";

const ganCubeUtil = new CubeUtil();
ganCubeUtil.primaryEdgeAxis = "y";
ganCubeUtil.auxiliaryEdgeAxis = "z";
ganCubeUtil.cornerAxis = "y";

const MISSING_CENTERS = [84, 88, 92, 96, 100, 104];

const encode = (value) => {
  let payload = Uint8ClampedArray.from({ length: 20 }, () => 0);
  payload.set(value);
  let result = aesEncrypt(
    payload.slice(0, 16).map((el, i) => el ^ iv[i]),
    key
  );
  payload.set(result);
  result = aesEncrypt(
    payload.slice(-16).map((el, i) => el ^ iv[i]),
    key
  );
  payload.set(result, payload.byteLength - 16);
  return payload;
};

const decode = (value, ganCube) => {
  let payload = new Uint8ClampedArray(value.buffer);
  let result = aesDecrypt(payload.slice(-16), key).map((el, i) => el ^ iv[i]);
  payload.set(result, payload.byteLength - 16);
  result = aesDecrypt(payload.slice(0, 16), key).map((el, i) => el ^ iv[i]);
  payload.set(result, 0);
  payload = [...payload];
  const binary = payload.map((el) => el.toString(2).padStart(8, "0")).join("");
  const mode = parseInt(binary.slice(0, 4), 2);
  if (mode === 2) {
    const raw = parseInt(binary.slice(12, 17), 2);
    const face = "UFLDBR".at(raw >>> 1);
    const direction = ["", "'"].at(raw & 1);
    const move = `${face}${direction}`;
    ganCube.lastMove = move;
    ganCube.dispatchEvent(new Event("moved"));
  } else if (mode === 4) {
    const pieces = Array.from({ length: 12 }, (el, i) => i);

    const position = Array.from({ length: 20 }, () => undefined);
    const orientation = [...Array.from({ length: 20 }, () => undefined)];
    for (let i = 0; i < 11; i++) {
      position[i] = parseInt(binary.slice(47 + i * 4, 51 + i * 4), 2);
      orientation[i] = parseInt(binary.slice(91 + i, 92 + i), 2);
    }
    for (let i = 0; i < 7; i++) {
      position[i + 12] = parseInt(binary.slice(12 + i * 3, 15 + i * 3), 2);
      orientation[i + 12] = parseInt(binary.slice(33 + i * 2, 35 + i * 2), 2);
    }

    position[11] = pieces
      .filter((el) => !position.slice(0, 11).includes(el))
      .at(0);
    orientation[11] =
      (2 - (orientation.slice(0, 11).reduce((acc, el) => acc + el, 0) % 2)) % 2;

    position[19] = pieces
      .filter((el) => !position.slice(12, 19).includes(el))
      .at(0);
    orientation[19] =
      (3 - (orientation.slice(12, 19).reduce((acc, el) => acc + el, 0) % 3)) %
      3;

    const reorder = [
      5, 9, 1, 8, 6, 2, 4, 0, 7, 10, 3, 11, 17, 16, 12, 13, 19, 18, 14, 15,
    ];

    const coordinateMapping = [];
    reorder.forEach((el, i) => (coordinateMapping[el] = i));

    const cubeState = [
      ...position
        .slice(0, 12)
        .map((el, i) => position[reorder[i]] * 2 + 2 + orientation[reorder[i]]),
      ...position
        .slice(12, 20)
        .map(
          (el, i) =>
            position[reorder[i + 12]] * 3 + 39 + orientation[reorder[i + 12]]
        ),
      ...MISSING_CENTERS,
    ];

    ganCube.dispatchEvent(
      new CustomEvent("facelets", {
        detail: ganCubeUtil.stateToCube(
          cubeState,
          ganCubies,
          coordinateMapping
        ),
      })
    );
  }
};

export class GanCube extends EventTarget {
  device = null;
  read;
  write;
  lastMove = "";

  get connected() {
    return this.device?.gatt?.connected ? true : false;
  }

  async connect() {
    const device = await navigator.bluetooth.requestDevice({
      filters: [
        {
          namePrefix: "GAN",
        },
      ],
      optionalServices: ["6e400001-b5a3-f393-e0a9-e50e24dc4179"],
    });
    device.addEventListener(
      "gattserverdisconnected",
      () => {
        this.device = null;
        this.dispatchEvent(new Event("disconnected"));
      },
      { once: true }
    );
    await device.gatt.connect();
    const service = await device.gatt.getPrimaryService(
      "6e400001-b5a3-f393-e0a9-e50e24dc4179"
    );
    const read = await service.getCharacteristic(
      "28be4cb6-cd67-11e9-a32f-2a2ae2dbcce4"
    );
    const write = await service.getCharacteristic(
      "28be4a4a-cd67-11e9-a32f-2a2ae2dbcce4"
    );
    const self = this;
    read.addEventListener(
      "characteristicvaluechanged",
      ({ target: { value } }) => {
        decode(value, self);
      }
    );
    await read.startNotifications();
    this.device = device;
    this.read = read;
    this.write = write;
    this.dispatchEvent(new Event("connected"));
  }

  disconnect() {
    this.device?.gatt?.disconnect();
  }

  requestFacelets() {
    if (!this.connected) {
      return Promise.resolve(undefined);
    }
    this.write.writeValue(encode([4]));
    const self = this;
    return new Promise((resolve) => {
      self.addEventListener(
        "facelets",
        ({ detail }) => {
          resolve(detail);
        },
        { once: true }
      );
    });
  }
}

export const ganCube = new GanCube();
