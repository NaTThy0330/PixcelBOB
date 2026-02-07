## **FR-04: Mapping LINE User ↔ Google Account**

**Description:**
ผูก LINE userId เข้ากับ Google Account ที่ login ไว้

* **Flow:**

  * ลูกค้ากด login Google (ผ่านเว็บ) → Backend เก็บว่า LINE userId ไหน map กับ Google Account ไหน
  * ตอน webhook เข้ามา (LINE → Backend) → backend lookup ใน DB ว่า userId นี้ใช้ Google Drive ไหน

* **Backend (Express)**

  * Endpoint `/user/bind` → bind LINE userId กับ Google OAuth token
  * Validation: ถ้า user ยังไม่ login Google → ส่ง error กลับไป

---