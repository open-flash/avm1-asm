import { $Cfg, Cfg } from "avm1-tree/cfg";
import chai from "chai";
import fs from "fs";
import { JsonReader } from "kryo/readers/json";
import sysPath from "path";
import { toAasm } from "../lib/to-aasm";
import meta from "./meta.js";

const JSON_READER: JsonReader = new JsonReader();

const sampleNames: ReadonlyArray<string> = [
  "hello-world",
  "if-else",
  "misaligned-jump",
  "new-simple",
  "try-catch-err",
  "try-catch-finally-err",
  "try-finally-err",
  "with-shadow",
];

describe("toAasm", function () {
  for (const sampleName of sampleNames) {
    it(sampleName, async function () {
      const expectedAasm: string = fs.readFileSync(
        sysPath.join(meta.dirname, "samples", `${sampleName}.aasm1`),
        {encoding: "UTF-8"},
      );
      const cfgStr: string = fs.readFileSync(
        sysPath.join(meta.dirname, "samples", `${sampleName}.json`),
        {encoding: "UTF-8"},
      );
      const cfg: Cfg = $Cfg.read(JSON_READER, cfgStr);
      const actualAasm: string = toAasm(cfg);
      chai.assert.strictEqual(actualAasm, expectedAasm);
    });
  }
});
