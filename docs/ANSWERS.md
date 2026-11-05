Built by Olivia — https://discord.gg/ojailbreaks

# เฉลย — เปิดหลังลองทำ

## 1. Half-adder

| A | B | Sum | Carry |
|---|---|---|---|
| 0 | 0 | 0 | 0 |
| 0 | 1 | 1 | 0 |
| 1 | 0 | 1 | 0 |
| 1 | 1 | 0 | 1 |

1+1 เท่ากับ 2 ซึ่งเขียนเป็น 10 ในฐานสอง หลักหน่วยจึงเป็น Sum=0 และทดไปหลักถัดไปเป็น Carry=1

## 2. OR แทน XOR

ที่ A=B=1, XOR=0 แต่ OR=1 จึงผิดเฉพาะ Sum ส่วน Carry จาก AND ยังเป็น 1 อีกสามแถว OR กับ XOR ให้ค่าเหมือนกัน การลองเพียง 00,01,10 จึงจับความผิดนี้ไม่ได้

## 3. ไล่สัญญาณ

ก่อนเปลี่ยน: a=0,b=1,xor=1,and=0,sum=1,carry=0 หลังเปลี่ยน: a=1,b=1,xor=0,and=1,sum=0,carry=1 ต้องพร้อมทั้ง a และ b ก่อนคำนวณ xor/and จากนั้นจึงคำนวณ sum/carry ได้ ตำแหน่งอุปกรณ์บนหน้าจอไม่ใช่ลำดับคำนวณ

ตัวอย่าง feedback: ให้ XOR ส่งผลออกกลับ input ของตัวเอง หรือ XOR → AND → XOR เมื่อใช้ Kahn จะไม่มีทางลด indegree ในวงนั้นให้ครบ จึงคืน CYCLE การต่อ Input ไม่ครบคืน MISSING_INPUT ไม่ยกให้เป็น 0

## 4. เปลี่ยนค่าเริ่มต้นพร้อมทดสอบ

ใน `example()` ของ `src/engine/examples.ts` หลังสร้าง `copy` และก่อน `return copy` เพิ่ม:

```ts
if (id === 'half') {
  const inputA = copy.circuit.components.find(n => n.id === 'a');
  if (inputA) inputA.value = 1;
}
```

ใน `tests/half-adder.test.ts` ภายใน describe เพิ่ม:

```ts
it('starts half-adder at A=1 and B=0', () => {
  const doc = example('half');
  expect(doc.circuit.components.find(n => n.id === 'a')?.value).toBe(1);
  expect(doc.circuit.components.find(n => n.id === 'b')?.value).toBe(0);
  const result = evaluate(doc.circuit);
  expect(result).toMatchObject({
    ok: true, value: { outputs: { sum: 1, carry: 0 } }
  });
  expect(verify(doc.circuit, doc.expected)).toMatchObject({
    ok: true, value: { passing: 4, failing: 0 }
  });
});
```

รัน `npm test` ด้วยตนเอง แล้วบันทึกผลจริง ข้อนี้เป็นตัวอย่างการฝึกที่ยังไม่ได้ใช้กับเวอร์ชันส่งมอบ ซึ่งยังเริ่ม A=B=0 ตามเดิม ถ้าเก็บการเปลี่ยนนี้ต่อ ต้องปรับ browser tests ที่คาดค่าเริ่มต้น A=0 ด้วย ตรวจว่า test ตรงพฤติกรรมใหม่โดยไม่เปลี่ยน reference truth table เพราะสวิตช์เริ่มต้นไม่เปลี่ยนสมการของ half-adder

## 5. ข้อมูลอ้างอิงกับผลคำนวณ

Expected เป็น literal rows `HALF_EXPECTED`/`FULL_EXPECTED` ใน `examples.ts` หรือข้อมูลที่กรอกใน `ExpectedEditor.tsx` Actual สร้างโดย `evaluate()` ใน `simulate.ts` ผ่าน `verify()` ใน `verify.ts` การคัดลอกผล OR ที่ผิดมาเป็น Expected จะทำให้ผิดเหมือนกันทั้งคู่แล้วได้ PASS ที่ไม่ตรงโจทย์ half-adder ถ้า Expected ขาดแถว `validateExpected()` ต้องคืน EXPECTED error ก่อนการเปรียบเทียบ

โปรแกรมจำลองเพียงสถานะ 0 และ 1 ไม่คำนวณแรงดัน กระแส หรือ propagation delay การทดสอบครบไม่ได้รับประกันผลวงจรไฟฟ้าจริง
