# AVM1 Asm

`avm1-asm` is a small lib to convert from AVM1 bytes to a control-flow assembly
graph that can be printed.

Here is an example for the `hello-world` sample:

```
label_p0:
  push(0="Hello, World!");
  trace();
  next label_p19;
label_p19:
  end;
```

The end goal (not yet implemented) of this lib is to provide a low-level
representation for simple AVM1 transformations.
