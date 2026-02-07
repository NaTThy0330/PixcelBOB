
# 📌 Feature Requirements (ตาม Tech Stack)

## **FR-01: User Authentication (Google OAuth2)**

**Description:**
ลูกค้า login ด้วย Google Account เพื่อ authorize การอัพโหลดไฟล์เข้า Drive ของตัวเอง

* **Frontend (Next.js)**

  * ปุ่ม **"Login with Google"**
  * Redirect ไป Google OAuth consent screen
  * แสดงผลว่า login สำเร็จ

* **Backend (Express)**

  * Endpoint `/auth/google` → เริ่ม OAuth flow
  * Endpoint `/auth/google/callback` → รับ authorization code, แลกเป็น `access_token` และ `refresh_token`
  * เก็บข้อมูลลง PostgreSQL:

    * `line_user_id`
    * `google_email`
    * `google_refresh_token`
    * `google_folder_id` (optional, ถ้าให้เลือก folder)

* **DB Schema** (table: `users`)

  ```sql
  id SERIAL PRIMARY KEY,
  line_user_id TEXT UNIQUE,
  google_email TEXT,
  google_refresh_token TEXT,
  google_folder_id TEXT
  ```

---
