## **FR-07: Deployment & Infra**

**Description:**
Deploy บน VPS ฟรี/ราคาถูก

* **Docker Compose**

  * Service: backend (Express)
  * Service: frontend (Next.js)
  * Service: postgres
  * Service: redis (ถ้าใช้ queue)
* **Env Config**

  * `LINE_CHANNEL_SECRET`
  * `LINE_CHANNEL_ACCESS_TOKEN`
  * `GOOGLE_CLIENT_ID`
  * `GOOGLE_CLIENT_SECRET`
  * `DB_URL`

---