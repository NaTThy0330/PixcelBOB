# วิธีตรวจสอบปัญหา Authentication

## 1. เปิด Browser Console (F12)

ดูว่ามี log อะไรแสดงขึ้นมาบ้าง:

### ตรวจสอบ Token
```javascript
// ดูว่ามี token ในระบบหรือไม่
localStorage.getItem('authToken')
```

ถ้าได้ `null` แสดงว่าไม่มี token = ยังไม่ได้ login

### ตรวจสอบการ Login
เมื่อคลิก "Login with Google" ควรจะ:
1. Redirect ไปหน้า Google
2. หลัง login สำเร็จ จะกลับมาที่ `http://localhost:3000?token=xxxxx`
3. ดู console ควรเห็น "Token received from OAuth callback"

## 2. ถ้า Login แล้วแต่ Token หาย

ลองตรวจสอบ:

### A. Backend ทำงานหรือไม่
```bash
curl http://localhost:5000/health
```

### B. ตรวจสอบ Token ด้วย API โดยตรง
```javascript
// ถ้ามี token ให้ลองเรียก API
const token = localStorage.getItem('authToken');
fetch('http://localhost:5000/auth/verify', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
}).then(r => r.json()).then(console.log)
```

### C. ดู Network Tab
1. เปิด Developer Tools > Network
2. Refresh หน้า
3. ดูว่ามี request ไป `/auth/verify` หรือไม่
4. ถ้า 401 = token ไม่ถูกต้อง

## 3. วิธีแก้ไขเบื้องต้น

### ลบ Token เก่าและ Login ใหม่
```javascript
localStorage.clear();
location.href = 'http://localhost:3000';
```

### ตรวจสอบ Backend Logs
ดูใน terminal ที่รัน backend ว่ามี error อะไรหรือไม่

## 4. ปัญหาที่พบบ่อย

### A. Token หมดอายุ
- JWT token มีอายุ 7 วัน
- ถ้าหมดอายุต้อง login ใหม่

### B. Backend restart แล้ว session หาย
- ถ้า restart backend, session อาจหาย
- ต้อง login ใหม่

### C. Cookie/CORS Issues
- ตรวจสอบว่า backend CORS allow `http://localhost:3000`
- ตรวจสอบว่า browser ไม่ได้ block cookies

## 5. Debug Step by Step

1. **Clear Everything**
   ```javascript
   localStorage.clear();
   sessionStorage.clear();
   ```

2. **Login ใหม่**
   - คลิก "Login with Google"
   - ดู console ต้องเห็น "Token received from OAuth callback"

3. **ตรวจสอบ Token**
   ```javascript
   localStorage.getItem('authToken')
   ```
   ต้องได้ token ที่ไม่ใช่ null

4. **ถ้ายังไม่ได้**
   - ดู backend logs
   - ดูว่า Google OAuth redirect URI ถูกต้องหรือไม่
   - ตรวจสอบ `.env` ทั้ง frontend และ backend