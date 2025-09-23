# 📋 Feature Requirements for LINE to Google Drive Integration
## **FR-02: LINE Webhook Integration**

**Description:**
รับรูปจาก LINE Official Account (OA)

* **Backend (Express)**

  * Endpoint `/line/webhook` รองรับ LINE webhook
  * ตรวจสอบ signature จาก LINE (security)
  * เมื่อมี `message.type == "image"` → ดึง `messageId`
  * เรียก LINE Content API → ดึง binary ของไฟล์

---
