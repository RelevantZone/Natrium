// Cool method tools
export function createEnum<const T extends string>(enumerable: Array<T>) {
    const object = { } as Record<T, T>
    for (const Enum of enumerable) {
        object[Enum] = Enum
    }

    return object
}

export type getEnumType<T extends Record<string, string>> = T[keyof T];

// Cool Enums
