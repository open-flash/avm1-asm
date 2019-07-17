import { $Cfg, Cfg } from "avm1-tree/cfg";
import chai from "chai";
import fs from "fs";
import { JsonReader } from "kryo/readers/json";
import sysPath from "path";
import { toAasm } from "../lib/to-aasm";
import meta from "./meta.js";
import { readTextFile, writeTextFile } from "./utils";

const PROJECT_ROOT: string = sysPath.join(meta.dirname, "..", "..", "..");
const REPO_ROOT: string = sysPath.join(PROJECT_ROOT, "..");
const AVM1_SAMPLES_ROOT: string = sysPath.join(REPO_ROOT, "tests", "avm1");

const JSON_READER: JsonReader = new JsonReader();
// `BLACKLIST` can be used to forcefully skip some tests.
const BLACKLIST: ReadonlySet<string> = new Set([
  "avm1-bytes/corrupted-push",
]);
// `WHITELIST` can be used to only enable a few tests.
const WHITELIST: ReadonlySet<string> = new Set([
  // "hello-world",
]);

describe("toAasm", function () {
  this.timeout(300000); // The timeout is this high due to CI being extremely slow

  for (const sample of getSamples()) {
    it(sample.name, async function () {
      const inputCfgJson: string = await readTextFile(sample.cfgPath);
      const inpuCfg: Cfg = $Cfg.read(JSON_READER, inputCfgJson);
      const actualAasm1: string = toAasm(inpuCfg);
      await writeTextFile(sysPath.join(sample.root, "local-main.ts.aasm1"), actualAasm1);
      const expectedAasm1: string = await readTextFile(sample.aasm1Path);
      chai.assert.strictEqual(actualAasm1, expectedAasm1);
    });
  }
});

interface Sample {
  root: string;
  name: string;
  cfgPath: string;
  aasm1Path: string;
}

function* getSamples(): IterableIterator<Sample> {
  for (const dirEnt of fs.readdirSync(AVM1_SAMPLES_ROOT, {withFileTypes: true})) {
    if (!dirEnt.isDirectory() || dirEnt.name.startsWith(".")) {
      continue;
    }

    const groupName: string = dirEnt.name;
    const groupPath: string = sysPath.join(AVM1_SAMPLES_ROOT, groupName);

    for (const dirEnt of fs.readdirSync(groupPath, {withFileTypes: true})) {
      if (!dirEnt.isDirectory()) {
        continue;
      }
      const testName: string = dirEnt.name;
      const testPath: string = sysPath.join(groupPath, testName);

      const name: string = `${groupName}/${testName}`;

      if (BLACKLIST.has(name)) {
        continue;
      } else if (WHITELIST.size > 0 && !WHITELIST.has(testName)) {
        continue;
      }

      const cfgPath: string = sysPath.join(testPath, "cfg.json");
      const aasm1Path: string = sysPath.join(testPath, "main.aasm1");

      yield {root: testPath, name, cfgPath, aasm1Path};
    }
  }
}
