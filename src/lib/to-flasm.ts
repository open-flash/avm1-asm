import { ActionType, CatchTargetType, Value, ValueType } from "avm1-tree";
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

  writeCfg(chunks: string[], cfg: Cfg, depth: number = 0): void {
    for (const block of cfg.blocks) {
      this.writeBlock(chunks, block, depth);
    }
  }

  writeIndentation(chunks: string[], depth: number): void {
    for (let i: number = 0; i < depth; i++) {
      chunks.push(this.indentation);
    }
  }

  writeBlock(chunks: string[], block: Block, depth: number = 0) {
    this.writeIndentation(chunks, depth);
    chunks.push(`${block.label}:\n`);
    for (const action of block.actions) {
      this.writeAction(chunks, action, depth + 1);
    }
    const next: Label | undefined = block.next;
    if (next === undefined) {
      this.writeIndentation(chunks, depth + 1);
      chunks.push("end;\n");
    } else {
      this.writeIndentation(chunks, depth + 1);
      chunks.push(`next ${next};\n`);
    }
  }

  writeAction(chunks: string[], action: Action, depth: number = 0): void {
    this.writeIndentation(chunks, depth);
    writeActionHead(chunks, action);
    switch (action.action) {
      case ActionType.DefineFunction: {
        chunks.push(" {\n");
        this.writeCfg(chunks, action.body, depth + 1);
        this.writeIndentation(chunks, depth);
        chunks.push("}");
        break;
      }
      case ActionType.Try: {
        chunks.push(" {\n");
        this.writeCfg(chunks, action.try, depth + 1);
        this.writeIndentation(chunks, depth);
        chunks.push("}");
        if (action.catch !== undefined) {
          chunks.push(" catch {\n");
          this.writeCfg(chunks, action.catch, depth + 1);
          this.writeIndentation(chunks, depth);
          chunks.push("}");
        }
        if (action.finally !== undefined) {
          chunks.push(" finally {\n");
          this.writeCfg(chunks, action.finally, depth + 1);
          this.writeIndentation(chunks, depth);
          chunks.push("}");
        }
        break;
      }
      case ActionType.With: {
        chunks.push(" {\n");
        this.writeCfg(chunks, action.with, depth + 1);
        this.writeIndentation(chunks, depth);
        chunks.push("}");
        break;
      }
      default:
        break;
    }
    chunks.push(";\n");
  }
}

const ACTION_TYPE_TO_NAME: ReadonlyMap<ActionType, string> = new Map([
  [ActionType.BitURShift, "bitURShift"],
  [ActionType.Call, "call"],
  [ActionType.CallFunction, "callFunction"],
  [ActionType.ConstantPool, "constantPool"],
  [ActionType.DefineFunction, "defineFunction"],
  [ActionType.DefineFunction2, "defineFunction2"],
  [ActionType.GetUrl, "getUrl"],
  [ActionType.GetVariable, "getVariable"],
  [ActionType.InitObject, "initObject"],
  [ActionType.Jump, "jump"],
  [ActionType.Play, "play"],
  [ActionType.Pop, "pop"],
  [ActionType.Push, "push"],
  [ActionType.Throw, "throw"],
  [ActionType.Trace, "trace"],
  [ActionType.Try, "try"],
  [ActionType.With, "with"],
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
    case ActionType.ConstantPool: {
      for (const [i, value] of action.constantPool.entries()) {
        if (i > 0) {
          chunks.push(", ");
        }
        chunks.push(`${i.toString(10)}=`);
        writeStringLiteral(chunks, value);
      }
      break;
    }
    case ActionType.DefineFunction: {
      chunks.push("name=");
      writeStringLiteral(chunks, action.name);
      chunks.push(", parameters=[");
      let first: boolean = true;
      for (const parameter of action.parameters) {
        if (first) {
          first = false;
        } else {
          chunks.push(",");
        }
        writeStringLiteral(chunks, parameter);
      }
      chunks.push("]");
      break;
    }
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
    case ActionType.Push: {
      for (const [i, value] of action.values.entries()) {
        if (i > 0) {
          chunks.push(", ");
        }
        chunks.push(`${i.toString(10)}=`);
        writeAvm1Value(chunks, value);
      }
      break;
    }
    case ActionType.Try:
      chunks.push("catchTarget=");
      switch (action.catchTarget.type) {
        case CatchTargetType.Register:
          chunks.push(`r:${action.catchTarget.register.toString(10)}`);
          break;
        case CatchTargetType.Variable:
          chunks.push("i:");
          writeStringLiteral(chunks, action.catchTarget.variable);
          break;
        default:
          break;
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
    case ValueType.Constant:
      chunks.push(`c:${value.value.toString(10)}`);
      break;
    case ValueType.Float32:
      chunks.push(`${value.value.toString(10)}f32`);
      break;
    case ValueType.Float64:
      chunks.push(`${value.value.toString(10)}f64`);
      break;
    case ValueType.Sint32:
      chunks.push(`${value.value.toString(10)}i32`);
      break;
    case ValueType.String:
      writeStringLiteral(chunks, value.value);
      break;
    case ValueType.Null:
      chunks.push("null");
      break;
    case ValueType.Register:
      chunks.push(`r:${value.value.toString(10)}`);
      break;
    case ValueType.Undefined:
      chunks.push("undefined");
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
