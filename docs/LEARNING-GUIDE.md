Built by Olivia — https://discord.gg/ojailbreaks

# เรียนรู้ LogicLab จากวงจรที่คุ้นเคย

อ่านพร้อมเปิดโปรแกรม แล้วทำ [แบบฝึกหัด](EXERCISES.md) ก่อนเปิด [เฉลย](ANSWERS.md) เป้าหมายคืออธิบายและแก้ไขได้ด้วยตัวเอง ไม่ใช่จำคำพูด

## 1. จากสวิตช์บน breadboard สู่ Bit

โปรแกรมแทนสถานะดิจิทัลด้วย `type Bit = 0 | 1` ใน `src/engine/types.ts` ค่า 0 หมายถึง LOW และ 1 หมายถึง HIGH ในแบบจำลอง ไม่ได้หมายความว่าโปรแกรมคำนวณแรงดัน 0 V หรือ 5 V จริง บน breadboard ต้องมีวงจรไฟเลี้ยงและระดับแรงดันที่ถูกต้อง แต่โปรแกรมนี้ไม่มีการคำนวณไฟฟ้าเหล่านั้น

| A | B | AND | OR | XOR |
|---|---|---|---|---|
| 0 | 0 | 0 | 0 | 0 |
| 0 | 1 | 0 | 1 | 1 |
| 1 | 0 | 0 | 1 | 1 |
| 1 | 1 | 1 | 1 | 0 |

NOT กลับค่า: `NOT 0 = 1`, `NOT 1 = 0` ส่วน Output indicator แสดงค่าจาก input ของตัวเอง

`gate()` ใน `src/engine/simulate.ts` ใช้ `a & b`, `a | b`, `a ^ b` สำหรับ AND, OR, XOR และเงื่อนไขสำหรับ NOT เครื่องหมายเหล่านี้เป็น bitwise operators ของ JavaScript แต่ในที่นี้รับเฉพาะ Bit จึงให้ผลตาม Boolean logic ที่ต้องการ การจำกัดชนิด TypeScript ช่วยระหว่างเขียนโค้ด ส่วน JSON ภายนอกต้องตรวจค่าขณะรันด้วย `parseDocument()`

## 2. Half-adder คือการบวกเลขฐานสองหนึ่งหลัก

`0+0=0`, `0+1=1`, `1+0=1`, `1+1=10` ในฐานสอง กรณีสุดท้าย Sum เป็น 0 และ Carry เป็น 1

```text
Sum   = A XOR B
Carry = A AND B
```

เปิด `example('half')` ใน `src/engine/examples.ts` จะพบ Input `a`, `b`, gate `xor`, `and`, Output `sum`, `carry` สาย `w1` ส่งค่าจาก `a` ไป input port 0 ของ `xor` ส่วน `w2` ส่ง `b` ไป port 1 ของ gate เดียวกัน หนึ่ง output ต่อไปได้หลาย input เรียกว่า fan-out

ตัวอย่างเสียเปลี่ยนชนิดของ node `xor` เป็น OR แต่เก็บ ID และ Expected table เดิม จึงตรวจพบความต่างที่ A=B=1 ได้

## 3. Full-adder รับ Carry-in เพิ่ม

ใน `example('full')` มี `cin` เพิ่มอีกหนึ่งอินพุต รวม 3 inputs จึงมี 8 กรณี

```text
X         = A XOR B
Sum       = X XOR Carry-in
Carry-out = (A AND B) OR (X AND Carry-in)
```

เช่น A=1, B=0, Carry-in=1 รวมเท่ากับ 2 หรือ `10₂`: X=1, Sum=0, Carry-out=1 ถ้า A=B=Carry-in=1 รวมเท่ากับ `11₂`: Sum=1 และ Carry-out=1 ค่าอ้างอิงทั้งแปดแถวถูกเขียนแยกไว้ใน `FULL_EXPECTED` และไม่ได้เรียก `evaluate()` เพื่อสร้างคำตอบอ้างอิง

## 4. Components กับ connections เป็นกราฟ

ข้อมูลจำลองไม่ใช้ React Flow Node โดยตรง แต่ใช้ object ธรรมดาใน `types.ts`:

```ts
// ตัวอย่างข้อมูลจริงในรูปแบบของโปรเจกต์
const component = { id: 'a', kind: 'INPUT', label: 'A', value: 0,
  position: { x: 40, y: 65 } };
const connection = { id: 'w1', source: 'a', target: 'xor', port: 0 };
```

Component คือจุด (node) และ connection คือเส้นมีทิศทาง (directed edge) `position` ใช้จัดวางบนหน้าจอ ไม่ได้เปลี่ยน Boolean result ส่วน `port` ระบุ input ตัวไหนของปลายทาง Input switch ไม่มี input port; NOT และ OUTPUT มีหนึ่ง port; AND/OR/XOR มีสอง port

`validateCircuit()` ตรวจขีดจำกัด, ID ซ้ำ, ทิศทาง, พอร์ต, driver และ input ที่ขาดก่อนอนุญาตให้คำนวณ การไม่มีสายไม่ได้แปลว่า 0 ถ้า input ขาด โปรแกรมคืน `{ ok: false, errors: [...] }` และไม่คืนคำตอบจำลองที่ดูเหมือนถูกต้อง

## 5. ทำไมต้องเรียงลำดับก่อนคำนวณ

ถ้าคำนวณ Sum ก่อน XOR จะยังไม่มีค่าจาก XOR การเรียง array ตามตำแหน่งที่เพิ่มอุปกรณ์จึงใช้แทนลำดับคำนวณไม่ได้

`validateCircuit()` ใช้ Kahn's algorithm:

1. นับ `indegree` หรือจำนวนสายขาเข้าของแต่ละ node และสร้างรายการปลายทาง `outgoing`
2. ใส่ node ที่ indegree เป็น 0 ลงใน queue
3. หยิบ node ออกจาก queue บันทึกลง `order` แล้วลด indegree ของปลายทางของทุกสายจาก node นั้น
4. เมื่อ indegree ของปลายทางเป็น 0 จึงใส่ปลายทางใน queue
5. ถ้าจำนวน node ที่หยิบได้ไม่ครบ แสดงว่ามีเส้นทางย้อนกลับหรือ feedback loop จึงไม่ประเมินวงจร

ตัวอย่างลำดับที่ใช้ได้สำหรับ half-adder คือ `a, b, xor, and, sum, carry` ลำดับอื่นก็ถูกได้ เช่นสลับ `and` กับ `xor` หากต้นทางพร้อมก่อนปลายทาง ลำดับไม่จำเป็นต้องเหมือนกันทุกครั้ง แต่ผลต้องเหมือนกัน ซึ่งมี test กลับลำดับ components และ connections เพื่อตรวจประเด็นนี้

นับสายแยกกันแม้สองสายมาจาก source เดียวกันไปคนละ port เพราะแต่ละ port ต้องพร้อม วน queue แบบใช้ดัชนี `head` แทน `shift()` เพื่อไม่ต้องเลื่อน array ซ้ำ ขั้นจัดลำดับมีเวลา O(V+E) และใช้หน่วยความจำ O(V+E) ภายใต้ขีดจำกัดของโปรแกรม ส่วนการตรวจทั้งหมดมีขั้นอื่นเพิ่มเติม จึงไม่อ้างว่าแอปทั้งตัวมีเวลาเท่านี้

`evaluate()` เดิน `order` แล้วเก็บคำตอบแต่ละ node ใน `signals` Input อ่านจาก assignment ที่ระบุครบ หรือ switch state ส่วน gate อ่านค่าต้นทางตาม input port แล้วเรียก `gate()` Output เก็บใน `outputs` ด้วย

## 6. Exhaustive truth-table testing

`inputCombinations(n)` ใน `verify.ts` สร้างทุกแถวตั้งแต่ `00...0` ถึง `11...1` ถ้า n=2 มี 4 แถว ถ้า n=6 มี 64 แถว `verify()` ส่งแต่ละ assignment เข้า `evaluate()` เพื่อสร้าง Actual

Expected เป็นสเปกอ้างอิงซึ่งอาจคำนวณด้วยมือหรือเขียนแยกต่างหาก ในตัวอย่างเก็บเป็น literal rows ใน `HALF_EXPECTED` และ `FULL_EXPECTED` กรณีวงจรที่สร้างเอง ผู้ใช้กรอกใน Expected editor ระบบไม่คัดลอก Actual มาเป็น Expected อัตโนมัติ ถ้าทั้งสองฝ่ายใช้วงจรเดียวกันสร้างคำตอบ ความผิดเดียวกันอาจหลุดผ่านทั้งคู่

การผ่านทุกแถวหมายถึง Actual ตรงกับ Expected ทุกกรณีไบนารีที่กำหนด ไม่ได้ยืนยันว่า Expected ถูกต้องตามโจทย์จริง และไม่ได้พิสูจน์พฤติกรรมแรงดันหรือเวลา ถ้าไม่มี Expected โปรแกรมแสดง Actual table และไม่อ้างว่าผ่าน

## 7. React สื่อสารกับ engine อย่างไร

```text
กด Input A
  → toggle('a') ใน App.tsx เปลี่ยน document.circuit.components
  → useMemo เรียก evaluate(document.circuit)
  → signals และ outputs ส่งให้ CircuitNode กับ Live Signals

กด Check all inputs
  → runVerification() เรียก verify(circuit, expected)
  → บันทึกผล verification ใน state
  → React วาดแถว Expected / Actual / PASS / FAIL
```

`CircuitNode.tsx` วาดอุปกรณ์และพอร์ต ส่วน React Flow จัดการการลากและเชื่อมต่อ `connect()` แปลง event จากหน้าจอเป็น connection ของ engine และตรวจกราฟก่อนยอมรับ เมื่อแก้วงจรที่มีผลต่อคำตอบ `functionalChange()` ล้างผล verification เก่าเพื่อไม่ให้แสดงผลผ่านที่ล้าสมัย การเปลี่ยนตำแหน่งและการ toggle ไม่เปลี่ยนความสัมพันธ์ใน truth table จึงคงผลตรวจครบทุกกรณีได้

`persistence.ts` แปลง JSON ที่เป็น `unknown` ให้เป็นข้อมูลที่ผ่านการตรวจและสร้าง object ใหม่เฉพาะฟิลด์ที่รู้จัก ก่อนโหลดแทนวงจรเดิม การทดสอบไฟล์ผิดจึงควรเห็น error พร้อมยังใช้งานวงจรเดิมได้

## 8. เริ่มอ่านและแก้โค้ดตามลำดับนี้

เริ่ม `types.ts` → `examples.ts` → `simulate.ts` → `verify.ts` → `tests/half-adder.test.ts` แล้วตามไปดู `toggle()` และ `runVerification()` ใน `App.tsx` คำอธิบายที่ดีควรเชื่อมพฤติกรรมบนหน้าจอเข้ากับชื่อ function จริงได้ ทดลองเปลี่ยนหนึ่งพฤติกรรมและเพิ่ม test ตามแบบฝึกหัดก่อนกล่าวว่าแก้โค้ดได้ด้วยตนเอง
