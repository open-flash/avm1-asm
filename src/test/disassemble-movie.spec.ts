import chai from "chai";
import fs from "fs";
import sysPath from "path";
import { movieFromBytes } from "swf-parser";
import { Movie } from "swf-tree";
import { disassembleMovie } from "../lib/disassemble-movie";
import meta from "./meta.js";

describe("disassembleMovie", function () {
  it("hello-world", async function () {
    const swfBytes: Uint8Array = fs.readFileSync(sysPath.join(meta.dirname, "movies", "hello-world.swf"));
    const expectedFlasmStr: string = fs.readFileSync(
      sysPath.join(meta.dirname, "movies", "hello-world.flasm1"),
      {encoding: "UTF-8"},
    );
    const movie: Movie = movieFromBytes(swfBytes);
    const actualFlasmStr: string = disassembleMovie(movie);
    chai.assert.deepEqual(actualFlasmStr, expectedFlasmStr);
  });
});
