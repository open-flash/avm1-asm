import { parseCfg } from "avm1-parser";
import { Cfg } from "avm1-types/lib/cfg/cfg.js";
import { Movie, Tag, TagType } from "swf-types";
import { DefineSprite, DoAction, DoInitAction } from "swf-types/lib/tags/index.js";
import { toAasm } from "./to-aasm.js";

type AstPath = ReadonlyArray<string | number>;
type Avm1Visitor = (node: Uint8Array, path: AstPath) => void;

// tslint:disable:no-void-expression

export function disassembleMovie(movie: Movie): string {
  const chunks: string[] = [];
  traverseMovie(movie, (avm1Bytes: Uint8Array, path: AstPath): void => {
    chunks.push(`# ${JSON.stringify(path)}`);
    try {
      const cfg: Cfg = parseCfg(avm1Bytes) as any;
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
