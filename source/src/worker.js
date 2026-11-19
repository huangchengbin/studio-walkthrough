// Background decode worker: gunzip + JSON.parse + base64 geometry buffers.
import { decodeScene } from "./decode.js";

self.onmessage = async (event) => {
  try {
    const result = await decodeScene(event.data, {
      progress: (done, total) => self.postMessage({ type: "progress", done, total }),
    });
    self.postMessage({ type: "ready", data: result.data, timing: result.timing }, result.transfers);
  } catch (error) {
    self.postMessage({ type: "error", message: String(error?.message || error) });
  }
};
