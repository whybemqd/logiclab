import type {
  CircuitDocument,
  Component,
  Connection,
  ExpectedTable,
  Kind,
} from "./types";

const n = (
  id: string,
  kind: Kind,
  label: string,
  x: number,
  y: number,
): Component => ({
  id,
  kind,
  label,
  position: { x, y },
  ...(kind === "INPUT" ? { value: 0 as const } : {}),
});
const e = (
  id: string,
  source: string,
  target: string,
  port: number,
): Connection => ({ id, source, target, port });

// Hand-specified reference data. Never computed by the circuit evaluator.
export const HALF_EXPECTED: ExpectedTable = {
  inputIds: ["a", "b"],
  outputIds: ["sum", "carry"],
  rows: [
    { inputs: [0, 0], outputs: [0, 0] },
    { inputs: [0, 1], outputs: [1, 0] },
    { inputs: [1, 0], outputs: [1, 0] },
    { inputs: [1, 1], outputs: [0, 1] },
  ],
};
export const FULL_EXPECTED: ExpectedTable = {
  inputIds: ["a", "b", "cin"],
  outputIds: ["sum", "cout"],
  rows: [
    { inputs: [0, 0, 0], outputs: [0, 0] },
    { inputs: [0, 0, 1], outputs: [1, 0] },
    { inputs: [0, 1, 0], outputs: [1, 0] },
    { inputs: [0, 1, 1], outputs: [0, 1] },
    { inputs: [1, 0, 0], outputs: [1, 0] },
    { inputs: [1, 0, 1], outputs: [0, 1] },
    { inputs: [1, 1, 0], outputs: [0, 1] },
    { inputs: [1, 1, 1], outputs: [1, 1] },
  ],
};
export type ExampleId = "half" | "full" | "broken";
export function example(id: ExampleId): CircuitDocument {
  const full = id === "full";
  const document: CircuitDocument = full
    ? {
        version: 1,
        title: "Full-adder",
        expected: FULL_EXPECTED,
        circuit: {
          components: [
            n("a", "INPUT", "A", 30, 50),
            n("b", "INPUT", "B", 30, 190),
            n("cin", "INPUT", "Carry-in", 30, 350),
            n("xor1", "XOR", "XOR 1", 260, 75),
            n("and1", "AND", "AND 1", 260, 255),
            n("xor2", "XOR", "XOR 2", 490, 50),
            n("and2", "AND", "AND 2", 490, 225),
            n("or1", "OR", "OR", 710, 235),
            n("sum", "OUTPUT", "Sum", 940, 50),
            n("cout", "OUTPUT", "Carry-out", 940, 235),
          ],
          connections: [
            e("w1", "a", "xor1", 0),
            e("w2", "b", "xor1", 1),
            e("w3", "a", "and1", 0),
            e("w4", "b", "and1", 1),
            e("w5", "xor1", "xor2", 0),
            e("w6", "cin", "xor2", 1),
            e("w7", "xor1", "and2", 0),
            e("w8", "cin", "and2", 1),
            e("w9", "and1", "or1", 0),
            e("w10", "and2", "or1", 1),
            e("w11", "xor2", "sum", 0),
            e("w12", "or1", "cout", 0),
          ],
        },
      }
    : {
        version: 1,
        title: id === "broken" ? "Broken half-adder" : "Half-adder",
        expected: HALF_EXPECTED,
        circuit: {
          components: [
            n("a", "INPUT", "A", 40, 65),
            n("b", "INPUT", "B", 40, 275),
            n("xor", "XOR", "XOR", 330, 65),
            n("and", "AND", "AND", 330, 275),
            n("sum", "OUTPUT", "Sum", 650, 65),
            n("carry", "OUTPUT", "Carry", 650, 275),
          ],
          connections: [
            e("w1", "a", "xor", 0),
            e("w2", "b", "xor", 1),
            e("w3", "a", "and", 0),
            e("w4", "b", "and", 1),
            e("w5", "xor", "sum", 0),
            e("w6", "and", "carry", 0),
          ],
        },
      };
  const copy = structuredClone(document);
  if (id === "broken") {
    copy.circuit.components[2].kind = "OR";
    copy.circuit.components[2].label = "OR";
  }
  return copy;
}
