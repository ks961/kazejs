import { SecId } from "@d3vtool/secid";

export function generateId(length?: number, alphabets?: string) {
    return SecId.generate(length, alphabets)
}