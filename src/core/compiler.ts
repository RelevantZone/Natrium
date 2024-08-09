//
// This compiler namespace works to
// parse bdscript lang input to
// readable ast
// and as a transpiler to js

import { inspect } from "util";
import { createEnum, getEnumType } from "../enums";

// TODO:
// Add escape syntax functionality

// Runtime values
export const CompilerMode = createEnum(['Relaxed', 'Strict'])
export type CompilerMode = getEnumType<typeof CompilerMode>

export type CompilerResult = {
    // Compiler states
    mode: CompilerMode
    errors: []
    functions: []

    // Compiler data input and external stuff
    content: string
}

export const NodeType = createEnum(['String', 'Ident', 'Argument', 'Program', 'EOF'])
export type NodeType = getEnumType<typeof NodeType>


// Structures
class NatriumNode {
    public readonly PositionInfo = NatriumCompiler.PositionInfo.new(0)

    public readonly type: NodeType
    public readonly content: string
    public readonly nodes: NatriumNode[] = []
    protected constructor(type: NodeType, content: string) {
        this.type = type
        this.content = content

        this.PositionInfo.update(content)
    }

    public static new(type: NodeType, content: string) {
        return new NatriumNode(type, content)
    }
}

export class NatriumCompiler {
    // Compiler Configuration
    public static readonly Syntax = 
    {
        Script: "$",
        StartingArg: "[",
        EndingArg: "]",
        ArgSeparator: ";",
        Escape: '\\'
    }
    public static readonly Config =
    {
        AllowCodeEscaping: true
    }

    // Compiler structures
    public static readonly PositionInfo = class PositionInfo {
        public contentIndex = 0
        public contentLength = 0
        public contentLines = 0
        public contentInLine = 1
        protected constructor(position: number) {
            this.contentIndex = position
        }

        public update(content: string) {
            const lineMatches = (content.match(/\n/g) || [])
            this.contentLength = content.length
            this.contentLines = lineMatches.length
            
            return this
        }

        public static new(position: number): PositionInfo
        public static new(text: string, position: number): PositionInfo
        public static new(raw: number | string, position: number = 0) {
            switch (typeof raw) {
                case 'number': return new PositionInfo(raw);
                case 'string': return new PositionInfo(position).update(raw);
                default: return new PositionInfo(position);
            }
        }
    }

    // Instance configuration
    public readonly Syntax = structuredClone(NatriumCompiler.Syntax)
    public readonly Config = structuredClone(NatriumCompiler.Config)

    public parse(x: string) {
        const Syntax = this.Syntax
        const nodes = <any[]>[]
        let position = 0

        while (position < x.length) {
            const char = x[position]

            if (char === '') {
                break;
            }

            if (char === Syntax['Script']) {
                const ident = this.readIdent(x.slice(position));
                position += ident.name.length
                nodes.push(ident)

                continue;
            }

            const string = this.readString(x.slice(position), false)
            position += string.length
            nodes.push({ type: NodeType.String, value: string })
        }

       return nodes
    }

    public parseAtom(x: string, parentNode = NatriumNode.new(NodeType.Program, '\0')) {
        const Syntax = this.Syntax
        const State = {
            position: 0,
            line: 1
        }

        const CurrentChar = () => x[State.position]
        const IsEOF = () => !(State.position < x.length)

        while (! IsEOF()) {
            const char = CurrentChar();

            switch (char) {
                case '': break; // Guard 2
                case Syntax['Script']: {
                    // $get -> because readString marks $ as stopindicator
                    const string = this.readString(x.slice(State.position + 1), true)
                    const whitespaceIndex = string.indexOf(' ')
                    const identifier = "$" + string.slice(0, whitespaceIndex < 0 ? undefined : whitespaceIndex)
                    const startingArgIndex = identifier.length

                    const Node = NatriumNode.new(NodeType.Ident, identifier)
                    Node.PositionInfo.contentIndex = State.position
                    Node.PositionInfo.contentInLine = State.line
                    State.position += Node.content.length
                    State.line += Node.PositionInfo.contentLines

                    if (x[startingArgIndex] === Syntax['StartingArg']) {
                        
                    }

                    parentNode.nodes.push(Node)
                }
                break;
                case Syntax['ArgSeparator']: {
                    if (parentNode.type === NodeType.Argument) {
                        // eeeee
                        const Node = NatriumNode.new(NodeType.Argument, x)
                        Node.PositionInfo.contentIndex = State.position
                        Node.PositionInfo.contentInLine = State.line
                        State.position += Node.content.length
                        State.line += Node.PositionInfo.contentLines

                        parentNode.nodes.push(Node)
                        break
                    }
                }
                default: {
                    const includesArgSyntax = parentNode.type === NodeType.Argument
                    const Node = NatriumNode.new(NodeType.String, this.readString(x.slice(State.position), includesArgSyntax));
                    Node.PositionInfo.contentIndex = State.position
                    Node.PositionInfo.contentInLine = State.line
                    State.position += Node.content.length  
                    State.line += Node.PositionInfo.contentLines
                    
                    parentNode.nodes.push(Node)
                }
            }
        }

        return parentNode
    }

    public readString(x: string, includesArgSyntax = true) {
        const Syntax = this.Syntax
        const stopIndicators = [ Syntax['Script'] ]
        let postionEndMarker = -1
    
        if (includesArgSyntax)
                stopIndicators.push(Syntax['StartingArg'], Syntax['EndingArg'], Syntax['ArgSeparator'])
    
        // TODO:
        // Figure out for escape syntax
        for (const indicator of stopIndicators) {
            let markerPosition = x.indexOf(indicator)
        
            if (markerPosition === -1) continue;
            if (postionEndMarker === -1) postionEndMarker = markerPosition
            if (markerPosition < postionEndMarker) postionEndMarker = markerPosition
        }
    
        if (postionEndMarker === -1) return x
    
        return x.slice(0, postionEndMarker)
    }

    public readIdent(x: string) {
        const Syntax = this.Syntax

        // $get -> because readString marks $ as stopindicator
        const string = this.readString(x.slice(1), true)
        const whitespaceIndex = string.indexOf(' ')
        const ident = "$" + string.slice(0, whitespaceIndex < 0 ? undefined : whitespaceIndex)
        const startingArgIndex = ident.length

        if (x[startingArgIndex] === Syntax['StartingArg']) {
            console.log(this.unpack(x.slice(startingArgIndex)))

            return {
                type: NodeType.Ident,
                name: ident,
                inside: true
            }
        }

        return {
            type: NodeType.Ident,
            name: ident,
            inside: false
        }
    }

    public unpack(x: string) {
        const [endPosition, isClosed] = this.getUnpackLength(x)
        const packed = x.slice(0, endPosition)
        const inside = packed.slice(1, isClosed ? endPosition - 1 : endPosition)

        // Remaking parse because im bored and lazy
        const args = []

        return inspect(inside, false, null, true)
    }

    /**
     * Returns the length and if the argument is closed
     * @param x 
     * @returns [The end position, is argument closed correctly]
     */
    public getUnpackLength(x: string): [number, boolean] {
        const Syntax = this.Syntax
        if (! x.startsWith(Syntax['StartingArg']))
            return [-1, false]

        let countStartArgs = 1
        let countEndArgs = 0
        let position = 1

        while (countStartArgs > countEndArgs && position < x.length) {
            const startIndex = x.indexOf(Syntax['StartingArg'], position)
            const endIndex = x.indexOf(Syntax['EndingArg'], position)

            // No more close syntax to be found
            if (endIndex === -1) { position = x.length; break; }
            // The end index is the shortest to position
            // than start index
            if (startIndex === -1 || endIndex < startIndex) {
                countEndArgs += 1
                position = endIndex + 1
            } else {
                // The start index is shortest than end index
                countStartArgs += 1
                position = startIndex + 1
            }
        }

        if (countStartArgs === countEndArgs) {
            // The start and end length is the same
            // means the argument is closed correctly
            return [position, true]
        }
        // It is not closed
        return [position, false]
    }
}

export const compiler = new NatriumCompiler()