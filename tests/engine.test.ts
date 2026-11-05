import { describe, expect, it } from "vitest";
import { gate, evaluate, validateCircuit } from "../src/engine/simulate";
import { example, FULL_EXPECTED } from "../src/engine/examples";
import {
  inputCombinations,
  validateExpected,
  verify,
} from "../src/engine/verify";
import type {
  Bit,
  Circuit,
  CircuitDocument,
  Issue,
  Result,
} from "../src/engine/types";
import { LIMITS } from "../src/engine/types";
import { parseDocument, serializeDocument } from "../src/engine/persistence";

const errors = <T>(result: Result<T>): Issue["code"][] =>
  result.ok ? [] : result.errors.map((e) => e.code);
describe("supported gates", () => {
  const pairs: [Bit, Bit][] = [
    [0, 0],
    [0, 1],
    [1, 0],
    [1, 1],
  ];
  for (const [kind, expected] of [
    ["AND", [0, 0, 0, 1]],
    ["OR", [0, 1, 1, 1]],
    ["XOR", [0, 1, 1, 0]],
  ] as const)
    pairs.forEach((pair, i) =>
      it(`${kind} ${pair.join("")} = ${expected[i]}`, () =>
        expect(gate(kind, pair)).toBe(expected[i])),
    );
  it.each([0, 1] as const)("NOT and OUTPUT on %i", (a) => {
    expect(gate("NOT", [a])).toBe(a === 0 ? 1 : 0);
    expect(gate("OUTPUT", [a])).toBe(a);
  });
  it("evaluates NOT with connected input and output", () => {
    const c: Circuit = {
      components: [
        {
          id: "i",
          kind: "INPUT",
          label: "I",
          value: 0,
          position: { x: 0, y: 0 },
        },
        { id: "n", kind: "NOT", label: "NOT", position: { x: 100, y: 0 } },
        { id: "o", kind: "OUTPUT", label: "O", position: { x: 200, y: 0 } },
      ],
      connections: [
        { id: "w1", source: "i", target: "n", port: 0 },
        { id: "w2", source: "n", target: "o", port: 0 },
      ],
    };
    expect(evaluate(c)).toMatchObject({
      ok: true,
      value: { outputs: { o: 1 } },
    });
    expect(evaluate(c, { i: 1 })).toMatchObject({
      ok: true,
      value: { outputs: { o: 0 } },
    });
  });
});
describe("adder verification", () => {
  FULL_EXPECTED.rows.forEach((row) =>
    it(`full-adder ${row.inputs.join("")}`, () => {
      const result = evaluate(example("full").circuit, {
        a: row.inputs[0],
        b: row.inputs[1],
        cin: row.inputs[2],
      });
      expect(result.ok).toBe(true);
      if (result.ok)
        expect([result.value.outputs.sum, result.value.outputs.cout]).toEqual(
          row.outputs,
        );
    }),
  );
  it("full-adder passes 8 independent expected cases", () => {
    const doc = example("full");
    expect(verify(doc.circuit, doc.expected)).toMatchObject({
      ok: true,
      value: { passing: 8, failing: 0, compared: true },
    });
  });
  it("broken half-adder fails only 11, with Sum expected 0 but actual 1", () => {
    const doc = example("broken"),
      result = verify(doc.circuit, doc.expected);
    expect(result).toMatchObject({
      ok: true,
      value: { passing: 3, failing: 1 },
    });
    if (result.ok)
      expect(result.value.rows.filter((r) => r.pass === false)).toEqual([
        { inputs: [1, 1], expected: [0, 1], actual: [1, 1], pass: false },
      ]);
  });
  it("uses independent expected values and does not overwrite them", () => {
    const doc = example("half");
    doc.expected!.rows[0].outputs[0] = 1;
    expect(verify(doc.circuit, doc.expected)).toMatchObject({
      ok: true,
      value: { passing: 3, failing: 1 },
    });
    expect(doc.expected!.rows[0].outputs[0]).toBe(1);
    expect(example("half").expected!.rows[0].outputs[0]).toBe(0);
  });
  it("component and wire insertion order do not change evaluation", () => {
    const doc = example("full");
    doc.circuit.components.reverse();
    doc.circuit.connections.reverse();
    expect(verify(doc.circuit, doc.expected)).toMatchObject({
      ok: true,
      value: { passing: 8, failing: 0 },
    });
  });
  it("supports fan-out and the same source on distinct input ports", () => {
    const doc = example("half");
    doc.circuit.connections.find((e) => e.id === "w2")!.source = "a";
    expect(evaluate(doc.circuit, { a: 1, b: 0 })).toMatchObject({
      ok: true,
      value: { outputs: { sum: 0, carry: 0 } },
    });
  });
  it("generates all 64 unique six-input combinations and one zero-input combination", () => {
    expect(inputCombinations(6)).toHaveLength(64);
    expect(new Set(inputCombinations(6).map((r) => r.join(""))).size).toBe(64);
    expect(inputCombinations(0)).toEqual([[]]);
    expect(inputCombinations(7)).toEqual([]);
  });
  it("without expected results reports actual table, never a passing claim", () => {
    expect(verify(example("half").circuit)).toMatchObject({
      ok: true,
      value: { compared: false, passing: 0, failing: 0 },
    });
  });
});
describe("graph errors fail closed", () => {
  it.each([
    ["missing source", "absent", "xor", 0],
    ["output drives gate", "sum", "xor", 0],
    ["input as target", "a", "b", 0],
    ["nonexistent port", "a", "xor", 2],
    ["negative port", "a", "xor", -1],
    ["fractional port", "a", "xor", 0.5],
  ] as const)("%s", (_, source, target, port) => {
    const doc = example("half");
    doc.circuit.connections[0] = { id: "w1", source, target, port };
    expect(errors(evaluate(doc.circuit))).toContain("CONNECTION");
  });
  it("multiple drivers are rejected even when both bits agree", () => {
    const doc = example("half");
    doc.circuit.connections.push({
      id: "extra",
      source: "b",
      target: "xor",
      port: 0,
    });
    expect(errors(evaluate(doc.circuit))).toContain("MULTIPLE_DRIVERS");
  });
  it("unconnected input is an error rather than zero", () => {
    const doc = example("half");
    doc.circuit.connections.shift();
    expect(errors(evaluate(doc.circuit))).toContain("MISSING_INPUT");
    expect(validateCircuit(doc.circuit, false).ok).toBe(true);
    expect(errors(verify(doc.circuit, doc.expected))).toContain(
      "MISSING_INPUT",
    );
  });
  it("self-loop is detected", () => {
    const doc = example("half");
    doc.circuit.connections[0].source = "xor";
    expect(errors(evaluate(doc.circuit))).toContain("CYCLE");
  });
  it("multi-gate feedback is detected", () => {
    const doc = example("half");
    doc.circuit.connections[0].source = "and";
    doc.circuit.connections[2].source = "xor";
    expect(errors(evaluate(doc.circuit))).toContain("CYCLE");
  });
  it("duplicate node and wire IDs are rejected", () => {
    const doc = example("half");
    doc.circuit.components[1].id = "a";
    expect(errors(evaluate(doc.circuit))).toContain("DUPLICATE");
    const other = example("half");
    other.circuit.connections[1].id = "w1";
    expect(errors(evaluate(other.circuit))).toContain("DUPLICATE");
  });
  it("input assignment must be complete binary data with no extra IDs", () => {
    for (const assignment of [
      { a: 0 },
      { a: 0, b: 2 },
      { a: 0, b: 0, extra: 1 },
    ])
      expect(
        errors(
          evaluate(example("half").circuit, assignment as Record<string, Bit>),
        ),
      ).toContain("ASSIGNMENT");
  });
  it("caps nodes, wires, input switches and outputs", () => {
    for (const type of [
      "components",
      "connections",
      "inputs",
      "outputs",
    ] as const) {
      const doc = example("half");
      if (type === "components")
        doc.circuit.components = Array.from({ length: 49 }, (_, i) => ({
          ...doc.circuit.components[2],
          id: `n${i}`,
        }));
      if (type === "connections")
        doc.circuit.connections = Array.from({ length: 97 }, (_, i) => ({
          ...doc.circuit.connections[0],
          id: `w${i}`,
        }));
      if (type === "inputs" || type === "outputs")
        doc.circuit.components = Array.from(
          { length: type === "inputs" ? 7 : 9 },
          (_, i) => ({
            ...doc.circuit.components[type === "inputs" ? 0 : 4],
            id: `n${i}`,
          }),
        );
      expect(errors(evaluate(doc.circuit))).toContain("LIMIT");
    }
  });
});
describe("expected table validation", () => {
  it.each([
    "missing row",
    "duplicate combination",
    "wrong ID",
    "missing bit",
    "invalid bit",
    "duplicate ID",
  ] as const)("rejects %s", (test) => {
    const doc = example("half"),
      spec = doc.expected!;
    if (test === "missing row") spec.rows.pop();
    if (test === "duplicate combination") spec.rows[1].inputs = [0, 0];
    if (test === "wrong ID") spec.outputIds[0] = "not_an_output";
    if (test === "missing bit") spec.rows[0].outputs.pop();
    if (test === "invalid bit") spec.rows[0].outputs[0] = 2 as Bit;
    if (test === "duplicate ID") spec.inputIds = ["a", "a"];
    expect(errors(validateExpected(doc.circuit, spec))).toContain("EXPECTED");
  });
  it("honors reordered input and output IDs in an independent table", () => {
    const doc = example("half"),
      spec = doc.expected!;
    spec.inputIds.reverse();
    spec.outputIds.reverse();
    spec.rows = spec.rows.map((row) => ({
      inputs: [...row.inputs].reverse(),
      outputs: [...row.outputs].reverse(),
    }));
    expect(verify(doc.circuit, spec)).toMatchObject({
      ok: true,
      value: { passing: 4 },
    });
  });
});
describe("save and load", () => {
  it.each(["half", "full", "broken"] as const)(
    "round-trips %s including states, positions and reference",
    (name) => {
      const doc = example(name);
      doc.circuit.components[0].value = 1;
      doc.circuit.components[0].position.x = 123;
      const saved = serializeDocument(doc);
      expect(saved.ok).toBe(true);
      if (saved.ok)
        expect(parseDocument(saved.value)).toEqual({ ok: true, value: doc });
    },
  );
  it("allows saving an incomplete editable graph but evaluation still fails", () => {
    const doc = example("half");
    doc.circuit.connections.pop();
    const saved = serializeDocument(doc);
    expect(saved.ok).toBe(true);
    if (saved.ok) {
      const loaded = parseDocument(saved.value);
      expect(loaded.ok).toBe(true);
      if (loaded.ok)
        expect(errors(evaluate(loaded.value.circuit))).toContain(
          "MISSING_INPUT",
        );
    }
  });
  it.each([
    "{oops",
    "null",
    "[]",
    '{"version":2}',
    '{"version":1,"title":"x","circuit":null}',
  ])("rejects malformed file %s", (value) =>
    expect(parseDocument(value).ok).toBe(false),
  );
  it.each([
    "unknown kind",
    "bad coordinate",
    "missing input value",
    "bad wire",
    "duplicate node",
    "feedback",
    "multiple drivers",
    "bad expected",
  ] as const)("rejects imported %s", (test) => {
    const doc = example("half");
    if (test === "unknown kind")
      doc.circuit.components[0].kind = "NAND" as never;
    if (test === "bad coordinate")
      doc.circuit.components[0].position.x = Infinity;
    if (test === "missing input value") delete doc.circuit.components[0].value;
    if (test === "bad wire") doc.circuit.connections[0].target = "absent";
    if (test === "duplicate node") doc.circuit.components[1].id = "a";
    if (test === "feedback") doc.circuit.connections[0].source = "xor";
    if (test === "multiple drivers")
      doc.circuit.connections.push({
        id: "extra",
        source: "a",
        target: "xor",
        port: 0,
      });
    if (test === "bad expected")
      doc.expected!.rows[0].outputs = [null as never];
    expect(parseDocument(JSON.stringify(doc)).ok).toBe(false);
  });
  it("rejects oversize documents before parsing", () =>
    expect(errors(parseDocument(" ".repeat(LIMITS.bytes + 1)))).toContain(
      "LIMIT",
    ));
  it("safely treats HTML labels as strings and drops unknown fields", () => {
    const doc = example("half") as CircuitDocument & { surprise?: string };
    doc.surprise = "ignored";
    doc.circuit.components[0].label = "<script>hi</script>";
    const parsed = parseDocument(JSON.stringify(doc));
    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(parsed.value).not.toHaveProperty("surprise");
      expect(parsed.value.circuit.components[0].label).toBe(
        "<script>hi</script>",
      );
    }
  });
});
