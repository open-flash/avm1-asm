import { ActionType, Value, ValueType } from "avm1-tree";
import { Action } from "./action";
import { Block } from "./block";
import { Cfg } from "./cfg";
import { Label } from "./label";

export function toFlasm(cfg: Cfg): string {
  const chunks: string[] = [];
  const writer: CfgWriter = new CfgWriter();
  writer.writeCfg(chunks, cfg);
  return chunks.join("");
}

class CfgWriter {
  public readonly indentation: string;

  constructor() {
    this.indentation = "  ";
  }

  writeCfg(chunks: string[], cfg: Cfg): void {
    for (const block of cfg.blocks) {
      this.writeBlock(chunks, block);
    }
  }

  writeIndentation(chunks: string[], depth: number): void {
    for (let i: number = 0; i < depth; i++) {
      chunks.push(this.indentation);
    }
  }

  writeBlock(chunks: string[], block: Block) {
    this.writeIndentation(chunks, 0);
    chunks.push(`${block.label}:\n`);
    for (const action of block.actions) {
      this.writeAction(chunks, action);
    }
    const next: Label | undefined = block.next;
    if (next === undefined) {
      this.writeIndentation(chunks, 1);
      chunks.push("end;\n");
    } else {
      this.writeIndentation(chunks, 1);
      chunks.push(`next ${next};\n`);
    }
  }

  writeAction(chunks: string[], action: Action): void {
    this.writeIndentation(chunks, 1);
    writeActionHead(chunks, action);
    chunks.push(";\n");
  }
}

const ACTION_TYPE_TO_NAME: ReadonlyMap<ActionType, string> = new Map([
  [ActionType.GetUrl, "getUrl"],
  [ActionType.Jump, "jump"],
  [ActionType.Push, "push"],
  [ActionType.Trace, "trace"],
]);

function writeActionHead(chunks: string[], action: Action): void {
  const name: string | undefined = ACTION_TYPE_TO_NAME.get(action.action);
  if (name === undefined) {
    throw new Error(`UnexpectedActionType: ${JSON.stringify(action)}`);
  }
  chunks.push(`${name}(`);
  writeActionArguments(chunks, action);
  chunks.push(")");
}

function writeActionArguments(chunks: string[], action: Action): void {
  switch (action.action) {
    case ActionType.GetUrl:
      chunks.push("url=");
      writeStringLiteral(chunks, action.url);
      chunks.push(", target=");
      writeStringLiteral(chunks, action.target);
      break;
    case ActionType.If:
      chunks.push(`target=${action.target}`);
      break;
    case ActionType.Jump:
      chunks.push(`target=${action.target}`);
      break;
    case ActionType.Push:
      let first: boolean = true;
      for (const [i, value] of action.values.entries()) {
        if (first) {
          first = false;
        } else {
          chunks.push(", ");
        }
        chunks.push(`${i.toString(10)}=`);
        writeAvm1Value(chunks, value);
      }
      break;
    default:
      break;
  }
}

function writeAvm1Value(chunks: string[], value: Value) {
  switch (value.type) {
    case ValueType.Boolean:
      chunks.push(value.value ? "true" : "false");
      break;
    case ValueType.Sint32:
      chunks.push(`${value.value.toString(10)}i32`);
      break;
    case ValueType.String:
      writeStringLiteral(chunks, value.value);
      break;
    default:
      throw new Error(`UnexpectedValueType: ${JSON.stringify(value)}`);
  }
}

export function writeStringLiteral(chunks: string[], value: string): void {
  chunks.push("\"");
  for (const cp of [...value]) {
    switch (cp) {
      case "\\":
        chunks.push("\\\\");
        break;
      case "\"":
        chunks.push("\\\"");
        break;
      case "\n":
        chunks.push("\\n");
        break;
      default:
        chunks.push(cp);
        break;
    }
  }
  chunks.push("\"");
}
