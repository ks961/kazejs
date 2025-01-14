
const NonBreakingSpace = "&nbsp;"

export function transformErrorStackToHtml(errorStack: string) {
    return errorStack.replaceAll("\n", `<br/>${NonBreakingSpace.repeat(4)}`);
}