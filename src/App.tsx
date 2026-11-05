import { useCallback, useMemo, useRef, useState } from "react";
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  Controls,
} from "@xyflow/react";
import type {
  Connection as FlowConnection,
  Edge,
  EdgeChange,
  NodeChange,
  ReactFlowInstance,
} from "@xyflow/react";
import {
  ArrowDown,
  ArrowRight,
  Check,
  CheckCheck,
  ChevronRight,
  CircleHelp,
  CircuitBoard,
  Download,
  FlaskConical,
  FolderOpen,
  Grip,
  Play,
  Plus,
  RotateCcw,
  ScanLine,
  Trash2,
  Wrench,
  X,
} from "lucide-react";
import CircuitNode from "./CircuitNode";
import type { LogicNode } from "./CircuitNode";
import ExpectedEditor from "./ExpectedEditor";
import { example } from "./engine/examples";
import type { ExampleId } from "./engine/examples";
import { evaluate, validateCircuit } from "./engine/simulate";
import { parseDocument, serializeDocument } from "./engine/persistence";
import { verify } from "./engine/verify";
import type { Verification } from "./engine/verify";
import { KINDS, LIMITS } from "./engine/types";
import type {
  Bit,
  CircuitDocument,
  Component,
  Issue,
  Kind,
} from "./engine/types";

const nodeTypes = { logic: CircuitNode };
const kindNames: Record<Kind, string> = {
  INPUT: "Input switch",
  AND: "AND",
  OR: "OR",
  NOT: "NOT",
  XOR: "XOR",
  OUTPUT: "Output indicator",
};
const exampleNames: Record<ExampleId, string> = {
  half: "Half-adder",
  full: "Full-adder",
  broken: "Broken half-adder",
};
const guide = [
  "สลับ A และ B ระหว่าง 0 กับ 1",
  "สังเกตค่า Sum และ Carry ที่เปลี่ยนทันที",
  "กด Check all inputs เพื่อตรวจครบทุกกรณี",
  "ลองวงจรผิด แล้วดูแถว A=1, B=1",
  "เปลี่ยน OR เป็น XOR แล้วตรวจอีกครั้ง",
];

export default function App() {
  const [document, setDocument] = useState<CircuitDocument>(() =>
    example("half"),
  );
  const [activeExample, setActiveExample] = useState<ExampleId>("half");
  const [verification, setVerification] = useState<Verification | null>(null);
  const [notice, setNotice] = useState<{ text: string; error: boolean } | null>(
    null,
  );
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<string | null>(null);
  const [editor, setEditor] = useState(false);
  const [guideStep, setGuideStep] = useState(0);
  const [flow, setFlow] = useState<ReactFlowInstance<LogicNode, Edge> | null>(
    null,
  );
  const [fitKey, setFitKey] = useState(0);
  const fileInput = useRef<HTMLInputElement>(null);
  const tableRef = useRef<HTMLElement>(null);
  const simulation = useMemo(
    () => evaluate(document.circuit),
    [document.circuit],
  );
  const signals: Record<string, Bit> = simulation.ok
    ? simulation.value.signals
    : Object.fromEntries(
        document.circuit.components
          .filter((n) => n.kind === "INPUT")
          .map((n) => [n.id, n.value!]),
      );
  const selected = document.circuit.components.find(
    (n) => n.id === selectedNode,
  );
  const inputs = document.circuit.components.filter((n) => n.kind === "INPUT");
  const outputs = document.circuit.components.filter(
    (n) => n.kind === "OUTPUT",
  );

  const toggle = useCallback(
    (id: string) =>
      setDocument((old) => ({
        ...old,
        circuit: {
          ...old.circuit,
          components: old.circuit.components.map((n) =>
            n.id === id && n.kind === "INPUT"
              ? { ...n, value: n.value === 0 ? 1 : 0 }
              : n,
          ),
        },
      })),
    [],
  );
  const nodes: LogicNode[] = document.circuit.components.map((n) => ({
    id: n.id,
    type: "logic",
    position: n.position,
    selected: selectedNode === n.id,
    data: { component: n, signal: signals[n.id], toggle },
  }));
  const edges: Edge[] = document.circuit.connections.map((edge) => {
    const bit = signals[edge.source];
    const color = bit === 1 ? "#ab7600" : bit === 0 ? "#6594bb" : "#b04444";
    return {
      id: edge.id,
      source: edge.source,
      target: edge.target,
      sourceHandle: "out",
      targetHandle: String(edge.port),
      type: "smoothstep",
      label: bit === undefined ? "?" : String(bit),
      selected: selectedEdge === edge.id,
      style: {
        stroke: selectedEdge === edge.id ? "#ec5555" : color,
        strokeWidth: selectedEdge === edge.id ? 4 : 2.4,
        strokeDasharray: bit === undefined ? "5 4" : undefined,
      },
      labelStyle: { fill: "#17344d", fontWeight: 700, fontSize: 12 },
      labelBgStyle: { fill: bit === 1 ? "#ffe596" : "#e5f1fa", fillOpacity: 1 },
      labelBgPadding: [6, 3],
      labelBgBorderRadius: 5,
      ariaLabel: `Wire ${edge.id}: ${edge.source} to ${edge.target} input ${edge.port + 1}, signal ${bit ?? "unknown"}`,
    };
  });

  const showErrors = (errors: Issue[]) =>
    setNotice({ text: errors.map((e) => e.message).join(" · "), error: true });
  function functionalChange(update: (old: CircuitDocument) => CircuitDocument) {
    setDocument(update);
    setVerification(null);
    setNotice(null);
  }
  function loadExample(id: ExampleId) {
    setActiveExample(id);
    setDocument(example(id));
    setVerification(null);
    setNotice(null);
    setSelectedNode(null);
    setSelectedEdge(null);
    setFitKey((k) => k + 1);
  }
  function runVerification() {
    const result = verify(document.circuit, document.expected);
    if (result.ok) {
      setVerification(result.value);
      setNotice(null);
      setGuideStep(2);
    } else {
      setVerification(null);
      showErrors(result.errors);
    }
    tableRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }
  function connect(connection: FlowConnection) {
    if (
      !connection.source ||
      !connection.target ||
      connection.sourceHandle !== "out" ||
      !/^\d+$/.test(connection.targetHandle ?? "")
    ) {
      setNotice({
        text: "ต่อสายจาก Output port ด้านขวา ไป Input port ด้านซ้ายเท่านั้น",
        error: true,
      });
      return;
    }
    const wire = {
      id: `w_${crypto.randomUUID()}`,
      source: connection.source,
      target: connection.target,
      port: Number(connection.targetHandle),
    };
    const next = {
      ...document.circuit,
      connections: [...document.circuit.connections, wire],
    };
    const check = validateCircuit(next, false);
    if (!check.ok) {
      showErrors(check.errors);
      return;
    }
    functionalChange((old) => ({ ...old, circuit: next }));
  }
  function addComponent(kind: Kind) {
    const count = document.circuit.components.filter(
      (n) => n.kind === kind,
    ).length;
    if (
      document.circuit.components.length >= LIMITS.components ||
      (kind === "INPUT" && count >= LIMITS.inputs) ||
      (kind === "OUTPUT" && count >= LIMITS.outputs)
    ) {
      setNotice({
        text: "ถึงขีดจำกัด: 48 components / 6 inputs / 8 outputs",
        error: true,
      });
      return;
    }
    const point = flow?.screenToFlowPosition({
      x: window.innerWidth * 0.53,
      y: window.innerHeight * 0.55,
    }) ?? { x: 200, y: 150 };
    const component: Component = {
      id: `n_${crypto.randomUUID()}`,
      kind,
      label:
        kind === "INPUT"
          ? `Input ${count + 1}`
          : kind === "OUTPUT"
            ? `Out ${count + 1}`
            : kind,
      position: {
        x: Math.max(-9500, Math.min(9500, point.x + count * 15)),
        y: Math.max(-9500, Math.min(9500, point.y + count * 15)),
      },
      ...(kind === "INPUT" ? { value: 0 as const } : {}),
    };
    functionalChange((old) => ({
      ...old,
      circuit: {
        ...old.circuit,
        components: [...old.circuit.components, component],
      },
    }));
    setSelectedNode(component.id);
    setSelectedEdge(null);
  }
  function deleteSelection() {
    functionalChange((old) => ({
      ...old,
      circuit: {
        components: old.circuit.components.filter((n) => n.id !== selectedNode),
        connections: old.circuit.connections.filter(
          (e) =>
            e.id !== selectedEdge &&
            e.source !== selectedNode &&
            e.target !== selectedNode,
        ),
      },
    }));
    setSelectedNode(null);
    setSelectedEdge(null);
  }
  function nodeChanges(changes: NodeChange<LogicNode>[]) {
    const removed = changes.filter((c) => c.type === "remove").map((c) => c.id);
    if (removed.length) {
      functionalChange((old) => ({
        ...old,
        circuit: {
          components: old.circuit.components.filter(
            (n) => !removed.includes(n.id),
          ),
          connections: old.circuit.connections.filter(
            (e) => !removed.includes(e.source) && !removed.includes(e.target),
          ),
        },
      }));
      setSelectedNode(null);
    }
    const positions = changes.filter((c) => c.type === "position");
    if (positions.length)
      setDocument((old) => ({
        ...old,
        circuit: {
          ...old.circuit,
          components: old.circuit.components.map((n) => {
            const change = positions.find((c) => c.id === n.id);
            return change?.position
              ? {
                  ...n,
                  position: {
                    x: Math.max(-10000, Math.min(10000, change.position.x)),
                    y: Math.max(-10000, Math.min(10000, change.position.y)),
                  },
                }
              : n;
          }),
        },
      }));
  }
  function edgeChanges(changes: EdgeChange[]) {
    const removed = changes.filter((c) => c.type === "remove").map((c) => c.id);
    if (removed.length)
      functionalChange((old) => ({
        ...old,
        circuit: {
          ...old.circuit,
          connections: old.circuit.connections.filter(
            (e) => !removed.includes(e.id),
          ),
        },
      }));
  }
  function save() {
    const result = serializeDocument(document);
    if (!result.ok) {
      showErrors(result.errors);
      return;
    }
    const url = URL.createObjectURL(
      new Blob([result.value], { type: "application/json" }),
    );
    const anchor = window.document.createElement("a");
    anchor.href = url;
    anchor.download = "logiclab-circuit.json";
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setNotice({
      text: "บันทึก JSON แล้ว — เก็บตำแหน่ง สาย ค่า Input และ Expected table",
      error: false,
    });
  }
  async function importFile(file?: File) {
    if (!file) return;
    try {
      if (file.size > LIMITS.bytes) {
        setNotice({ text: "ไฟล์ใหญ่เกิน 256 KiB", error: true });
        return;
      }
      const result = parseDocument(await file.text());
      if (!result.ok) {
        showErrors(result.errors);
        return;
      }
      setDocument(result.value);
      setVerification(null);
      setSelectedNode(null);
      setSelectedEdge(null);
      setFitKey((k) => k + 1);
      setNotice({
        text: "โหลดวงจรแล้ว · Reset example จะกลับไปยังตัวอย่างที่เลือกล่าสุด",
        error: false,
      });
    } catch {
      setNotice({
        text: "อ่านไฟล์ไม่ได้ กรุณาเลือกไฟล์ JSON อีกครั้ง",
        error: true,
      });
    }
  }
  function repair() {
    functionalChange((old) => ({
      ...old,
      circuit: {
        ...old.circuit,
        components: old.circuit.components.map((n) =>
          n.id === "xor" ? { ...n, kind: "XOR", label: "XOR" } : n,
        ),
      },
    }));
    setGuideStep(4);
    setNotice({
      text: "เปลี่ยน Sum gate เป็น XOR แล้ว · กด Check all inputs เพื่อยืนยัน",
      error: false,
    });
  }
  const label = (id: string) =>
    document.circuit.components.find((n) => n.id === id)?.label ?? id;
  const currentInputs = verification?.inputIds.map(
    (id) => document.circuit.components.find((n) => n.id === id)?.value,
  );
  const brokenGate =
    activeExample === "broken" &&
    document.circuit.components.some((n) => n.id === "xor" && n.kind === "OR");

  return (
    <>
      <header className="topbar">
        <a className="brand" href="#">
          <span className="brand-mark">
            <CircuitBoard size={23} />
          </span>
          <span>
            Logic<span className="brand-light">Lab</span>
            <small>DIGITAL LOGIC PLAYGROUND</small>
          </span>
        </a>
        <nav>
          <a href="#lab">ทดลองวงจร</a>
          <a href="#learn">หลักการทำงาน</a>
          <span className="version-badge">
            EDUCATIONAL PROJECT <b>01</b>
          </span>
        </nav>
      </header>
      <main>
        <section className="hero">
          <div>
            <div className="eyebrow">
              <span className="tiny-square" /> FROM CIRCUIT TO CODE
            </div>
            <h1>
              ต่อวงจรให้เห็นภาพ
              <br />
              <span>
                ตรวจคำตอบให้มั่นใจ<span className="yellow-dot">.</span>
              </span>
            </h1>
            <p>
              โปรแกรมจำลองและตรวจสอบวงจรดิจิทัล
              <br className="mobile-break" /> ทดลอง Logic Gates
              และตรวจทุกอินพุตด้วย Truth Table
            </p>
            <div className="hero-actions">
              <button
                className="button primary"
                onClick={() => {
                  loadExample("half");
                  window.document
                    .getElementById("lab")
                    ?.scrollIntoView({ behavior: "smooth" });
                }}
              >
                <Play size={16} fill="currentColor" />
                Try the half-adder <ArrowRight size={16} />
              </button>
              <span className="browser-note">
                <span /> ทำงานในเบราว์เซอร์ของคุณ
              </span>
            </div>
          </div>
          <div className="hero-card">
            <div className="hero-card-top">
              <span>THE IDEA</span>
              <FlaskConical size={20} />
            </div>
            <div className="equation">
              <span>0</span>
              <span>1</span>
              <ChevronRight size={24} />
              <b>?</b>
            </div>
            <strong>สร้าง · ทดลอง · พิสูจน์</strong>
            <p>
              จากวงจรบน breadboard
              <br />
              สู่การคิดแบบ Computer Engineering
            </p>
            <div className="hero-card-bottom">
              <span>COMBINATIONAL LOGIC</span>
              <span>0 / 1</span>
            </div>
          </div>
        </section>
        <section className="guide-strip" aria-label="ขั้นตอนสาธิต">
          <div className="guide-intro">
            <CircleHelp size={20} />
            <div>
              <b>ลองตามนี้</b>
              <span>GUIDED DEMO</span>
            </div>
          </div>
          <div className="guide-steps">
            {guide.map((text, i) => (
              <button
                key={text}
                className={guideStep === i ? "active" : ""}
                onClick={() => setGuideStep(i)}
                aria-label={`ขั้นตอน ${i + 1}: ${text}`}
              >
                <span>{i + 1}</span>
                <b>
                  {
                    [
                      "สลับ Input",
                      "ดู Output",
                      "ตรวจทุกกรณี",
                      "หาจุดผิด",
                      "ซ่อมแล้วตรวจ",
                    ][i]
                  }
                </b>
              </button>
            ))}
          </div>
          <p className="guide-detail">{guide[guideStep]}</p>
        </section>
        <section id="lab" className="lab-section">
          <div className="section-heading">
            <div>
              <span className="eyebrow">01 / CIRCUIT WORKSPACE</span>
              <h2>
                ห้องทดลองวงจร <span>Simulation lab</span>
              </h2>
            </div>
            <span className={`live-badge ${simulation.ok ? "" : "invalid"}`}>
              <span />
              {simulation.ok ? "LIVE SIMULATION" : "CIRCUIT INCOMPLETE"}
            </span>
          </div>
          <div className="lab-shell">
            <div className="workspace-toolbar">
              <div
                className="example-tabs"
                role="group"
                aria-label="ตัวอย่างวงจร"
              >
                {(["half", "full", "broken"] as ExampleId[]).map((id) => (
                  <button
                    key={id}
                    aria-pressed={activeExample === id}
                    className={activeExample === id ? "active" : ""}
                    onClick={() => loadExample(id)}
                  >
                    {id === "broken" ? (
                      <>
                        <Wrench size={14} />
                        <span>Try a broken circuit</span>
                      </>
                    ) : (
                      exampleNames[id]
                    )}
                  </button>
                ))}
              </div>
              <div className="file-actions">
                <button onClick={save} title="Save JSON">
                  <Download size={16} />
                  <span>Save JSON</span>
                </button>
                <button
                  onClick={() => fileInput.current?.click()}
                  title="Load JSON"
                >
                  <FolderOpen size={16} />
                  <span>Load JSON</span>
                </button>
                <input
                  ref={fileInput}
                  type="file"
                  accept=".json,application/json"
                  aria-label="Load circuit JSON"
                  hidden
                  onChange={(e) => {
                    void importFile(e.target.files?.[0]);
                    e.target.value = "";
                  }}
                />
              </div>
            </div>
            {notice && (
              <div
                className={`notice ${notice.error ? "error" : ""}`}
                role={notice.error ? "alert" : "status"}
              >
                <span>{notice.text}</span>
                <button
                  className="icon-button"
                  onClick={() => setNotice(null)}
                  aria-label="ปิดข้อความ"
                >
                  <X size={16} />
                </button>
              </div>
            )}
            <div className="workspace-body">
              <aside className="component-panel">
                <div className="panel-heading">
                  <span>COMPONENTS</span>
                  <Plus size={15} />
                </div>
                <p>คลิกเพื่อเพิ่มอุปกรณ์</p>
                <div className="component-list">
                  {KINDS.map((kind) => (
                    <button
                      key={kind}
                      aria-label={`Add ${kindNames[kind]}`}
                      onClick={() => addComponent(kind)}
                    >
                      <span
                        className={`component-icon ${kind === "INPUT" || kind === "OUTPUT" ? "io" : ""}`}
                      >
                        {kind === "INPUT"
                          ? "01"
                          : kind === "OUTPUT"
                            ? "◉"
                            : kind === "AND"
                              ? "&"
                              : kind === "OR"
                                ? "≥1"
                                : kind === "NOT"
                                  ? "¬"
                                  : "⊕"}
                      </span>
                      <span>{kindNames[kind]}</span>
                      <Plus size={13} />
                    </button>
                  ))}
                </div>
                <div className="panel-foot">
                  <Grip size={16} />
                  <p>
                    ลากเพื่อย้าย
                    <br />
                    ต่อสายจากขวา → ซ้าย
                    <br />
                    เลือกแล้วกด Delete
                  </p>
                </div>
              </aside>
              <div className="canvas-area">
                <div className="canvas-meta">
                  <span>
                    <span className="tiny-square" />
                    {document.title}
                  </span>
                  <span>
                    {document.circuit.components.length}/48 components ·{" "}
                    {document.circuit.connections.length}/96 wires
                  </span>
                </div>
                <div className="flow-container" aria-label="Circuit editor">
                  <ReactFlow<LogicNode, Edge>
                    key={fitKey}
                    nodes={nodes}
                    edges={edges}
                    nodeTypes={nodeTypes}
                    onInit={setFlow}
                    onNodesChange={nodeChanges}
                    onEdgesChange={edgeChanges}
                    onConnect={connect}
                    onNodeClick={(_, node) => {
                      setSelectedNode(node.id);
                      setSelectedEdge(null);
                    }}
                    onEdgeClick={(_, edge) => {
                      setSelectedEdge(edge.id);
                      setSelectedNode(null);
                    }}
                    onPaneClick={() => {
                      setSelectedNode(null);
                      setSelectedEdge(null);
                    }}
                    onConnectEnd={(_, state) => {
                      if (!state.isValid && state.toNode)
                        setNotice({
                          text: "พอร์ตไม่ถูกต้อง: ต่อจาก output ด้านขวาไป input ด้านซ้ายของอุปกรณ์อื่น",
                          error: true,
                        });
                    }}
                    fitView
                    fitViewOptions={{ padding: 0.22 }}
                    minZoom={0.25}
                    maxZoom={1.6}
                    deleteKeyCode={["Backspace", "Delete"]}
                    snapToGrid
                    snapGrid={[10, 10]}
                    connectionRadius={24}
                  >
                    <Background
                      variant={BackgroundVariant.Dots}
                      color="#c6d7e5"
                      gap={22}
                      size={1.2}
                    />
                    <Controls showInteractive={false} />
                  </ReactFlow>
                </div>
                <div className="canvas-legend">
                  <span>
                    <i className="legend-zero" />0 · LOW
                  </span>
                  <span>
                    <i className="legend-one" />1 · HIGH
                  </span>
                  <span>
                    <i className="legend-unknown" />? · UNKNOWN
                  </span>
                  <button
                    onClick={() =>
                      flow?.fitView({ padding: 0.22, duration: 250 })
                    }
                  >
                    <ScanLine size={14} />
                    Fit view
                  </button>
                </div>
              </div>
              <aside className="signal-panel">
                <div className="panel-heading">
                  LIVE SIGNALS <span className="tiny-square" />
                </div>
                <div className="signal-group-title">INPUT SWITCHES</div>
                {inputs.map((n) => (
                  <button
                    key={n.id}
                    className={`signal-input ${n.value ? "on" : ""}`}
                    aria-label={`Input ${n.label}`}
                    aria-pressed={n.value === 1}
                    onClick={() => toggle(n.id)}
                  >
                    <span>{n.label}</span>
                    <span className="small-track">
                      <i />
                    </span>
                    <b>{n.value}</b>
                  </button>
                ))}
                <div className="signal-group-title outputs-heading">
                  OUTPUT INDICATORS
                </div>
                {outputs.map((n) => (
                  <div
                    key={n.id}
                    className={`signal-output ${signals[n.id] === 1 ? "on" : ""}`}
                  >
                    <span>{n.label}</span>
                    <b data-testid={`output-${n.id}`}>{signals[n.id] ?? "?"}</b>
                  </div>
                ))}
                <div className="signal-hint">
                  ค่าเปลี่ยนทันทีเมื่อสลับ Input
                  <br />
                  ไม่มีการจำลองแรงดันหรือเวลา
                </div>
                <button
                  className="button reset"
                  onClick={() => loadExample(activeExample)}
                >
                  <RotateCcw size={15} />
                  Reset example
                </button>
              </aside>
            </div>
            {(selected || selectedEdge) && (
              <div className="inspector">
                <span className="eyebrow">SELECTED</span>
                {selected ? (
                  <>
                    <label>
                      ชื่อ{" "}
                      <input
                        aria-label="Component label"
                        maxLength={64}
                        value={selected.label}
                        onChange={(e) => {
                          const value = e.target.value;
                          setDocument((old) => ({
                            ...old,
                            circuit: {
                              ...old.circuit,
                              components: old.circuit.components.map((n) =>
                                n.id === selected.id
                                  ? { ...n, label: value }
                                  : n,
                              ),
                            },
                          }));
                        }}
                      />
                    </label>
                    {!["INPUT", "OUTPUT"].includes(selected.kind) && (
                      <label>
                        Gate{" "}
                        <select
                          aria-label="Gate type"
                          value={selected.kind}
                          onChange={(e) =>
                            functionalChange((old) => ({
                              ...old,
                              circuit: {
                                ...old.circuit,
                                components: old.circuit.components.map((n) =>
                                  n.id === selected.id
                                    ? {
                                        ...n,
                                        kind: e.target.value as Kind,
                                        label: e.target.value,
                                      }
                                    : n,
                                ),
                                connections: old.circuit.connections.filter(
                                  (w) =>
                                    w.target !== selected.id ||
                                    e.target.value !== "NOT" ||
                                    w.port === 0,
                                ),
                              },
                            }))
                          }
                        >
                          {["AND", "OR", "NOT", "XOR"].map((kind) => (
                            <option key={kind}>{kind}</option>
                          ))}
                        </select>
                      </label>
                    )}
                  </>
                ) : (
                  <span>Wire {selectedEdge}</span>
                )}
                <button className="delete-button" onClick={deleteSelection}>
                  <Trash2 size={14} />
                  ลบที่เลือก
                </button>
              </div>
            )}
            {!simulation.ok && (
              <div className="validation-errors" role="alert">
                <b>ตรวจสอบการต่อวงจร</b>
                {simulation.errors.map((error, i) => (
                  <span key={i}>
                    {error.code}: {error.message}
                  </span>
                ))}
              </div>
            )}
            <div className="workspace-bottom">
              <span>
                ลากพอร์ตเพื่อเชื่อมต่อ · คลิกเส้นหรืออุปกรณ์เพื่อลบ / แก้ไข
              </span>
              <span>ขีดจำกัด 6 inputs · combinational circuits</span>
            </div>
          </div>
        </section>
        <section
          ref={tableRef}
          id="verification"
          className="verification-section"
        >
          <div className="section-heading">
            <div>
              <span className="eyebrow">02 / AUTOMATIC VERIFICATION</span>
              <h2>
                คำตอบถูกทุกกรณีหรือยัง? <span>Truth table</span>
              </h2>
            </div>
            <button className="button yellow" onClick={runVerification}>
              <CheckCheck size={18} />
              Check all inputs
            </button>
          </div>
          <div className="verification-card">
            <div className="verification-toolbar">
              <div>
                <span className="reference-badge">
                  {document.expected
                    ? "INDEPENDENT EXPECTED TABLE"
                    : "ACTUAL OUTPUTS ONLY"}
                </span>
                <p>
                  Expected = คำตอบอ้างอิงที่ระบุแยกจากวงจร · Actual = ผลจาก
                  simulator
                </p>
              </div>
              <button className="text-button" onClick={() => setEditor(true)}>
                <Wrench size={14} />
                กำหนด Expected
              </button>
            </div>
            {verification ? (
              <>
                <div
                  className={`result-summary ${verification.failing ? "has-fail" : ""}`}
                  role="status"
                  data-testid="verification-summary"
                >
                  <div className="result-icon">
                    {verification.failing ? (
                      <X size={21} />
                    ) : (
                      <Check size={21} />
                    )}
                  </div>
                  <div>
                    <strong>
                      {verification.compared
                        ? verification.failing
                          ? "พบคำตอบไม่ตรงกัน"
                          : "ถูกต้องครบทุกกรณี"
                        : "สร้าง Truth table แล้ว — ยังไม่มีคำตอบอ้างอิง"}
                    </strong>
                    <p>
                      {verification.compared
                        ? `${verification.passing} ผ่าน · ${verification.failing} ไม่ผ่าน · ทั้งหมด ${verification.rows.length} กรณี`
                        : `ทั้งหมด ${verification.rows.length} กรณี · กำหนด Expected เพื่อเปรียบเทียบ`}
                    </p>
                  </div>
                  {verification.compared && (
                    <span className="score">
                      {verification.passing}
                      <small>/{verification.rows.length}</small>
                    </span>
                  )}
                </div>
                <div className="table-scroll">
                  <table className="truth-table">
                    <caption>
                      ผลตรวจ {document.title} — แถวพื้นสีฟ้าคือ Input ปัจจุบัน
                    </caption>
                    <thead>
                      <tr>
                        <th scope="col">CASE</th>
                        {verification.inputIds.map((id) => (
                          <th scope="col" key={id}>
                            {label(id)}
                          </th>
                        ))}
                        {verification.outputIds.map((id) => (
                          <th scope="col" key={`${id}-expected`}>
                            Expected
                            <br />
                            <span>{label(id)}</span>
                          </th>
                        ))}
                        {verification.outputIds.map((id) => (
                          <th scope="col" key={`${id}-actual`}>
                            Actual
                            <br />
                            <span>{label(id)}</span>
                          </th>
                        ))}
                        <th scope="col">RESULT</th>
                      </tr>
                    </thead>
                    <tbody>
                      {verification.rows.map((row, index) => (
                        <tr
                          key={index}
                          className={`${row.pass === false ? "fail-row" : ""} ${row.inputs.every((v, i) => v === currentInputs?.[i]) ? "current-row" : ""}`}
                          data-testid={`truth-row-${row.inputs.join("") || "constant"}`}
                        >
                          <td className="case-number">
                            {String(index + 1).padStart(2, "0")}
                          </td>
                          {row.inputs.map((v, i) => (
                            <td key={i}>
                              <span className={`bit bit-${v}`}>{v}</span>
                            </td>
                          ))}
                          {verification.outputIds.map((id, i) => (
                            <td key={`${id}-e`}>{row.expected?.[i] ?? "—"}</td>
                          ))}
                          {row.actual.map((v, i) => (
                            <td
                              key={`actual-${i}`}
                              className={
                                row.expected && v !== row.expected[i]
                                  ? "mismatch"
                                  : ""
                              }
                            >
                              {v}
                              {row.expected && v !== row.expected[i] && (
                                <span className="sr-only"> mismatch</span>
                              )}
                            </td>
                          ))}
                          <td>
                            <span
                              className={`pass-badge ${row.pass === false ? "fail" : ""}`}
                            >
                              {row.pass === undefined
                                ? "—"
                                : row.pass
                                  ? "PASS"
                                  : "FAIL"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <div className="verification-empty">
                <span className="empty-icon">
                  <CheckCheck size={26} />
                </span>
                <div>
                  <h3>เปลี่ยนจาก “น่าจะถูก” เป็น “ทดสอบแล้ว”</h3>
                  <p>
                    ตรวจครบทั้ง {2 ** inputs.length} input combinations
                    ด้วยการกดปุ่มเดียว
                  </p>
                </div>
                <ArrowDown size={22} />
              </div>
            )}
            {brokenGate && (
              <div className="repair-card">
                <Wrench size={21} />
                <div>
                  <b>หาเจอแล้ว ซ่อมอย่างไร?</b>
                  <p>
                    เมื่อ A=1 และ B=1: OR ให้ Sum=1 แต่ XOR ต้องให้ Sum=0
                    <br />
                    เลือกเกต OR ในวงจร แล้วเปลี่ยน Gate เป็น XOR หรือกดปุ่มซ่อม
                    จากนั้นตรวจอีกครั้ง
                  </p>
                </div>
                <button className="button" onClick={repair}>
                  ซ่อม Sum → XOR <ArrowRight size={15} />
                </button>
              </div>
            )}
          </div>
        </section>
        <section id="learn" className="learn-section">
          <div>
            <span className="eyebrow">03 / BEHIND THE SIGNAL</span>
            <h2>
              วงจรคือกราฟ
              <br />
              <span>คำตอบต้องมาตามลำดับ</span>
            </h2>
            <p>
              อุปกรณ์คือ nodes และสายเชื่อมต่อคือ edges
              <br />
              เครื่องจำลองเรียงลำดับด้วย Topological sort (Kahn’s algorithm)
              <br />
              เพื่อให้ค่าจากต้นทางพร้อมก่อนคำนวณเกตถัดไป
            </p>
            <p>
              หากเรียงไม่ครบ แสดงว่ามี Feedback loop
              <br />
              หากต่อ Input ไม่ครบ จะแสดง ? และหยุดประเมินวงจร
            </p>
          </div>
          <div className="learn-details">
            <div>
              <span>01</span>
              <div>
                <b>Binary logic</b>
                <p>
                  0 = LOW · 1 = HIGH
                  <br />
                  AND: ทั้งคู่เป็น 1 · OR: อย่างน้อยหนึ่งตัวเป็น 1<br />
                  NOT: กลับค่า · XOR: ค่าต่างกันจึงเป็น 1
                </p>
              </div>
            </div>
            <div>
              <span>02</span>
              <div>
                <b>Exhaustive testing</b>
                <p>
                  n inputs มี 2ⁿ กรณี สูงสุด 6 inputs = 64 กรณี
                  <br />
                  Expected ระบุแยกจาก Actual เพื่อจับข้อผิดพลาดได้
                </p>
              </div>
            </div>
            <div>
              <span>03</span>
              <div>
                <b>Know the model</b>
                <p>
                  จำลองเฉพาะ 0/1 ของวงจร combinational
                  <br />
                  ไม่จำลองแรงดัน กระแส propagation delay
                  <br />
                  flip-flop หรือพฤติกรรมทางไฟฟ้าจริง
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer>
        <div className="brand footer-brand">
          <CircuitBoard size={21} />
          <span>LogicLab</span>
        </div>
        <p>โปรเจกต์ซอฟต์แวร์เพื่อการศึกษา · Digital logic, made visible.</p>
        <a
          href="https://discord.gg/ojailbreaks"
          target="_blank"
          rel="noreferrer"
        >
          Built by Olivia — https://discord.gg/ojailbreaks
        </a>
      </footer>
      {editor && (
        <ExpectedEditor
          document={document}
          onClose={() => setEditor(false)}
          onSave={(expected) =>
            functionalChange((old) => ({ ...old, expected }))
          }
        />
      )}
    </>
  );
}
