export type Bit = 0 | 1;
export const KINDS = ["INPUT", "AND", "OR", "NOT", "XOR", "OUTPUT"] as const;
export type Kind = (typeof KINDS)[number];
export const LIMITS = {
  components: 48,
  connections: 96,
  inputs: 6,
  outputs: 8,
  bytes: 262144,
} as const;
export const ARITY: Record<Kind, number> = {
  INPUT: 0,
  AND: 2,
  OR: 2,
  NOT: 1,
  XOR: 2,
  OUTPUT: 1,
};
export interface Component {
  id: string;
  kind: Kind;
  label: string;
  position: { x: number; y: number };
  value?: Bit;
}
export interface Connection {
  id: string;
  source: string;
  target: string;
  port: number;
}
export interface Circuit {
  components: Component[];
  connections: Connection[];
}
export interface ExpectedTable {
  inputIds: string[];
  outputIds: string[];
  rows: { inputs: Bit[]; outputs: Bit[] }[];
}
export interface CircuitDocument {
  version: 1;
  title: string;
  circuit: Circuit;
  expected?: ExpectedTable;
}
export type ErrorCode =
  | "LIMIT"
  | "SHAPE"
  | "DUPLICATE"
  | "CONNECTION"
  | "MULTIPLE_DRIVERS"
  | "MISSING_INPUT"
  | "CYCLE"
  | "ASSIGNMENT"
  | "EXPECTED";
export interface Issue {
  code: ErrorCode;
  message: string;
  componentId?: string;
}
export type Result<T> = { ok: true; value: T } | { ok: false; errors: Issue[] };
export const fail = (
  code: ErrorCode,
  message: string,
  componentId?: string,
): Result<never> => ({ ok: false, errors: [{ code, message, componentId }] });
export const isBit = (value: unknown): value is Bit =>
  value === 0 || value === 1;
