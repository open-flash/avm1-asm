import chai from "chai";
import fs from "fs";
import { JsonReader } from "kryo/readers/json";
import sysPath from "path";
import { $Cfg, Cfg } from "../lib/cfg";
import { cfgToBytes } from "../lib/to-bytes";
import meta from "./meta.js";

const JSON_READER: JsonReader = new JsonReader();

const sampleNames: ReadonlyArray<string> = [
  "hello-world",
  "if-else",
  "with-shadow",
];

describe("cfgToBytes", function () {
  for (const sampleName of sampleNames) {
    it(sampleName, async function () {
      const expectedAvm1Bytes: Uint8Array = fs.readFileSync(
        sysPath.join(meta.dirname, "samples", `${sampleName}.out.avm1`),
        {encoding: null},
      );
      const cfgStr: string = fs.readFileSync(
        sysPath.join(meta.dirname, "samples", `${sampleName}.json`),
        {encoding: "UTF-8"},
      );
      const cfg: Cfg = $Cfg.read(JSON_READER, cfgStr);
      const actualAvm1Bytes: Uint8Array = cfgToBytes(cfg);
      chai.assert.deepEqual(Buffer.from(actualAvm1Bytes), expectedAvm1Bytes);
    });
  }
});
