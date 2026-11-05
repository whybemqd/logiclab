import { describe, expect, it } from "vitest";
import { example, HALF_EXPECTED } from "../src/engine/examples";
import { evaluate } from "../src/engine/simulate";
import { verify } from "../src/engine/verify";

describe("half-adder first milestone", () => {
  for (const row of HALF_EXPECTED.rows)
    it(`A=${row.inputs[0]}, B=${row.inputs[1]}`, () => {
      const result = evaluate(example("half").circuit, {
        a: row.inputs[0],
        b: row.inputs[1],
      });
      expect(result.ok).toBe(true);
      if (result.ok)
        expect([result.value.outputs.sum, result.value.outputs.carry]).toEqual(
          row.outputs,
        );
    });
  it("compares all four cases against the independent reference", () => {
    const doc = example("half");
    const result = verify(doc.circuit, doc.expected);
    expect(result.ok && result.value.passing).toBe(4);
    expect(result.ok && result.value.failing).toBe(0);
  });
});
