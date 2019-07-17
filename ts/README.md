# AVM1 Asm

`avm1-asm` is a small lib to convert from AVM1 bytes to a control-flow assembly
graph that can be printed.

Here is an example for the `hello-world` sample:

```
l0_0:
  push(0="Hello, World!");
  trace();
  end;
```

This lib allows to convert between AVM1 bytes and a control flow graph (CFG).
