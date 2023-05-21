export const clone = <T extends any>(state: T): T =>
  JSON.parse(JSON.stringify(state));

export const mod4 = (a: number, b: number) => (a + b) % 4;

export const rad = (deg: number) => (Math.PI * deg) / 180;

export const rol8 = (byte: number, bits: number) =>
  ((byte << bits) | (byte >> (8 - bits))) & 0xff;

export const convertByteSize = (
  input: number[],
  inputWordSizeParam: number | number[],
  outputWordSizeParam: number | number[]
) => {
  const inputWordSizes = Array.isArray(inputWordSizeParam)
    ? [...inputWordSizeParam]
    : Array.from({ length: input.length }, () => inputWordSizeParam);

  const outputWordSizes = Array.isArray(outputWordSizeParam)
    ? [...outputWordSizeParam]
    : Array.from({ length: input.length * 8 }, () => outputWordSizeParam);

  const inputBuffer = new Uint8ClampedArray(input);
  const outputBuffer: number[] = [];

  let bitsFrom = inputWordSizes.shift()!;
  let bitsTo = outputWordSizes.shift()!;

  let iOffset = 0;
  let iByte = inputBuffer[iOffset];
  let o = 0;
  let bitsFree = bitsTo;
  let bitsLeft = bitsFrom;
  while (iOffset < inputBuffer.byteLength) {
    let bitsConsume = Math.min(bitsFree, bitsLeft);
    let bitMask = 2 ** bitsFree - 1;
    let bitsShift = (8 + bitsFree - bitsLeft) % 8;
    // console.log('before', {bitsFree, bitsLeft, bitsConsume, bitMask, bitsShift, iOffset, iByte, o})
    iByte = rol8(iByte, bitsShift);
    outputBuffer[o] = outputBuffer[o] | (iByte & bitMask);
    // console.log('output', {iByte, output: outputBuffer[o]})
    iByte = rol8(iByte & ~bitMask, 8 - bitsShift);
    // console.log('after', {iByte})
    bitsFree -= bitsConsume;
    if (bitsFree === 0) {
      o++;
      bitsFree = outputWordSizes.shift()!;
    }
    bitsLeft -= bitsConsume;
    if (bitsLeft === 0) {
      iOffset++;
      iByte = inputBuffer[iOffset];
      bitsLeft = inputWordSizes.shift()!;
    }
  }
  return outputBuffer;
};

const base64Alfabet =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";

export const base64Encode = (data: number[]) =>
  convertByteSize(data, 8, 6)
    .map((el) => base64Alfabet[el])
    .join("");

export const base64Decode = (data: string) =>
  convertByteSize(
    data.split("").map((el) => base64Alfabet.indexOf(el)),
    6,
    8
  );
