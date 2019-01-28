import chai from "chai";
import fs from "fs";
import { JsonReader } from "kryo/readers/json";
import sysPath from "path";
import { $Cfg, Cfg } from "../lib/cfg";
import { fromBytes } from "../lib/from-bytes";
import meta from "./meta.js";

const JSON_READER: JsonReader = new JsonReader();

describe("fromBytes", function () {
  it("hello-world", async function () {
    const avm1Bytes: Uint8Array = fs.readFileSync(sysPath.join(meta.dirname, "samples", "hello-world.avm1"));
    const cfgStr: string = fs.readFileSync(
      sysPath.join(meta.dirname, "samples", "hello-world.json"),
      {encoding: "UTF-8"},
    );
    const expectedCfg: Cfg = $Cfg.read(JSON_READER, cfgStr);
    const actualCfg: Cfg = fromBytes(avm1Bytes);
    try {
      chai.assert.isTrue($Cfg.equals(actualCfg, expectedCfg));
    } catch (err) {
      chai.assert.deepEqual(actualCfg, expectedCfg);
      throw err;
    }
  });

  it("misaligned-jump", async function () {
    const avm1Bytes: Uint8Array = fs.readFileSync(sysPath.join(meta.dirname, "samples", "misaligned-jump.avm1"));
    const cfgStr: string = fs.readFileSync(
      sysPath.join(meta.dirname, "samples", "misaligned-jump.json"),
      {encoding: "UTF-8"},
    );
    const expectedCfg: Cfg = $Cfg.read(JSON_READER, cfgStr);
    const actualCfg: Cfg = fromBytes(avm1Bytes);
    try {
      chai.assert.isTrue($Cfg.equals(actualCfg, expectedCfg));
    } catch (err) {
      chai.assert.deepEqual(actualCfg, expectedCfg);
      throw err;
    }
  });
});
