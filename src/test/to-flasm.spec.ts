import chai from "chai";
import fs from "fs";
import { JsonReader } from "kryo/readers/json";
import sysPath from "path";
import { $Cfg, Cfg } from "../lib/cfg";
import { toFlasm } from "../lib/to-flasm";
import meta from "./meta.js";

const JSON_READER: JsonReader = new JsonReader();

describe("toFlasm", function () {
  it("hello-world", async function () {
    const expectedFlasm: string = fs.readFileSync(
      sysPath.join(meta.dirname, "samples", "hello-world.flasm1"),
      {encoding: "UTF-8"},
    );
    const cfgStr: string = fs.readFileSync(
      sysPath.join(meta.dirname, "samples", "hello-world.json"),
      {encoding: "UTF-8"},
    );
    const cfg: Cfg = $Cfg.read(JSON_READER, cfgStr);
    const actualFlasm: string = toFlasm(cfg);
    chai.assert.strictEqual(actualFlasm, expectedFlasm);
  });

  it("misaligned-jump", async function () {
    const expectedFlasm: string = fs.readFileSync(
      sysPath.join(meta.dirname, "samples", "misaligned-jump.flasm1"),
      {encoding: "UTF-8"},
    );
    const cfgStr: string = fs.readFileSync(
      sysPath.join(meta.dirname, "samples", "misaligned-jump.json"),
      {encoding: "UTF-8"},
    );
    const cfg: Cfg = $Cfg.read(JSON_READER, cfgStr);
    const actualFlasm: string = toFlasm(cfg);
    chai.assert.strictEqual(actualFlasm, expectedFlasm);
  });
});
