import { inspect } from "util";
import { compiler } from "./src/core/compiler";

const input = 'Hello world, this communication channel is 25# based $get[$get[data;aeee] '
const parsed = compiler.parseAtom(input)

console.log(inspect(parsed, false, null, true))