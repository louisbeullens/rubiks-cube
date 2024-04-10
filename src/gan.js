import { aesDecrypt, iv, key } from "./aes";

const decode = (value, cb) => {
  let payload = new Uint8ClampedArray(value.buffer);
  let result = aesDecrypt(payload.slice(-16), key).map((el, i) => el ^ iv[i]);
  payload.set(result, payload.byteLength - 16);
  result = aesDecrypt(payload.slice(0, 16), key).map((el, i) => el ^ iv[i]);
  payload.set(result, 0);
  payload = [...payload];
  const binary = payload.map((el) => el.toString(2).padStart(8, "0")).join("");
  const mode = parseInt(binary.slice(0, 4), 2);
  if (mode !== 2) {
    return;
  }
  const raw = parseInt(binary.slice(12, 17), 2);
  const face = "UFLDBR".at(raw >>> 1);
  const direction = ["", "'"].at(raw & 1);
  const move = `${face}${direction}`;
  cb?.(move);
};

export const setupGANCube = async (cb) => {
  const device = await navigator.bluetooth.requestDevice({
    filters: [
      {
        namePrefix: "GAN",
      },
    ],
    optionalServices: ["6e400001-b5a3-f393-e0a9-e50e24dc4179"],
  });
  await device.gatt.connect();
  const service = await device.gatt.getPrimaryService(
    "6e400001-b5a3-f393-e0a9-e50e24dc4179"
  );
  let read = await service.getCharacteristic(
    "28be4cb6-cd67-11e9-a32f-2a2ae2dbcce4"
  );
  read.addEventListener(
    "characteristicvaluechanged",
    ({ target: { value } }) => {
      decode(value, cb);
    }
  );
  await read.startNotifications();
  return device;
};
