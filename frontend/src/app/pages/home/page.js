"use client";

//ใช้ useEffect() เพื่อรันโค้ดเมื่อ component ถูกโหลด
//import { useEffect } from "react";

// useRouter ใช้สำหรับนำทางไปยังหน้าอื่น
// next/navigation คือเวอร์ชันใหม่ที่ใช้ใน App Router
import { useRouter } from "next/navigation";

// ดึง Navbar component มาใช้
//"../../folder/__filename_.__นามสกุล file"
import Navbar from "../../component/Navbar";
import styles from "../../style/home.module.css";

export default function Homepage() {
  const router = useRouter();

  return (
    <>
      <Navbar />
      <div className={styles.container}>
        <h1 className={styles.title}>Home Page </h1>
      </div>
    </>
  );
}
