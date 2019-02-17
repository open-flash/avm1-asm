import { Movie, Tag, TagType } from "swf-tree";
import { DoAction } from "swf-tree/tags";
import { Cfg } from "./cfg";
import { fromBytes as cfgFromBytes } from "./from-bytes";
import { toFlasm } from "./to-flasm";

type AstPath = ReadonlyArray<string | number>;
type Avm1Visitor = (node: Uint8Array, path: AstPath) => void;

export function disassembleMovie(movie: Movie): string {
  const chunks: string[] = [];
  traverseMovie(movie, (avm1Bytes: Uint8Array, path: AstPath): void => {
    chunks.push(`# ${JSON.stringify(path)}`);
    try {
      const cfg: Cfg = cfgFromBytes(avm1Bytes);
      const flasm: string = toFlasm(cfg);
      chunks.push(flasm);
    } catch (err) {
      chunks.push(err.toString());
    }
  });
  return chunks.join("\n");
}

function traverseMovie(movie: Movie, visitor: Avm1Visitor): void {
  traverseTags(movie.tags, visitor, ["tags"]);
}

function traverseTags(tags: ReadonlyArray<Tag>, visitor: Avm1Visitor, parentPath: AstPath): void {
  for (const [i, tag] of tags.entries()) {
    traverseTag(tag, visitor, [...parentPath, i]);
  }
}

function traverseTag(tag: Tag, visitor: Avm1Visitor, parentPath: AstPath): void {
  switch (tag.type) {
    case TagType.DoAction:
      return traverseDoActionTag(tag, visitor, parentPath);
    default:
      return;
  }
}

function traverseDoActionTag(tag: DoAction, visitor: Avm1Visitor, parentPath: AstPath): void {
  visitor(tag.actions, [...parentPath, "actions"]);
}
