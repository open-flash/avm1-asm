import chai from "chai";
import fs from "fs";
import { JsonReader } from "kryo/readers/json";
import { JsonValueWriter } from "kryo/writers/json-value";
import sysPath from "path";
import { $Cfg, Cfg } from "../lib/cfg";
import { fromBytes } from "../lib/from-bytes";
import meta from "./meta.js";

const JSON_READER: JsonReader = new JsonReader();
const JSON_VALUE_WRITER: JsonValueWriter = new JsonValueWriter();

const sampleNames: ReadonlyArray<string> = [
  "hello-world",
  "misaligned-jump",
  "new-simple",
  "try-catch-err",
  "try-catch-finally-err",
  "try-finally-err",
  "with-shadow",
];

describe("fromBytes", function () {
  for (const sampleName of sampleNames) {
    it(sampleName, async function () {
      const avm1Bytes: Uint8Array = fs.readFileSync(sysPath.join(meta.dirname, "samples", `${sampleName}.avm1`));
      const cfgStr: string = fs.readFileSync(
        sysPath.join(meta.dirname, "samples", `${sampleName}.json`),
        {encoding: "UTF-8"},
      );
      const expectedCfg: Cfg = $Cfg.read(JSON_READER, cfgStr);
      const actualCfg: Cfg = fromBytes(avm1Bytes);
      try {
        chai.assert.isTrue($Cfg.equals(actualCfg, expectedCfg));
      } catch (err) {
        chai.assert.strictEqual(
          JSON.stringify($Cfg.write(JSON_VALUE_WRITER, actualCfg), null, 2),
          JSON.stringify($Cfg.write(JSON_VALUE_WRITER, expectedCfg), null, 2),
        );
        throw err;
      }
    });
  }
});
