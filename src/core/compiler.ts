//
// This compiler namespace works to
// parse bdscript lang input to
// readable ast
// and as a transpiler to js

// TODO:
// Add escape syntax functionality

class NatriumCompiler {
    public static readonly NatriumCompiler = NatriumCompiler
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

    public readonly Syntax = structuredClone(NatriumCompiler.Syntax)
    public readonly Config = structuredClone(NatriumCompiler.Config)

    public parse(x: string) {
        const Syntax = this.Syntax
        const nodes = <any[]>[]
        let position = 0

        while (position < x.length) {
            const char = x[position]

            if (char === Syntax['Script']) {
                const indent = this.readIdent(x.slice(position))
            }

            const string = this.readString(x.slice(position), false)
            position += string.length -1
            nodes.push({ type: 'string', value: string })

        }
       return this.readString(x, false)
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
        
            if (postionEndMarker === -1) postionEndMarker = markerPosition
            if (markerPosition === -1) continue;
            if (markerPosition < postionEndMarker) postionEndMarker = markerPosition
        }
    
        if (postionEndMarker === -1) return ''
    
        return x.slice(0, postionEndMarker)
    }

    public readIdent(x: string) {
        const Syntax = this.Syntax

        if (! x.startsWith(Syntax['Script']))
            return

        const string = this.readString(x.slice(1), true)
        const ident = string.slice(0, string.indexOf(' '))
        const startingArgIndex = ident.length

        if (x[startingArgIndex] === Syntax['StartingArg']) {
            
        }

        return {
            type: 'script',
            name: ident,
            inside: false
        }
    }

    public unwrap(x: string) {
        
    }

    /**
     * Returns the length and if the argument is closed
     * @param x 
     * @returns [The end position, is argument closed correctly]
     */
    public getUnwrapLength(x: string) {
        const Syntax = this.Syntax
        if (! x.startsWith(Syntax['StartingArg']))
            return [-1, false]

        let countStartArgs = 1
        let countEndArgs = 0
        let position = 0

        while (countStartArgs > countEndArgs && position < x.length) {
            const startIndex = x.indexOf(Syntax['StartingArg'], position)
            const endIndex = x.indexOf(Syntax['EndingArg'], position)

            // No more close syntax to be found
            if (endIndex === -1) { position = x.length; break; }

            // The end index is the shortest to position
            // than start index
            if (startIndex === -1 || endIndex < startIndex) {
                countEndArgs += 1
                position = endIndex
            } else {
                // The start index is shortest than end index
                countStartArgs += 1
                position = startIndex
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

const compiler = new NatriumCompiler()
export {
    compiler,
    NatriumCompiler
}