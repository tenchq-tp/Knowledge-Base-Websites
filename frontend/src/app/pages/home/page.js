//บอกให้ Next.js รู้ว่าไฟล์นี้ทำงานฝั่ง Client Side
//จำเป็นเมื่อคุณใช้ Next.js App Router 
"use client"

//ใช้ useEffect() เพื่อรันโค้ดเมื่อ component ถูกโหลด
//import { useEffect } from "react";


// useRouter ใช้สำหรับนำทางไปยังหน้าอื่น
// next/navigation คือเวอร์ชันใหม่ที่ใช้ใน App Router
import { useRouter } from "next/navigation";


 // ดึง Navbar component มาใช้ 
 //"../../folder/__filename_.__นามสกุล file"
import Navbar from "../../component/Navbar";
import styles from "../../style/home.module.css";



// Function Homepage เป็น Component หลัก
export default function Homepage() 
{
    const router =  useRouter();

    const handleLogout = () => {        //ประกาศฟังก์ชันชื่อ handleLogout เป็น arrow function ใช้สำหรับจัดการเหตุการณ์เมื่อผู้ใช้กดปุ่มออกจากระบบ
    localStorage.removeItem("token");   //ปกติ token นี้คือ JWT token ที่ใช้ยืนยันตัวตนของผู้ใช้หลังจาก login เมื่อลบ token ออก ระบบจะไม่สามารถระบุตัวตนของผู้ใช้ได้อีก เท่ากับว่า "ออกจากระบบ"
    router.push("/");                   // หลัง logout จะพาผู้ใช้กลับไปหน้าแรก
 };

    
    const goBack = () => {
        router.push ('/page');
    }


    return(
        <div className={styles.homepage}>

            {/*✅ ใส่ Navbar เพื่อแสดงเมนู  */}
            <Navbar/> 
            <h1 className={styles.title}> Home page </h1>
            
        </div>
    );
}
