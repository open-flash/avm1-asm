import { $Action as $RawAction, Action as RawAction, ActionType } from "avm1-tree";
import { $ActionType } from "avm1-tree/action-type";
import { If as RawIf, Jump as RawJump } from "avm1-tree/actions";
import { ActionBase } from "avm1-tree/actions/_base";
import { CaseStyle } from "kryo/case-style";
import { DocumentIoType, DocumentType } from "kryo/types/document";
import { LiteralType } from "kryo/types/literal";
import { TaggedUnionType } from "kryo/types/tagged-union";
import { $Label, Label } from "./label";

export interface If extends ActionBase {
  action: ActionType.If;
  target: Label;
}

export const $If: DocumentIoType<If> = new DocumentType<If>(() => ({
  properties: {
    action: {type: new LiteralType({type: $ActionType, value: ActionType.If as ActionType.If})},
    target: {type: $Label},
  },
  changeCase: CaseStyle.SnakeCase,
}));

export interface Jump extends ActionBase {
  action: ActionType.Jump;
  target: Label;
}

export const $Jump: DocumentIoType<Jump> = new DocumentType<Jump>(() => ({
  properties: {
    action: {type: new LiteralType({type: $ActionType, value: ActionType.Jump as ActionType.Jump})},
    target: {type: $Label},
  },
  changeCase: CaseStyle.SnakeCase,
}));

export type Action = Exclude<RawAction, RawIf | RawJump> | If | Jump;

export const $Action: TaggedUnionType<Action> = new TaggedUnionType<Action>(() => ({
  variants: $RawAction.variants.map(($rawAction: DocumentType<RawAction>): DocumentIoType<Action> => {
    const $rawActionType: LiteralType<ActionType> = $rawAction.properties.action.type as any;
    switch ($rawActionType.value) {
      case ActionType.If:
        return $If;
      case ActionType.Jump:
        return $Jump;
      default:
        return $rawAction as DocumentIoType<Action>;
    }
  }),
  tag: "action",
}));
