import { inspect } from "util";
import { compiler } from "./core/compiler";

const input = 'Hello world, this communication channel is 25# based $get[data.var]'
const parsed = compiler.parse(input)

console.log(inspect(parsed, false, null, true))