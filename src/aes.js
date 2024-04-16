/* eslint-disable no-sequences */
const exp3 = Array.from({ length: 256 }, () => 0x00);
const log3 = Array.from({ length: 256 }, () => 0xff);
const sbox = Array.from({ length: 256 }, () => 0x00);
const sboxInverse = Array.from({ length: 256 }, () => 0x00);
const swapBytes = [0, 5, 10, 15, 4, 9, 14, 3, 8, 13, 2, 7, 12, 1, 6, 11];

let a = 1;
for (let i = 0; i < 255; i++) {
  exp3[i] = a;
  log3[a] = i;
  a ^= a << 1;
  if (a & 0x100) {
    a ^= 0x11b;
  }
}

const inv = (a) => {
  if (a === 0) {
    return 0;
  }
  return exp3[(255 - log3[a]) % 255];
};

const rot = (a, n) => {
  n %= 8;
  return ((a << n) & 0xff) | ((a & 0xff) >>> (8 - n));
};

for (let i = 0; i < 256; i++) {
  const b = inv(i);
  sbox[i] = rot(b, 4) ^ rot(b, 3) ^ rot(b, 2) ^ rot(b, 1) ^ b ^ 0x63;
  sboxInverse[sbox[i]] = i;
}

const key128bit = (key) => {
  const expanded = key.slice(0, 16);
  let rcon = 1;
  let column;
  for (let i = 16; i < 176; i += 4) {
    if (i % 16 === 0) {
      column = [
        sbox[expanded[i - 3]] ^ rcon,
        sbox[expanded[i - 2]],
        sbox[expanded[i - 1]],
        sbox[expanded[i - 4]],
      ];
      rcon = exp3[(log3[rcon] + 25) % 255];
    }
    expanded[i + 0] = column[0] ^= expanded[i - 16];
    expanded[i + 1] = column[1] ^= expanded[i - 15];
    expanded[i + 2] = column[2] ^= expanded[i - 14];
    expanded[i + 3] = column[3] ^= expanded[i - 13];
  }
  return expanded;
};

const addRoundKey = (state, key) => {
  return state.map((el, j) => el ^ key[j]);
};

const substituteBytes = (state) => {
  return state.map((el) => sbox[el]);
};

const substituteBytesInverse = (state) => {
  return state.map((el) => sboxInverse[el]);
};

const shiftRows = (state) => {
  return state.map((el, i, arr) => arr[swapBytes[i]]);
};

const shiftRowsInverse = (state) => {
  return state.reduce((acc, el, i) => ((acc[swapBytes[i]] = el), acc), []);
};

const mul = (a, b) => {
  if (a === 0 || b === 0) {
    return 0;
  }
  return exp3[(log3[a] + log3[b]) % 255];
};

const mixColumns = (state) => {
  const newState = state.slice();
  for (let i = 0; i < state.length; i += 4) {
    const [x0, x1, x2, x3] = state.slice(i);
    const sum = x0 ^ x1 ^ x2 ^ x3;
    newState[i + 0] ^= sum ^ mul(2, x0 ^ x1);
    newState[i + 1] ^= sum ^ mul(2, x1 ^ x2);
    newState[i + 2] ^= sum ^ mul(2, x2 ^ x3);
    newState[i + 3] ^= sum ^ mul(2, x3 ^ x0);
  }
  return newState;
};

const mixColumnsInverse = (state) => {
  const newState = [];
  for (let i = 0; i < state.length; i += 4) {
    const [x0, x1, x2, x3] = state.slice(i);
    newState[i + 0] = mul(14, x0) ^ mul(11, x1) ^ mul(13, x2) ^ mul(9, x3);
    newState[i + 1] = mul(9, x0) ^ mul(14, x1) ^ mul(11, x2) ^ mul(13, x3);
    newState[i + 2] = mul(13, x0) ^ mul(9, x1) ^ mul(14, x2) ^ mul(11, x3);
    newState[i + 3] = mul(11, x0) ^ mul(13, x1) ^ mul(9, x2) ^ mul(14, x3);
  }
  return newState;
};

export const aesEncrypt = (data, key) => {
  let state = addRoundKey(data, key.slice(0, 16));
  for (let i = 16; i < key.length - 16; i += 16) {
    state = substituteBytes(state);
    state = shiftRows(state);
    state = mixColumns(state);
    state = addRoundKey(state, key.slice(i, i + 16));
  }
  state = substituteBytes(state);
  state = shiftRows(state);
  state = addRoundKey(state, key.slice(-16));
  return state;
};

export const aesDecrypt = (data, key) => {
  let state = addRoundKey(data, key.slice(-16));
  state = shiftRowsInverse(state);
  state = substituteBytesInverse(state);
  for (let i = key.length - 32; i >= 16; i -= 16) {
    state = addRoundKey(state, key.slice(i, i + 16));
    state = mixColumnsInverse(state);
    state = shiftRowsInverse(state);
    state = substituteBytesInverse(state);
  }
  state = addRoundKey(state, key.slice(0, 16));
  return state;
};

export const key = key128bit([
  97, 163, 23, 189, 136, 94, 22, 7, 32, 5, 24, 84, 66, 17, 18, 83,
]);
export const iv = [
  113, 164, 7, 189, 120, 205, 118, 39, 32, 149, 120, 20, 50, 18, 2, 67,
];
