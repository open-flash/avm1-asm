import { Ucs2StringType } from "kryo/types/ucs2-string";

export type Label = string;

export const $Label: Ucs2StringType = new Ucs2StringType({maxLength: Infinity});
