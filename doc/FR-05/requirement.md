## **FR-05: Queue Processing (Optional, สำหรับ scale)**

**Description:**
ใช้ Queue กัน overload เวลา upload รูปเยอะพร้อมกัน

* **Backend**

  * ใช้ **BullMQ (Redis)**
  * Job: "upload-image-to-drive"
  * Worker: process job (ดึงไฟล์จาก LINE → upload ไป Google Drive)
  * Retry logic: retry ถ้า Google API fail ชั่วคราว

---