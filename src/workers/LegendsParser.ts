import { XMLParser } from "fast-xml-parser";

onmessage = async (ev: MessageEvent<File>) => {
  postMessage(
    new XMLParser().parse(
      new TextDecoder().decode(new Uint8Array(await ev.data.arrayBuffer())),
    ),
  );
};
