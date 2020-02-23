import chai from "chai";
import fs from "fs";
import sysPath from "path";
import { parseSwf } from "swf-parser";
import { Movie } from "swf-types";
import { disassembleMovie } from "../lib/disassemble-movie";
import meta from "./meta.js";

const sampleNames: ReadonlyArray<string> = [
  "hello-world",
  "hoisted-fn",
];

describe("disassembleMovie", function () {
  for (const sampleName of sampleNames) {
    it(sampleName, async function () {
      const swfBytes: Uint8Array = fs.readFileSync(sysPath.join(meta.dirname, "movies", `${sampleName}.swf`));
      const expectedAasmStr: string = fs.readFileSync(
        sysPath.join(meta.dirname, "movies", `${sampleName}.aasm1`),
        {encoding: "UTF-8"},
      );
      const movie: Movie = parseSwf(swfBytes);
      const actualAasmStr: string = disassembleMovie(movie);
      chai.assert.deepEqual(actualAasmStr, expectedAasmStr);
    });
  }
});
