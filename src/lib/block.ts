import { CaseStyle } from "kryo/case-style";
import { ArrayType } from "kryo/types/array";
import { DocumentIoType, DocumentType } from "kryo/types/document";
import { $Action, Action } from "./action";
import { $Label, Label } from "./label";

export interface Block {
  readonly label: Label;
  readonly actions: ReadonlyArray<Action>;
  readonly next?: Label;
}

export const $Block: DocumentIoType<Block> = new DocumentType<Block>(() => ({
  properties: {
    label: {type: $Label},
    actions: {type: new ArrayType({itemType: $Action, maxLength: Infinity})},
    next: {type: $Label, optional: true},
  },
  changeCase: CaseStyle.SnakeCase,
}));
