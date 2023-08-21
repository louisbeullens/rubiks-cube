import * as THREE from "three";
import {
  defaultCube,
  defaultState,
  getCorePermutation,
  stateToCube,
} from "../rubiks-cube/cube-util";
import { rotationMap } from "../rubiks-cube/rotationMap";
import { coreOrientationMap } from "../rubiks-cube/rotationMap";
import { faceInfo, point3DtoUv, uvToIndex } from "../rubiks-cube/spatial-util";
import { mod4 } from "../utils";

const ONE_TWELFTH = 1 / 12;
const ONE_NINED = 1 / 9;

const uvRotationMap = [
  [
    [0, 0],
    [1, 0],
    [0, 1],
    [1, 1],
  ],
  [
    [0, 1],
    [0, 0],
    [1, 1],
    [1, 0],
  ],
  [
    [1, 1],
    [0, 1],
    [1, 0],
    [0, 0],
  ],
  [
    [1, 0],
    [1, 1],
    [0, 0],
    [0, 1],
  ],
];

class CubieGeometry extends THREE.BufferGeometry {
  constructor(coordinate, cubeState = defaultState) {
    const width = 1,
      height = 1,
      depth = 1;
    const cube = stateToCube(cubeState);

    super();

    this.type = "CubeGeometry";

    this.parameters = {
      coordinate,
      cubeState,
    };

    const scope = this;

    // buffers

    const indices = [];
    const vertices = [];
    const normals = [];
    const uvs = [];

    // helper variables

    const isCenterCubie =
      Math.abs(coordinate.x) +
        Math.abs(coordinate.y) +
        Math.abs(coordinate.z) ===
      1;

    const corePermutation = getCorePermutation(cubeState);

    const coreOrientation = coreOrientationMap[corePermutation];

    let numberOfVertices = 0;
    let groupStart = 0;

    // build each side of the box geometry

    buildPlane("x", "z", "y", 1, 1, width, depth, height, 0); // py
    buildPlane("z", "y", "x", 1, -1, depth, height, -width, 1); // nx
    buildPlane("x", "y", "z", 1, -1, width, height, depth, 2); // pz
    buildPlane("z", "y", "x", -1, -1, depth, height, width, 3); // px
    buildPlane("x", "y", "z", -1, -1, width, height, -depth, 4); // nz
    buildPlane("x", "z", "y", 1, -1, width, depth, -height, 5); // ny

    // build geometry

    this.setIndex(indices);
    this.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(vertices, 3)
    );
    this.setAttribute("normal", new THREE.Float32BufferAttribute(normals, 3));
    this.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));

    function buildPlane(a, b, c, udir, vdir, width, height, depth, faceIndex) {
      const widthHalf = width / 2;
      const heightHalf = height / 2;
      const depthHalf = depth / 2;

      let vertexCounter = 0;
      let groupCount = 0;

      const vector = new THREE.Vector3();

      const face = point3DtoUv(coordinate, faceIndex);

      const homeSticker = face
        ? defaultCube[face.faceIndex][uvToIndex(face.u, face.v)]
        : undefined;

      const sticker = face
        ? cube[face.faceIndex][uvToIndex(face.u, face.v)]
        : undefined;

      const rotation = face
        ? isCenterCubie
          ? mod4(coreOrientation[faceIndex], sticker % 9)
          : rotationMap[homeSticker][sticker]
        : 0;

      const stickerFaceIndex = face ? Math.floor(sticker / 9) % 6 : undefined;

      const stickerU = face
        ? isCenterCubie
          ? 1
          : (sticker % 9) % 3
        : undefined;

      const stickerV = face
        ? isCenterCubie
          ? 1
          : Math.floor((sticker % 9) / 3)
        : undefined;

      // generate vertices, normals and uvs

      for (let iy = 0; iy < 2; iy++) {
        const y = iy * height - heightHalf;

        for (let ix = 0; ix < 2; ix++) {
          const x = ix * width - widthHalf;

          // set values to correct vector component

          vector[a] = x * udir;
          vector[b] = y * vdir;
          vector[c] = depthHalf;

          // now apply vector to vertex buffer

          vertices.push(vector.x, vector.y, vector.z);

          // set values to correct vector component

          vector[a] = 0;
          vector[b] = 0;
          vector[c] = depth > 0 ? 1 : -1;

          // now apply vector to normal buffer

          normals.push(vector.x, vector.y, vector.z);

          // uvs

          const u = face
            ? faceInfo[stickerFaceIndex].textureU * 3 +
              stickerU +
              uvRotationMap[rotation][2 * iy + ix][0]
            : ix;

          const v = face
            ? faceInfo[stickerFaceIndex].textureV * 3 +
              stickerV +
              uvRotationMap[rotation][2 * iy + ix][1]
            : iy;

          uvs.push(u * ONE_TWELFTH);
          uvs.push(1 - v * ONE_NINED);

          // counters

          vertexCounter += 1;
        }
      }

      // indices

      // 1. you need three indices to draw a single face
      // 2. a single segment consists of two faces
      // 3. so we need to generate six (2*3) indices per segment

      const d = numberOfVertices;
      const e = numberOfVertices + 2;
      const f = numberOfVertices + 3;
      const g = numberOfVertices + 1;

      // faces

      indices.push(d, e, g);
      indices.push(e, f, g);

      // increase counter

      groupCount += 6;

      // add a group to the geometry. this will ensure multi material support

      scope.addGroup(groupStart, groupCount, 0);

      // calculate new start value for groups

      groupStart += groupCount;

      // update total number of vertices

      numberOfVertices += vertexCounter;
    }
  }

  copy(source) {
    super.copy(source);

    this.parameters = JSON.parse(JSON.stringify(source.parameters));

    return this;
  }

  static fromJSON(data) {
    return new CubieGeometry(data.coordinate, data.cubeState);
  }
}

export { CubieGeometry };
