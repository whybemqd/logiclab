import { memo } from "react";
import { Handle, Position } from "@xyflow/react";
import type { Node, NodeProps } from "@xyflow/react";
import type { Bit, Component } from "./engine/types";
import { ARITY } from "./engine/types";

export type LogicNode = Node<
  { component: Component; signal?: Bit; toggle: (id: string) => void },
  "logic"
>;
function GateSymbol({ kind }: { kind: Component["kind"] }) {
  const path =
    kind === "AND"
      ? "M24 9H49C78 9 78 61 49 61H24Z"
      : kind === "NOT"
        ? "M24 10L72 35L24 60Z M73 35a5 5 0 1 0 10 0a5 5 0 1 0 -10 0"
        : "M23 9Q46 35 23 61Q58 64 82 35Q58 6 23 9Z";
  return (
    <svg viewBox="0 0 105 70" aria-hidden="true" className="gate-symbol">
      <path d={path} />
      {kind === "XOR" && <path d="M14 9Q37 35 14 61" />}
      <path
        d={
          kind === "NOT"
            ? "M7 35H24 M83 35H100"
            : "M7 22H30 M7 48H30 M79 35H100"
        }
      />
    </svg>
  );
}
export default memo(function CircuitNode({
  data,
  selected,
}: NodeProps<LogicNode>) {
  const { component: n, signal, toggle } = data;
  const value = signal === undefined ? "?" : String(signal);
  return (
    <div
      className={`circuit-node ${n.kind.toLowerCase()} ${selected ? "selected" : ""} signal-${value}`}
      data-testid={`node-${n.id}`}
    >
      {Array.from({ length: ARITY[n.kind] }, (_, i) => (
        <Handle
          key={i}
          type="target"
          position={Position.Left}
          id={String(i)}
          aria-label={`${n.label} input ${i + 1}`}
          style={{
            top: ARITY[n.kind] === 2 ? (i === 0 ? "35%" : "69%") : "50%",
          }}
        />
      ))}
      <div className="node-heading">
        <span>{n.label}</span>
        <span className="node-kind">
          {n.kind === "INPUT" ? "IN" : n.kind === "OUTPUT" ? "OUT" : n.kind}
        </span>
      </div>
      {n.kind === "INPUT" ? (
        <button
          type="button"
          className={`input-switch nodrag nopan ${n.value === 1 ? "on" : ""}`}
          aria-label={`Toggle ${n.label}`}
          aria-pressed={n.value === 1}
          onClick={() => toggle(n.id)}
        >
          <span className="switch-track">
            <span />
          </span>
          <b>{n.value}</b>
        </button>
      ) : n.kind === "OUTPUT" ? (
        <div className="output-value" aria-label={`${n.label} = ${value}`}>
          <span className={`led ${value === "1" ? "on" : ""}`} />
          <b>{value}</b>
          <small>{value === "?" ? "UNKNOWN" : `LOGIC ${value}`}</small>
        </div>
      ) : (
        <div className="gate-body">
          <GateSymbol kind={n.kind} />
          <b className="gate-value">{value}</b>
        </div>
      )}
      {n.kind !== "OUTPUT" && (
        <Handle
          type="source"
          position={Position.Right}
          id="out"
          aria-label={`${n.label} output`}
        />
      )}
    </div>
  );
});
