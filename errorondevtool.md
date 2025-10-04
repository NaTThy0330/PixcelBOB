dd LIFF initialization to frontend App.tsx

ต้อง init ด้วย LIFF_ID ที่คุณได้จาก LINE Developers Console

ตัวอย่าง:

import { useEffect } from "react";
import liff from "@line/liff";

function App() {
  useEffect(() => {
    liff.init({ liffId: process.env.REACT_APP_LIFF_ID as string })
      .then(() => {
        console.log("LIFF init success");
      })
      .catch((err) => {
        console.error("LIFF init failed", err);
      });
  }, []);

  return <div>Hello LIFF</div>;
}

export default App;


Update frontend login flow to get LINE userId from LIFF

หลัง init สำเร็จ คุณสามารถเอา user profile ได้เลย:

const profile = await liff.getProfile();
console.log(profile.userId, profile.displayName);


Add LIFF_ID environment variable to Vercel

เวลา deploy ไป Vercel ต้องเก็บ LIFF_ID ไว้ใน env (ไม่เขียน hard-code ในไฟล์)

ตัวอย่าง .env.local

REACT_APP_LIFF_ID=1234567890-AbCdEf


Test LIFF login flow

เปิด OA → กดเมนู rich menu หรือปุ่มที่เปิด LIFF

ถ้า flow ถูกต้อง → จะเห็นหน้าจอเว็บเปิดขึ้นใน LINE และโค้ดสามารถดึง profile user ได้