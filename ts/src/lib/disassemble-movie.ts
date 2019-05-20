import { Movie, Tag, TagType } from "swf-tree";
import { DefineSprite, DoAction, DoInitAction } from "swf-tree/tags";
import { Cfg } from "./cfg";
import { fromBytes as cfgFromBytes } from "./from-bytes";
import { toAasm } from "./to-aasm";

type AstPath = ReadonlyArray<string | number>;
type Avm1Visitor = (node: Uint8Array, path: AstPath) => void;

export function disassembleMovie(movie: Movie): string {
  const chunks: string[] = [];
  traverseMovie(movie, (avm1Bytes: Uint8Array, path: AstPath): void => {
    chunks.push(`# ${JSON.stringify(path)}`);
    try {
      const cfg: Cfg = cfgFromBytes(avm1Bytes);
      const aasm: string = toAasm(cfg);
      chunks.push(aasm);
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
    case TagType.DefineSprite:
      return traverseDefineSpriteTag(tag, visitor, parentPath);
    case TagType.DoAction:
      return traverseDoActionTag(tag, visitor, parentPath);
    case TagType.DoInitAction:
      return traverseDoInitActionTag(tag, visitor, parentPath);
    default:
      return;
  }
}

function traverseDefineSpriteTag(tag: DefineSprite, visitor: Avm1Visitor, parentPath: AstPath): void {
  return traverseTags(tag.tags, visitor, [...parentPath, "tags"]);
}

function traverseDoActionTag(tag: DoAction, visitor: Avm1Visitor, parentPath: AstPath): void {
  visitor(tag.actions, [...parentPath, "actions"]);
}

function traverseDoInitActionTag(tag: DoInitAction, visitor: Avm1Visitor, parentPath: AstPath): void {
  visitor(tag.actions, [...parentPath, "actions"]);
}
