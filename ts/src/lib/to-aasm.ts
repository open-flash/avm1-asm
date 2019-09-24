import { ActionType } from "avm1-tree/action-type";
import { CatchTargetType } from "avm1-tree/catch-targets/_type";
import { Cfg } from "avm1-tree/cfg";
import { CfgAction } from "avm1-tree/cfg-action";
import { CfgBlock } from "avm1-tree/cfg-block";
import { CfgBlockType } from "avm1-tree/cfg-block-type";
import { CfgLabel } from "avm1-tree/cfg-label";
import { Value } from "avm1-tree/value";
import { ValueType } from "avm1-tree/value-type";

export function toAasm(cfg: Cfg): string {
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
    for (const [i, block] of cfg.blocks.entries()) {
      const nextBlockLabel: CfgLabel | undefined = i < cfg.blocks.length - 1 ? cfg.blocks[i + 1].label : undefined;
      this.writeBlock(chunks, block, depth, nextBlockLabel);
    }
  }

  writeIndentation(chunks: string[], depth: number): void {
    for (let i: number = 0; i < depth; i++) {
      chunks.push(this.indentation);
    }
  }

  writeBlock(chunks: string[], block: CfgBlock, depth: number = 0, nextBlockLabel: CfgLabel | undefined = undefined) {
    this.writeIndentation(chunks, depth);
    chunks.push(`${block.label}:\n`);
    for (const action of block.actions) {
      this.writeAction(chunks, action, depth + 1);
    }
    switch (block.type) {
      case CfgBlockType.Error:
        this.writeIndentation(chunks, depth + 1);
        chunks.push("error;\n");
        break;
      case CfgBlockType.If:
        this.writeIndentation(chunks, depth + 1);
        chunks.push("if ? ");
        chunks.push(block.ifTrue !== null ? `next ${block.ifTrue}` : "end");
        chunks.push(" : ");
        chunks.push(block.ifFalse !== null ? `next ${block.ifFalse}` : "end");
        chunks.push(";\n");
        break;
      case CfgBlockType.Return:
        this.writeIndentation(chunks, depth + 1);
        chunks.push("return;\n");
        break;
      case CfgBlockType.Simple:
        if (block.next === null) {
          this.writeIndentation(chunks, depth + 1);
          chunks.push("end;\n");
        } else if (block.next !== nextBlockLabel) {
          this.writeIndentation(chunks, depth + 1);
          chunks.push(`next ${block.next};\n`);
        }
        break;
      case CfgBlockType.Throw:
        this.writeIndentation(chunks, depth + 1);
        chunks.push("throw;\n");
        break;
      case CfgBlockType.Try: {
        this.writeIndentation(chunks, depth + 1);
        chunks.push("try {\n");
        this.writeCfg(chunks, block.try, depth + 2);
        this.writeIndentation(chunks, depth + 1);
        chunks.push("}");
        if (block.catch !== undefined) {
          chunks.push(" catch(");
          switch (block.catchTarget.type) {
            case CatchTargetType.Register:
              chunks.push(`r:${block.catchTarget.target.toString(10)}`);
              break;
            case CatchTargetType.Variable:
              chunks.push("i:");
              writeStringLiteral(chunks, block.catchTarget.target);
              break;
            default:
              throw new Error("UnexpectedCatchTargetType");
          }
          chunks.push(") {\n");
          this.writeCfg(chunks, block.catch, depth + 2);
          this.writeIndentation(chunks, depth + 1);
          chunks.push("}");
        }
        if (block.finally !== undefined) {
          chunks.push(" finally {\n");
          this.writeCfg(chunks, block.finally, depth + 2);
          this.writeIndentation(chunks, depth + 1);
          chunks.push("}");
        }
        chunks.push("\n");
        break;
      }
      case CfgBlockType.WaitForFrame:
        this.writeIndentation(chunks, depth + 1);
        chunks.push("waitForFrame(");
        chunks.push(block.frame.toString(10));
        chunks.push(") ? ");
        chunks.push(block.ifNotLoaded !== null ? `next ${block.ifNotLoaded}` : "end");
        chunks.push(" : ");
        chunks.push(block.ifLoaded !== null ? `next ${block.ifLoaded}` : "end");
        chunks.push(";\n");
        break;
      case CfgBlockType.WaitForFrame2:
        this.writeIndentation(chunks, depth + 1);
        chunks.push("waitForFrame2 ? ");
        chunks.push(block.ifNotLoaded !== null ? `next ${block.ifNotLoaded}` : "end");
        chunks.push(" : ");
        chunks.push(block.ifLoaded !== null ? `next ${block.ifLoaded}` : "end");
        chunks.push(";\n");
        break;
      case CfgBlockType.With: {
        this.writeIndentation(chunks, depth + 1);
        chunks.push("with {\n");
        this.writeCfg(chunks, block.with, depth + 2);
        this.writeIndentation(chunks, depth + 1);
        chunks.push("}\n");
        break;
      }
      default:
        throw new Error("UnexpectedBlockType");
    }
  }

  writeAction(chunks: string[], action: CfgAction, depth: number = 0): void {
    this.writeIndentation(chunks, depth);
    writeActionHead(chunks, action);
    switch (action.action) {
      case ActionType.DefineFunction:
      case ActionType.DefineFunction2: {
        chunks.push(" {\n");
        this.writeCfg(chunks, action.body, depth + 1);
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
  [ActionType.Unknown, "unknown"],
  [ActionType.Add, "add"],
  [ActionType.Add2, "add2"],
  [ActionType.And, "and"],
  [ActionType.AsciiToChar, "asciiToChar"],
  [ActionType.BitAnd, "bitAnd"],
  [ActionType.BitLShift, "bitLShift"],
  [ActionType.BitOr, "bitOr"],
  [ActionType.BitRShift, "bitRShift"],
  [ActionType.BitURShift, "bitURShift"],
  [ActionType.BitXor, "bitXor"],
  [ActionType.Call, "call"],
  [ActionType.CallFunction, "callFunction"],
  [ActionType.CallMethod, "callMethod"],
  [ActionType.CastOp, "castOp"],
  [ActionType.CharToAscii, "charToAscii"],
  [ActionType.CloneSprite, "cloneSprite"],
  [ActionType.ConstantPool, "constantPool"],
  [ActionType.Decrement, "decrement"],
  [ActionType.DefineFunction, "defineFunction"],
  [ActionType.DefineFunction2, "defineFunction2"],
  [ActionType.DefineLocal, "defineLocal"],
  [ActionType.DefineLocal2, "defineLocal2"],
  [ActionType.Delete, "delete"],
  [ActionType.Delete2, "delete2"],
  [ActionType.Divide, "divide"],
  [ActionType.EndDrag, "endDrag"],
  [ActionType.Enumerate, "enumerate"],
  [ActionType.Enumerate2, "enumerate2"],
  [ActionType.Equals, "equals"],
  [ActionType.Equals2, "equals2"],
  [ActionType.Extends, "extends"],
  [ActionType.FsCommand2, "fsCommand2"],
  [ActionType.GetMember, "getMember"],
  [ActionType.GetProperty, "getProperty"],
  [ActionType.GetTime, "getTime"],
  [ActionType.GetUrl, "getUrl"],
  [ActionType.GetUrl2, "getUrl2"],
  [ActionType.GetVariable, "getVariable"],
  [ActionType.GotoFrame, "gotoFrame"],
  [ActionType.GotoFrame2, "gotoFrame2"],
  [ActionType.GotoLabel, "gotoLabel"],
  [ActionType.Greater, "greater"],
  [ActionType.If, "if"],
  [ActionType.ImplementsOp, "implementsOp"],
  [ActionType.Increment, "increment"],
  [ActionType.InitArray, "initArray"],
  [ActionType.InitObject, "initObject"],
  [ActionType.InstanceOf, "instanceOf"],
  [ActionType.Jump, "jump"],
  [ActionType.Less, "less"],
  [ActionType.Less2, "less2"],
  [ActionType.MbAsciiToChar, "mbAsciiToChar"],
  [ActionType.MbCharToAscii, "mbCharToAscii"],
  [ActionType.MbStringExtract, "mbStringExtract"],
  [ActionType.MbStringLength, "mbStringLength"],
  [ActionType.Modulo, "modulo"],
  [ActionType.Multiply, "multiply"],
  [ActionType.NewMethod, "newMethod"],
  [ActionType.NewObject, "newObject"],
  [ActionType.NextFrame, "nextFrame"],
  [ActionType.Not, "not"],
  [ActionType.Or, "or"],
  [ActionType.Play, "play"],
  [ActionType.Pop, "pop"],
  [ActionType.PreviousFrame, "previousFrame"],
  [ActionType.Push, "push"],
  [ActionType.PushDuplicate, "pushDuplicate"],
  [ActionType.RandomNumber, "randomNumber"],
  [ActionType.RemoveSprite, "removeSprite"],
  [ActionType.Return, "return"],
  [ActionType.SetMember, "setMember"],
  [ActionType.SetProperty, "setProperty"],
  [ActionType.SetTarget, "setTarget"],
  [ActionType.SetTarget2, "setTarget2"],
  [ActionType.SetVariable, "setVariable"],
  [ActionType.StackSwap, "stackSwap"],
  [ActionType.StartDrag, "startDrag"],
  [ActionType.Stop, "stop"],
  [ActionType.StopSounds, "stopSounds"],
  [ActionType.StoreRegister, "storeRegister"],
  [ActionType.StrictEquals, "strictEquals"],
  [ActionType.StrictMode, "strictMode"],
  [ActionType.StringAdd, "stringAdd"],
  [ActionType.StringEquals, "stringEquals"],
  [ActionType.StringExtract, "stringExtract"],
  [ActionType.StringGreater, "stringGreater"],
  [ActionType.StringLength, "stringLength"],
  [ActionType.StringLess, "stringLess"],
  [ActionType.Subtract, "subtract"],
  [ActionType.TargetPath, "targetPath"],
  [ActionType.Throw, "throw"],
  [ActionType.ToggleQuality, "toggleQuality"],
  [ActionType.ToInteger, "toInteger"],
  [ActionType.ToNumber, "toNumber"],
  [ActionType.ToString, "toString"],
  [ActionType.Trace, "trace"],
  [ActionType.Try, "try"],
  [ActionType.TypeOf, "typeOf"],
  [ActionType.WaitForFrame, "waitForFrame"],
  [ActionType.WaitForFrame2, "waitForFrame2"],
  [ActionType.With, "with"],
]);

function writeActionHead(chunks: string[], action: CfgAction): void {
  const name: string | undefined = ACTION_TYPE_TO_NAME.get(action.action);
  if (name === undefined) {
    throw new Error(`UnexpectedActionType: ${JSON.stringify(action)}`);
  }
  chunks.push(`${name}(`);
  writeActionArguments(chunks, action);
  chunks.push(")");
}

function writeActionArguments(chunks: string[], action: CfgAction): void {
  switch (action.action) {
    case ActionType.ConstantPool: {
      for (const [i, value] of action.constantPool.entries()) {
        if (i > 0) {
          chunks.push(", ");
        }
        // TODO: Remove index
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
        chunks.push("i:");
        writeStringLiteral(chunks, parameter);
      }
      chunks.push("]");
      break;
    }
    case ActionType.DefineFunction2: {
      chunks.push("name=");
      writeStringLiteral(chunks, action.name);
      chunks.push(", preloadParent=");
      writeBooleanLiteral(chunks, action.preloadParent);
      chunks.push(", preloadRoot=");
      writeBooleanLiteral(chunks, action.preloadRoot);
      chunks.push(", suppressSuper=");
      writeBooleanLiteral(chunks, action.suppressSuper);
      chunks.push(", preloadSuper=");
      writeBooleanLiteral(chunks, action.preloadSuper);
      chunks.push(", suppressArguments=");
      writeBooleanLiteral(chunks, action.suppressArguments);
      chunks.push(", preloadArguments=");
      writeBooleanLiteral(chunks, action.preloadArguments);
      chunks.push(", suppressThis=");
      writeBooleanLiteral(chunks, action.suppressThis);
      chunks.push(", preloadThis=");
      writeBooleanLiteral(chunks, action.preloadThis);
      chunks.push(", preloadGlobal=");
      writeBooleanLiteral(chunks, action.preloadGlobal);
      chunks.push(`, registerCount=${action.registerCount.toString(10)}`);

      chunks.push(", parameters=[");
      let first: boolean = true;
      for (const parameter of action.parameters) {
        if (first) {
          first = false;
        } else {
          chunks.push(",");
        }
        chunks.push(`r:${parameter.register}=`);
        chunks.push("i:");
        writeStringLiteral(chunks, parameter.name);
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
    case ActionType.Push: {
      for (const [i, value] of action.values.entries()) {
        if (i > 0) {
          chunks.push(", ");
        }
        // TODO: Remove index
        chunks.push(`${i.toString(10)}=`);
        writeAvm1Value(chunks, value);
      }
      break;
    }
    case ActionType.GotoLabel: {
      writeStringLiteral(chunks, action.label);
      break;
    }
    case ActionType.StoreRegister: {
      chunks.push(`r:${action.register}`);
      break;
    }
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

export function writeBooleanLiteral(chunks: string[], value: boolean): void {
  chunks.push(value ? "true" : "false");
}
