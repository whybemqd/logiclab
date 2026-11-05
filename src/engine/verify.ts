import { evaluate } from "./simulate";
import { fail, isBit } from "./types";
import type { Bit, Circuit, ExpectedTable, Result } from "./types";

export const inputCombinations = (count: number): Bit[][] => {
  if (!Number.isInteger(count) || count < 0 || count > 6) return [];
  return Array.from({ length: 2 ** count }, (_, row) =>
    Array.from(
      { length: count },
      (_, col) => ((row >> (count - col - 1)) & 1) as Bit,
    ),
  );
};
export function validateExpected(
  circuit: Circuit,
  table: ExpectedTable,
): Result<ExpectedTable> {
  const inputs = circuit.components
    .filter((n) => n.kind === "INPUT")
    .map((n) => n.id);
  const outputs = circuit.components
    .filter((n) => n.kind === "OUTPUT")
    .map((n) => n.id);
  const sameIds = (a: string[], b: string[]) =>
    a.length === b.length &&
    new Set(b).size === b.length &&
    a.every((id) => b.includes(id));
  if (
    !outputs.length ||
    !sameIds(inputs, table.inputIds) ||
    !sameIds(outputs, table.outputIds)
  )
    return fail(
      "EXPECTED",
      "Expected table ต้องอ้างอิง Input และ Output ปัจจุบันทุกตัว (อย่างน้อย 1 Output)",
    );
  if (table.rows.length !== 2 ** inputs.length)
    return fail("EXPECTED", "Expected table ต้องมีทุก input combination");
  const seen = new Set<string>();
  for (const row of table.rows) {
    if (
      row.inputs.length !== inputs.length ||
      row.outputs.length !== outputs.length ||
      !row.inputs.every(isBit) ||
      !row.outputs.every(isBit)
    )
      return fail("EXPECTED", "Expected table ต้องระบุ 0 หรือ 1 ครบทุกช่อง");
    const key = row.inputs.join("");
    if (seen.has(key))
      return fail("EXPECTED", "Expected table มี input combination ซ้ำ");
    seen.add(key);
  }
  return { ok: true, value: table };
}
export interface VerificationRow {
  inputs: Bit[];
  expected?: Bit[];
  actual: Bit[];
  pass?: boolean;
}
export interface Verification {
  inputIds: string[];
  outputIds: string[];
  rows: VerificationRow[];
  passing: number;
  failing: number;
  compared: boolean;
}
export function verify(
  circuit: Circuit,
  expected?: ExpectedTable,
): Result<Verification> {
  const validation = evaluate(circuit);
  if (!validation.ok) return validation;
  if (expected) {
    const check = validateExpected(circuit, expected);
    if (!check.ok) return check;
  }
  const inputIds =
    expected?.inputIds ??
    circuit.components.filter((n) => n.kind === "INPUT").map((n) => n.id);
  const outputIds =
    expected?.outputIds ??
    circuit.components.filter((n) => n.kind === "OUTPUT").map((n) => n.id);
  if (!outputIds.length)
    return fail(
      "EXPECTED",
      "เพิ่ม Output indicator อย่างน้อยหนึ่งตัวก่อนสร้าง Truth table",
    );
  const rows: VerificationRow[] = [];
  const references = new Map(
    expected?.rows.map((row) => [row.inputs.join(""), row.outputs]) ?? [],
  );
  for (const inputs of inputCombinations(inputIds.length)) {
    const result = evaluate(
      circuit,
      Object.fromEntries(inputIds.map((id, i) => [id, inputs[i]])),
    );
    if (!result.ok) return result;
    const actual = outputIds.map((id) => result.value.outputs[id]);
    const reference = references.get(inputs.join(""));
    rows.push({
      inputs,
      actual,
      expected: reference,
      pass: reference
        ? actual.every((bit, i) => bit === reference[i])
        : undefined,
    });
  }
  return {
    ok: true,
    value: {
      inputIds,
      outputIds,
      rows,
      passing: rows.filter((r) => r.pass === true).length,
      failing: rows.filter((r) => r.pass === false).length,
      compared: !!expected,
    },
  };
}
