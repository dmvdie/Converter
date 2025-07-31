import { Readable } from "stream";

/**
 * Converts a web ReadableStream to a Node.js Readable stream.
 * @param webStream The web ReadableStream to convert.
 * @returns Node.js Readable stream
 */
export function webStreamToNode(webStream: ReadableStream<Uint8Array>): Readable {
  const nodeStream = new Readable({
    read() {},
  });
  const reader = webStream.getReader();
  function push() {
    reader.read().then(({ done, value }) => {
      if (done) {
        nodeStream.push(null);
        return;
      }
      nodeStream.push(Buffer.from(value));
      push();
    });
  }
  push();
  return nodeStream;
}
