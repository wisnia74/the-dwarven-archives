import { XMLParser } from "fast-xml-parser";

onmessage = async (ev: MessageEvent<File>) => {
  console.time("parse");
  postMessage(
    new XMLParser().parse(
      new TextDecoder().decode(new Uint8Array(await ev.data.arrayBuffer())),
    ),
  );
  console.timeEnd("parse");
};
