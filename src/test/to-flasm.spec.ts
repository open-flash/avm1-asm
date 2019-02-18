import chai from "chai";
import fs from "fs";
import { JsonReader } from "kryo/readers/json";
import sysPath from "path";
import { $Cfg, Cfg } from "../lib/cfg";
import { toFlasm } from "../lib/to-flasm";
import meta from "./meta.js";

const JSON_READER: JsonReader = new JsonReader();

const sampleNames: ReadonlyArray<string> = [
  "hello-world",
  "misaligned-jump",
  "with-shadow",
];

describe("toFlasm", function () {
  for (const sampleName of sampleNames) {
    it(sampleName, async function () {
      const expectedFlasm: string = fs.readFileSync(
        sysPath.join(meta.dirname, "samples", `${sampleName}.flasm1`),
        {encoding: "UTF-8"},
      );
      const cfgStr: string = fs.readFileSync(
        sysPath.join(meta.dirname, "samples", `${sampleName}.json`),
        {encoding: "UTF-8"},
      );
      const cfg: Cfg = $Cfg.read(JSON_READER, cfgStr);
      const actualFlasm: string = toFlasm(cfg);
      chai.assert.strictEqual(actualFlasm, expectedFlasm);
    });
  }
});
