import { ARITY, KINDS, LIMITS, fail, isBit } from "./types";
import type { Bit, Circuit, Issue, Kind, Result } from "./types";

export function gate(
  kind: Exclude<Kind, "INPUT">,
  inputs: readonly Bit[],
): Bit {
  const [a, b] = inputs;
  switch (kind) {
    case "AND":
      return (a & b) as Bit;
    case "OR":
      return (a | b) as Bit;
    case "XOR":
      return (a ^ b) as Bit;
    case "NOT":
      return a === 0 ? 1 : 0;
    case "OUTPUT":
      return a;
  }
}

// Partial graphs remain editable; simulation requires every required port.
export function validateCircuit(
  circuit: Circuit,
  requireConnected = true,
): Result<string[]> {
  const { components, connections } = circuit;
  if (
    components.length > LIMITS.components ||
    connections.length > LIMITS.connections ||
    components.filter((n) => n.kind === "INPUT").length > LIMITS.inputs ||
    components.filter((n) => n.kind === "OUTPUT").length > LIMITS.outputs
  ) {
    return fail(
      "LIMIT",
      "เกินขีดจำกัด: 48 components, 96 wires, 6 inputs, 8 outputs",
    );
  }
  const errors: Issue[] = [];
  const byId = new Map(components.map((n) => [n.id, n]));
  if (
    byId.size !== components.length ||
    new Set(connections.map((e) => e.id)).size !== connections.length
  )
    return fail("DUPLICATE", "พบ ID ซ้ำใน components หรือ connections");
  for (const n of components) {
    if (!KINDS.includes(n.kind) || (n.kind === "INPUT" && !isBit(n.value)))
      return fail("SHAPE", `ค่า component ${n.id} ไม่ถูกต้อง`);
  }
  const drivers = new Set<string>();
  const outgoing = new Map(components.map((n) => [n.id, [] as string[]]));
  const indegree = new Map(components.map((n) => [n.id, 0]));
  for (const edge of connections) {
    const source = byId.get(edge.source),
      target = byId.get(edge.target);
    if (
      !source ||
      !target ||
      source.kind === "OUTPUT" ||
      target.kind === "INPUT" ||
      !Number.isInteger(edge.port) ||
      edge.port < 0 ||
      edge.port >= ARITY[target.kind]
    ) {
      errors.push({
        code: "CONNECTION",
        message: `สาย ${edge.id}: พอร์ตหรือทิศทางไม่ถูกต้อง`,
      });
      continue;
    }
    const key = `${edge.target}:${edge.port}`;
    if (drivers.has(key))
      errors.push({
        code: "MULTIPLE_DRIVERS",
        message: `${target.label}: input ${edge.port + 1} มีสายขับมากกว่าหนึ่งเส้น`,
        componentId: target.id,
      });
    drivers.add(key);
    outgoing.get(source.id)!.push(target.id);
    indegree.set(target.id, indegree.get(target.id)! + 1);
  }
  if (requireConnected)
    for (const n of components) {
      for (let port = 0; port < ARITY[n.kind]; port++)
        if (!drivers.has(`${n.id}:${port}`))
          errors.push({
            code: "MISSING_INPUT",
            message: `${n.label}: input ${port + 1} ยังไม่ได้ต่อสาย (ไม่ใช่ค่า 0)`,
            componentId: n.id,
          });
    }
  // Kahn's algorithm: parallel wires to different ports count separately.
  const queue = components
    .filter((n) => indegree.get(n.id) === 0)
    .map((n) => n.id);
  const order: string[] = [];
  for (let head = 0; head < queue.length; head++) {
    const id = queue[head];
    order.push(id);
    for (const target of outgoing.get(id)!) {
      indegree.set(target, indegree.get(target)! - 1);
      if (indegree.get(target) === 0) queue.push(target);
    }
  }
  if (order.length !== components.length)
    errors.push({
      code: "CYCLE",
      message: "พบ Feedback loop: วงจร combinational ต้องไม่มีเส้นทางย้อนกลับ",
    });
  return errors.length ? { ok: false, errors } : { ok: true, value: order };
}

export interface Evaluation {
  signals: Record<string, Bit>;
  outputs: Record<string, Bit>;
  order: string[];
}
export function evaluate(
  circuit: Circuit,
  assignment?: Record<string, Bit>,
): Result<Evaluation> {
  const validation = validateCircuit(circuit);
  if (!validation.ok) return validation;
  const inputs = circuit.components.filter((n) => n.kind === "INPUT");
  if (
    assignment &&
    (Object.keys(assignment).length !== inputs.length ||
      inputs.some(
        (n) => !Object.hasOwn(assignment, n.id) || !isBit(assignment[n.id]),
      ))
  )
    return fail(
      "ASSIGNMENT",
      "ต้องกำหนดค่า 0 หรือ 1 ให้ Input switch ทุกตัวพอดี",
    );
  const byId = new Map(circuit.components.map((n) => [n.id, n]));
  const incoming = new Map(
    circuit.components.map((n) => [n.id, [] as typeof circuit.connections]),
  );
  for (const edge of circuit.connections) incoming.get(edge.target)!.push(edge);
  // Null-prototype maps also make imported IDs safe as object keys.
  const signals: Record<string, Bit> = Object.create(null);
  const outputs: Record<string, Bit> = Object.create(null);
  for (const id of validation.value) {
    const n = byId.get(id)!;
    if (n.kind === "INPUT")
      signals[id] = assignment ? assignment[id] : n.value!;
    else {
      const values: Bit[] = [];
      for (const edge of incoming.get(id)!)
        values[edge.port] = signals[edge.source];
      signals[id] = gate(n.kind, values);
      if (n.kind === "OUTPUT") outputs[id] = signals[id];
    }
  }
  return { ok: true, value: { signals, outputs, order: validation.value } };
}
