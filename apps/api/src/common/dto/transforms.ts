import { Transform } from 'class-transformer';

/** 'true' | true | '1' → true；其余 → false；undefined 保持 undefined */
export const ToBoolean = (): PropertyDecorator =>
  Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return undefined;
    if (typeof value === 'boolean') return value;
    return value === 'true' || value === '1' || value === 1;
  });

/** 'a,b,c' 或 ['a','b'] → string[]（去空、去重、trim） */
export const ToStringArray = (): PropertyDecorator =>
  Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return undefined;
    const raw = Array.isArray(value) ? value : String(value).split(',');
    const list = raw.map((item) => String(item).trim()).filter((item) => item.length > 0);
    return list.length > 0 ? Array.from(new Set(list)) : undefined;
  });

/** 保留原始值，便于按字符串校验 ISO 8601 */
export const ToTrimmedString = (): PropertyDecorator =>
  Transform(({ value }) => (typeof value === 'string' ? value.trim() : value));
