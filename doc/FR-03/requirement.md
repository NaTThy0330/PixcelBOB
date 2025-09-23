## **FR-03: Upload to Google Drive**

**Description:**
อัพโหลดไฟล์ที่ดึงจาก LINE ไปยัง Google Drive ของลูกค้า

* **Backend (Express)**

  * Service function `uploadToDrive(binary, userToken, folderId)`
  * Refresh access token จาก refresh token (ถ้า access token หมดอายุ)
  * อัพโหลดไฟล์ขึ้น Drive (`drive.files.create`)
  * Response: เก็บ log ไฟล์ (ชื่อ, ขนาด, Google Drive fileId)

* **DB Schema** (table: `uploads`)

  ```sql
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id),
  file_name TEXT,
  file_id TEXT,   -- Google Drive fileId
  created_at TIMESTAMP DEFAULT now()
  ```

---