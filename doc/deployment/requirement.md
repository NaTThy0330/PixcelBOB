
🎯 Project-Specific DevOps Plan

(LINE → Google Drive Automation Platform)

เป้าหมาย:
Deploy ได้ซ้ำ, คุมความเสี่ยง, มองเห็นระบบ, และอธิบายได้ว่า “ทำไมออกแบบแบบนี้”

⸻

Phase 0 — System Readiness (ปรับจากของเดิม)

ทำอะไรบ้าง (เฉพาะที่จำเป็น)
 • แยก service ชัดเจน
 • frontend (React)
 • backend-api (Express)
 • upload-worker
 • config ผ่าน env ทั้งหมด
 • แยก .env.example
 • logging เป็น JSON (เตรียมเข้า ELK)

เหตุผล (ไว้เล่า)

เพื่อให้แต่ละ component deploy, scale, และ monitor แยกกันได้

⸻

Phase 1 — Containerization (Lean แต่ production-ready)

Docker Strategy

Service Base Image Notes
frontend node + nginx multi-stage build
backend node:18-alpine non-root
worker node:18-alpine shared base

สิ่งที่ “ต้องมี”
 • deterministic build
 • non-root user
 • healthcheck

📌 ไม่ทำ
 • image optimization เชิงลึก (ยังไม่จำเป็น)

⸻

Phase 2 — Repo & Version Control (Simple แต่ trace ได้)

โครง repo (mono-repo)

/frontend
/backend
/worker
/infra
/Jenkinsfile

Strategy
 • branch: main, develop
 • tag: v1.0.0

📌 เหตุผล:

ง่ายต่อ CI/CD และ audit (bank-style)

⸻

Phase 3 — CI Pipeline (Quality > Speed)

Jenkins Pipeline (ปรับให้เหมาะ)

Stages
 1. Checkout
 2. Install deps
 3. Unit test (backend)
 4. Build Docker images
 5. Trivy scan
 6. Push image (ECR)

📌 ไม่ทำ
 • SonarQube deep analysis
 • e2e test

สิ่งที่ได้ตอบ JD
 • Jenkins
 • Linux
 • Security scan
 • Automation

⸻

Phase 4 — Infrastructure as Code (Minimum แต่จริง)

Terraform Scope
 • AWS VPC (public + private)
 • EKS (1 node group)
 • IAM (least privilege)
 • ALB Ingress Controller

📌 ไม่ทำ
 • multi-region
 • auto-scaling group ซับซ้อน

โครง env
 • dev
 • prod

⸻

Phase 5 — Kubernetes Deployment (Stable First)

K8s Objects
 • Deployment (3 services)
 • Service
 • Ingress
 • ConfigMap / Secret

สิ่งที่ “ต้องมี”
 • resource request/limit
 • readiness / liveness probe
 • rolling update

📌 เหตุผล:

ป้องกัน deploy แล้วระบบล่ม

⸻

Phase 6 — CD with Governance (หัวใจ DevOps ธนาคาร)

Deployment Flow

Commit → Jenkins
      → Deploy dev
      → Manual approve
      → Deploy prod

📌 ไม่มี auto-prod

ตอบ JD
 • deployment strategy
 • operational control
 • quality gate

⸻

Phase 7 — Observability (System-Aware)

Monitoring Strategy (ปรับให้ตรงระบบ)

Metrics
 • upload_success_rate
 • upload_latency
 • pending_uploads_count
 • webhook_error_rate

Tools
 • Prometheus
 • Grafana
 • ELK (basic)

📌 Dashboard เดียวพอ

⸻

Phase 8 — Alerting & Incident (Document-Driven)

Alert ตัวอย่าง
 • upload success < 95%
 • queue backlog > threshold
 • webhook error spike

📌 Incident Playbook (1 หน้า)
 • symptom
 • possible cause
 • action

⸻

Phase 9 — Security Hardening (Just Enough)

ทำจริง
 • non-root container
 • secret via env / k8s secret
 • webhook signature verification
 • IAM least privilege

📌 ไม่ต้อง pentest

⸻

Phase 10 — Documentation & Resume

เอกสารที่ต้องมี
 1. Architecture diagram
 2. DevOps flow diagram
 3. Monitoring dashboard screenshot
 4. Resume bullets

