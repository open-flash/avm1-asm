import { Avm1Parser } from "avm1-parser";
import { Action as RawAction, ActionType } from "avm1-tree";
import { Return, Throw } from "avm1-tree/actions";
import { UintSize } from "semantic-types";
import { Action } from "./action";
import { Block } from "./block";
import { Cfg } from "./cfg";

export function fromBytes(avm1: Uint8Array): Cfg {
  const avm1Parser: Avm1Parser = new Avm1Parser(avm1);
  return innerFromBytes(avm1Parser, 0, avm1.length);
}

interface ParsedAction {
  action: RawAction;
  endOffset: UintSize;
}

function innerFromBytes(parser: Avm1Parser, sectionStart: UintSize, sectionEnd: UintSize): Cfg {
  const offsetToAction: Map<UintSize, ParsedAction> = new Map();
  const underflows: Set<UintSize> = new Set();
  const overflows: Set<UintSize> = new Set();
  const openSet: UintSize[] = [sectionStart];
  while (openSet.length > 0) {
    const curOffset: UintSize = openSet.pop()!;
    if (curOffset < sectionStart || curOffset >= sectionEnd) {
      (curOffset < sectionStart ? underflows : overflows).add(curOffset);
      break;
    }
    const action: RawAction | undefined = parser.readAt(curOffset);
    if (action === undefined) {
      // End of Actions
      overflows.add(curOffset);
      break;
    }
    const endOffset: UintSize = parser.getBytePos();
    if (endOffset <= curOffset) {
      throw new Error("ExpectedBytePos to advance");
    }
    offsetToAction.set(curOffset, {action, endOffset});
    const nextOffsets: UintSize[] = [];
    switch (action.action) {
      case ActionType.If: {
        nextOffsets.push(endOffset + action.offset, endOffset);
        break;
      }
      case ActionType.Jump: {
        nextOffsets.push(endOffset + action.offset);
        break;
      }
      default: {
        if (!isFinalAction(action)) {
          nextOffsets.push(endOffset);
        }
        break;
      }
    }
    for (const nextOffset of nextOffsets) {
      if (!offsetToAction.has(nextOffset)) {
        openSet.push(nextOffset);
      }
    }
  }
  return toCfg(offsetToAction, underflows, overflows);
}

function toCfg(
  offsetToAction: ReadonlyMap<UintSize, ParsedAction>,
  underflows: ReadonlySet<UintSize>,
  overflows: ReadonlySet<UintSize>,
): Cfg {
  const unlabelledOffsets: ReadonlySet<UintSize> = getUnlabelledOffset(offsetToAction);
  const labelledOffsets: UintSize[] = [...underflows, ...overflows];
  for (const offset of offsetToAction.keys()) {
    if (!unlabelledOffsets.has(offset)) {
      labelledOffsets.push(offset);
    }
  }
  labelledOffsets.sort((a, b) => a - b);
  const blocks: Block[] = [];
  for (const [idx, labelledOffset] of labelledOffsets.entries()) {
    const label: string = offsetToLabel(labelledOffset);
    const actions: Action[] = [];
    let next: string | undefined;
    if (underflows.has(labelledOffset)) {
      next = offsetToLabel(labelledOffsets[idx + 1]);
    } else if (!overflows.has(labelledOffset)) {
      let offset: UintSize = labelledOffset;
      do {
        const parsed: ParsedAction | undefined = offsetToAction.get(offset);
        if (parsed === undefined) {
          throw new Error("AssertionError: Expected `parsed` to be defined");
        }
        let action: Action;
        switch (parsed.action.action) {
          case ActionType.DefineFunction: {
            throw new Error("NotImplemented: DefineFunction");
          }
          case ActionType.DefineFunction2: {
            throw new Error("NotImplemented: DefineFunction2");
          }
          case ActionType.If: {
            action = {action: ActionType.If, target: offsetToLabel(parsed.endOffset + parsed.action.offset)};
            break;
          }
          case ActionType.Jump: {
            action = {action: ActionType.Jump, target: offsetToLabel(parsed.endOffset + parsed.action.offset)};
            break;
          }
          case ActionType.Try: {
            throw new Error("NotImplemented: Try");
          }
          case ActionType.With: {
            throw new Error("NotImplemented: With");
          }
          default: {
            action = parsed.action;
            break;
          }
        }
        actions.push(action);
        if (parsed.action.action === ActionType.Jump || isFinalAction(parsed.action)) {
          next = undefined;
          break;
        } else {
          offset = parsed.endOffset;
          next = offsetToLabel(offset);
        }
      } while (unlabelledOffsets.has(offset));
    }
    blocks.push({label, actions, next});
  }

  return {blocks};

  function offsetToLabel(offset: UintSize): string {
    return `label_${offset < 0 ? "n" : "p"}${Math.abs(offset).toString(10)}`;
  }
}

function getUnlabelledOffset(offsetToAction: ReadonlyMap<UintSize, ParsedAction>): Set<UintSize> {
  // For each offset, number of actions ending at this offset
  const endOffsetCounts: Map<UintSize, UintSize> = new Map();
  for (const {action, endOffset} of offsetToAction.values()) {
    if (isFinalAction(action)) {
      continue;
    }
    let count: UintSize | undefined = endOffsetCounts.get(endOffset);
    if (count === undefined) {
      count = 0;
    }
    endOffsetCounts.set(endOffset, count + 1);
  }
  // Offsets that do not need a label: they immediately follow another simple action.
  // They are offset corresponding to a signle end and which are not jump or branchIfTrue targets
  const unlabelledOffsets: Set<UintSize> = new Set();
  for (const [endOffset, count] of endOffsetCounts) {
    if (count === 1 && offsetToAction.has(endOffset)) {
      unlabelledOffsets.add(endOffset);
    }
  }
  for (const {action, endOffset} of offsetToAction.values()) {
    if (action.action === ActionType.If || action.action === ActionType.Jump) {
      unlabelledOffsets.delete(endOffset + action.offset);
    }
  }
  return unlabelledOffsets;
}

// Checks if the provided actions ends the control flow
function isFinalAction(action: RawAction): action is Return | Throw {
  return action.action === ActionType.Return || action.action === ActionType.Throw;
}
