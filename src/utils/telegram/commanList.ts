export const commandList = ["/hello", "/gpa"] as const;
export type CommandText = (typeof commandList)[number];
