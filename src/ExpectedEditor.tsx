import { useState } from "react";
import { X } from "lucide-react";
import { inputCombinations, validateExpected } from "./engine/verify";
import type { Bit, CircuitDocument, ExpectedTable } from "./engine/types";

export default function ExpectedEditor({
  document,
  onSave,
  onClose,
}: {
  document: CircuitDocument;
  onSave: (table?: ExpectedTable) => void;
  onClose: () => void;
}) {
  const inputs = document.circuit.components.filter((n) => n.kind === "INPUT");
  const outputs = document.circuit.components.filter(
    (n) => n.kind === "OUTPUT",
  );
  const combinations = inputCombinations(inputs.length);
  const valid =
    document.expected &&
    validateExpected(document.circuit, document.expected).ok
      ? document.expected
      : undefined;
  const [values, setValues] = useState<string[][]>(() =>
    combinations.map((bits) =>
      outputs.map((output) => {
        if (!valid) return "";
        const row = valid.rows.find((r) =>
          inputs.every(
            (n, i) => r.inputs[valid.inputIds.indexOf(n.id)] === bits[i],
          ),
        );
        return row
          ? String(row.outputs[valid.outputIds.indexOf(output.id)])
          : "";
      }),
    ),
  );
  const complete =
    outputs.length > 0 &&
    values.every((row) => row.every((v) => v === "0" || v === "1"));
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <section
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="expected-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="section-heading">
          <div>
            <span className="eyebrow">INDEPENDENT REFERENCE</span>
            <h2 id="expected-title">กำหนด Expected truth table</h2>
          </div>
          <button
            autoFocus
            className="icon-button"
            aria-label="ปิด Expected editor"
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </div>
        <p>
          กรอกคำตอบที่ถูกต้องจากการคำนวณของคุณ ตารางนี้ไม่ใช้ผลจาก simulator
          เป็นคำตอบอ้างอิง
        </p>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                {inputs.map((n) => (
                  <th key={n.id}>{n.label}</th>
                ))}
                {outputs.map((n) => (
                  <th key={n.id}>Expected {n.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {combinations.map((bits, r) => (
                <tr key={r}>
                  {bits.map((bit, i) => (
                    <td key={i}>{bit}</td>
                  ))}
                  {outputs.map((n, col) => (
                    <td key={n.id}>
                      <select
                        aria-label={`Expected ${n.label} for ${bits.join("") || "constant"}`}
                        value={values[r][col]}
                        onChange={(e) =>
                          setValues((old) =>
                            old.map((row, i) =>
                              i === r
                                ? row.map((v, j) =>
                                    j === col ? e.target.value : v,
                                  )
                                : row,
                            ),
                          )
                        }
                      >
                        <option value="">—</option>
                        <option value="0">0</option>
                        <option value="1">1</option>
                      </select>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!outputs.length && (
          <p className="error-text">เพิ่ม Output ก่อนกำหนดคำตอบ</p>
        )}
        <div className="modal-actions">
          <button
            className="button ghost"
            onClick={() => {
              onSave(undefined);
              onClose();
            }}
          >
            ล้าง Expected
          </button>
          <button
            className="button primary"
            disabled={!complete}
            onClick={() => {
              onSave({
                inputIds: inputs.map((n) => n.id),
                outputIds: outputs.map((n) => n.id),
                rows: combinations.map((bits, i) => ({
                  inputs: bits,
                  outputs: values[i].map((v) => Number(v) as Bit),
                })),
              });
              onClose();
            }}
          >
            บันทึกคำตอบอ้างอิง
          </button>
        </div>
      </section>
    </div>
  );
}
