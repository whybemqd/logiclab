import { validateCircuit } from "./simulate";
import { validateExpected } from "./verify";
import { KINDS, LIMITS, fail, isBit } from "./types";
import type {
  Bit,
  CircuitDocument,
  Component,
  Connection,
  ExpectedTable,
  Kind,
  Result,
} from "./types";

const record = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);
const id = (value: unknown): value is string =>
  typeof value === "string" && /^[A-Za-z][A-Za-z0-9_-]{0,47}$/.test(value);
const text = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0 && value.length <= 64;
const coordinate = (value: unknown): value is number =>
  typeof value === "number" &&
  Number.isFinite(value) &&
  Math.abs(value) <= 10000;

// Treat imported JSON as unknown. Reconstruct trusted fields rather than spreading input.
export function parseDocument(json: string): Result<CircuitDocument> {
  if (new TextEncoder().encode(json).length > LIMITS.bytes)
    return fail("LIMIT", "ไฟล์ใหญ่เกิน 256 KiB");
  let raw: unknown;
  try {
    raw = JSON.parse(json);
  } catch {
    return fail("SHAPE", "อ่าน JSON ไม่ได้: ตรวจสอบรูปแบบไฟล์");
  }
  if (
    !record(raw) ||
    raw.version !== 1 ||
    !text(raw.title) ||
    !record(raw.circuit) ||
    !Array.isArray(raw.circuit.components) ||
    !Array.isArray(raw.circuit.connections)
  )
    return fail(
      "SHAPE",
      "ไฟล์ต้องเป็น LogicLab version 1 และมี title, circuit.components, circuit.connections",
    );
  const nodes = raw.circuit.components,
    edges = raw.circuit.connections;
  if (nodes.length > LIMITS.components || edges.length > LIMITS.connections)
    return fail("LIMIT", "จำนวน components หรือ wires เกินขีดจำกัด");
  const components: Component[] = [];
  for (const node of nodes) {
    if (
      !record(node) ||
      !id(node.id) ||
      !KINDS.includes(node.kind as Kind) ||
      !text(node.label) ||
      !record(node.position) ||
      !coordinate(node.position.x) ||
      !coordinate(node.position.y) ||
      (node.kind === "INPUT" && !isBit(node.value))
    )
      return fail(
        "SHAPE",
        "Component มี ID, kind, label, position หรือค่า Input ไม่ถูกต้อง",
      );
    components.push({
      id: node.id,
      kind: node.kind as Kind,
      label: node.label,
      position: { x: node.position.x, y: node.position.y },
      ...(node.kind === "INPUT" ? { value: node.value as Bit } : {}),
    });
  }
  const connections: Connection[] = [];
  for (const edge of edges) {
    if (
      !record(edge) ||
      !id(edge.id) ||
      !id(edge.source) ||
      !id(edge.target) ||
      !Number.isInteger(edge.port)
    )
      return fail(
        "SHAPE",
        "Connection ต้องมี ID, source, target และ port เป็นจำนวนเต็ม",
      );
    connections.push({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      port: edge.port as number,
    });
  }
  const circuit = { components, connections };
  const validation = validateCircuit(circuit, false);
  if (!validation.ok) return validation;
  let expected: ExpectedTable | undefined;
  if (raw.expected !== undefined) {
    const spec = raw.expected;
    if (
      !record(spec) ||
      !Array.isArray(spec.inputIds) ||
      !spec.inputIds.every(id) ||
      spec.inputIds.length > LIMITS.inputs ||
      !Array.isArray(spec.outputIds) ||
      !spec.outputIds.every(id) ||
      spec.outputIds.length > LIMITS.outputs ||
      !Array.isArray(spec.rows) ||
      spec.rows.length > 64
    )
      return fail("EXPECTED", "รูปแบบ Expected table ไม่ถูกต้อง");
    const rows: ExpectedTable["rows"] = [];
    for (const row of spec.rows) {
      if (
        !record(row) ||
        !Array.isArray(row.inputs) ||
        !row.inputs.every(isBit) ||
        !Array.isArray(row.outputs) ||
        !row.outputs.every(isBit)
      )
        return fail(
          "EXPECTED",
          "Expected table ต้องมี inputs และ outputs เป็น 0 หรือ 1",
        );
      rows.push({ inputs: [...row.inputs], outputs: [...row.outputs] });
    }
    expected = {
      inputIds: [...spec.inputIds],
      outputIds: [...spec.outputIds],
      rows,
    };
    const check = validateExpected(circuit, expected);
    if (!check.ok) return check;
  }
  return {
    ok: true,
    value: {
      version: 1,
      title: raw.title,
      circuit,
      ...(expected ? { expected } : {}),
    },
  };
}

export function serializeDocument(document: CircuitDocument): Result<string> {
  const json = JSON.stringify(document, null, 2);
  const check = parseDocument(json);
  return check.ok
    ? { ok: true, value: JSON.stringify(check.value, null, 2) }
    : check;
}
