
'use server';

import { parse } from 'csv-parse/sync';
import { stringify } from 'csv-stringify/sync';

export function parseCsv<T extends object>(csvData: string, columns: (keyof T)[]): T[] {
  return parse(csvData, {
    columns: columns as string[],
    skip_empty_lines: true,
  });
}

export function stringifyCsv<T extends object>(data: T[], columns: (keyof T)[]): string {
    const header = columns.map(c => String(c));
    return stringify(data, { 
        header: true, 
        columns: header
    });
}
