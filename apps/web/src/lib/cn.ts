export type ClassValue = string | number | false | null | undefined | ClassValue[];

/** 极简 classNames 合并（避免为一个函数引入额外依赖） */
export function cn(...values: ClassValue[]): string {
  const out: string[] = [];

  for (const value of values) {
    if (!value) continue;
    if (Array.isArray(value)) {
      const nested = cn(...value);
      if (nested) out.push(nested);
    } else {
      out.push(String(value));
    }
  }

  return out.join(' ');
}
