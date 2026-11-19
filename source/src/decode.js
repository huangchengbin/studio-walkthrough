// Scene payload decoding shared by the main thread fallback and the worker.
import { gunzipSync } from "fflate";

export function base64ToBytes(text) {
  const bin = atob(text);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

export async function gunzipToText(base64) {
  const bytes = base64ToBytes(base64);
  if (typeof DecompressionStream === "function")
    try {
      return await new Response(
        new Blob([bytes]).stream().pipeThrough(new DecompressionStream("gzip")),
      ).text();
    } catch {
      /* fall through to fflate */
    }
  return new TextDecoder().decode(gunzipSync(bytes));
}

export function allMeshDefs(data) {
  return [...data.meshes, ...data.catalog.items.flatMap((item) => item.meshes)];
}

export function decodeMeshBuffers(mesh) {
  const transfers = [];
  for (const key of ["positions", "normals", "colors", "indices", "uvs"])
    if (typeof mesh[key] === "string") {
      mesh[key] = base64ToBytes(mesh[key]).buffer;
      transfers.push(mesh[key]);
    }
  return transfers;
}

export async function decodeScene(base64, { yieldTask = async () => {}, progress = () => {} } = {}) {
  const start = performance.now();
  const text = await gunzipToText(base64);
  const afterInflate = performance.now();
  const data = JSON.parse(text);
  const afterParse = performance.now();
  const transfers = [];
  const meshes = allMeshDefs(data);
  for (let i = 0; i < meshes.length; i++) {
    transfers.push(...decodeMeshBuffers(meshes[i]));
    if (i % 8 === 7) {
      progress(i + 1, meshes.length);
      await yieldTask();
    }
  }
  return {
    data,
    transfers,
    timing: {
      decompressMs: afterInflate - start,
      parseMs: afterParse - afterInflate,
      decodeMs: performance.now() - afterParse,
    },
  };
}
