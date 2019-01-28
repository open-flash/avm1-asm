export class Avm1AsmEmitter {
  private readonly indentation: string;

  constructor(indentation: string = "  ") {
    this.indentation = indentation;
  }

  writeIndentation(): void {
    console.log(this.indentation);
  }
}
