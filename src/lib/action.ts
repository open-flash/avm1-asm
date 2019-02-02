import {
  $Action as $RawAction,
  $CatchTarget,
  $Parameter,
  Action as RawAction,
  ActionType,
  CatchTarget,
  Parameter,
} from "avm1-tree";
import { $ActionType } from "avm1-tree/action-type";
import {
  DefineFunction as RawDefineFunction,
  DefineFunction2 as RawDefineFunction2,
  If as RawIf,
  Jump as RawJump,
  Try as RawTry,
  With as RawWith,
} from "avm1-tree/actions";
import { ActionBase } from "avm1-tree/actions/_base";
import { $Boolean } from "kryo/builtins/boolean";
import { CaseStyle } from "kryo/case-style";
import { ArrayType } from "kryo/types/array";
import { DocumentIoType, DocumentType } from "kryo/types/document";
import { IntegerType } from "kryo/types/integer";
import { LiteralType } from "kryo/types/literal";
import { TaggedUnionType } from "kryo/types/tagged-union";
import { Ucs2StringType } from "kryo/types/ucs2-string";
import { UintSize } from "semantic-types";
import { $Cfg, Cfg } from "./cfg";
import { $Label, Label } from "./label";

export interface DefineFunction extends ActionBase {
  action: ActionType.DefineFunction;
  name: string;
  parameters: string[];
  body: Cfg;
}

export const $DefineFunction: DocumentIoType<DefineFunction> = new DocumentType<DefineFunction>(() => ({
  properties: {
    action: {type: new LiteralType({type: $ActionType, value: ActionType.DefineFunction as ActionType.DefineFunction})},
    name: {type: new Ucs2StringType({maxLength: Infinity})},
    parameters: {
      type: new ArrayType({
        itemType: new Ucs2StringType({maxLength: Infinity}),
        maxLength: Infinity,
      }),
    },
    body: {type: $Cfg},
  },
  changeCase: CaseStyle.SnakeCase,
}));

export interface DefineFunction2 extends ActionBase {
  action: ActionType.DefineFunction2;
  name: string;
  preloadParent: boolean;
  preloadRoot: boolean;
  suppressSuper: boolean;
  preloadSuper: boolean;
  suppressArguments: boolean;
  preloadArguments: boolean;
  suppressThis: boolean;
  preloadThis: boolean;
  preloadGlobal: boolean;
  registerCount: UintSize;
  parameters: Parameter[];
  body: Cfg;
}

export const $DefineFunction2: DocumentIoType<DefineFunction2> = new DocumentType<DefineFunction2>(() => ({
  properties: {
    action: {
      type: new LiteralType({
        type: $ActionType,
        value: ActionType.DefineFunction2 as ActionType.DefineFunction2,
      }),
    },
    name: {type: new Ucs2StringType({maxLength: Infinity})},
    preloadParent: {type: $Boolean},
    preloadRoot: {type: $Boolean},
    suppressSuper: {type: $Boolean},
    preloadSuper: {type: $Boolean},
    suppressArguments: {type: $Boolean},
    preloadArguments: {type: $Boolean},
    suppressThis: {type: $Boolean},
    preloadThis: {type: $Boolean},
    preloadGlobal: {type: $Boolean},
    registerCount: {type: new IntegerType()},
    parameters: {type: new ArrayType({itemType: $Parameter, maxLength: Infinity})},
    body: {type: $Cfg},
  },
  changeCase: CaseStyle.SnakeCase,
}));

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

export interface Try extends ActionBase {
  action: ActionType.Try;
  try: Cfg;
  catch?: Cfg;
  catchTarget: CatchTarget;
  finally?: Cfg;
}

export const $Try: DocumentIoType<Try> = new DocumentType<Try>(() => ({
  properties: {
    action: {type: new LiteralType({type: $ActionType, value: ActionType.Try as ActionType.Try})},
    try: {type: $Cfg},
    catch: {type: $Cfg, optional: true},
    catchTarget: {type: $CatchTarget},
    finally: {type: $Cfg, optional: true},
  },
  changeCase: CaseStyle.SnakeCase,
}));

export interface With extends ActionBase {
  action: ActionType.With;
  with: Cfg;
}

export const $With: DocumentIoType<With> = new DocumentType<With>(() => ({
  properties: {
    action: {type: new LiteralType({type: $ActionType, value: ActionType.With as ActionType.With})},
    with: {type: $Cfg},
  },
  changeCase: CaseStyle.SnakeCase,
}));

export type Action = Exclude<RawAction, RawDefineFunction | RawDefineFunction2 | RawIf | RawJump | RawTry | RawWith>
  | DefineFunction
  | DefineFunction2
  | If
  | Jump
  | Try
  | With;

export const $Action: TaggedUnionType<Action> = new TaggedUnionType<Action>(() => ({
  variants: $RawAction.variants.map(($rawAction: DocumentType<RawAction>): DocumentIoType<Action> => {
    const $rawActionType: LiteralType<ActionType> = $rawAction.properties.action.type as any;
    switch ($rawActionType.value) {
      case ActionType.DefineFunction:
        return $DefineFunction;
      case ActionType.DefineFunction2:
        return $DefineFunction2;
      case ActionType.If:
        return $If;
      case ActionType.Jump:
        return $Jump;
      case ActionType.Try:
        return $Try;
      case ActionType.With:
        return $With;
      default:
        return $rawAction as DocumentIoType<Action>;
    }
  }),
  tag: "action",
}));
