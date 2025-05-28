//บอกให้ Next.js รู้ว่าไฟล์นี้ทำงานฝั่ง Client Side, จำเป็นเมื่อคุณใช้ Next.js App Router 
"use client"

//ใช้ useEffect() เพื่อรันโค้ดเมื่อ component ถูกโหลด
import { useEffect, useState } from "react";

// useRouter ใช้สำหรับนำทางไปยังหน้าอื่น, next/navigation คือเวอร์ชันใหม่ที่ใช้ใน App Router
import { useRouter } from "next/navigation";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faHome,
    faUser,
    faGear //เพิ่มไอคอน gear 
} from "@fortawesome/free-solid-svg-icons";

import styles from "../style/navbar.module.css"


export default function Navbar() 
{
    // ใช้เพื่อเปลี่ยนเส้นทาง
     const router = useRouter();

     
     const [ShowSubMenu, setShowSubMenu] = useState(false);
    
     const toggleSubMenu = () => {
         setShowSubMenu(!showSubMenu);
     };

     //     const goToProfile = () => {
//         router.push("/profile");
//     }

     const goTo = (path) =>{
        setShowSubMenu(false); // ซ่อนเมนูหลังคลิก
        router.push(path);
     };

   
    return(
        <nav className={styles.navbarList}>
            {/* Logo */}
            <div className={styles.logo}>
                <FontAwesomeIcon icon={ faHome } className={styles.icon} />
            
            </div> 


            <ul className={styles.navLinks}>
                <li
                    onClick={() => router.push("/pages/home")} className= {styles.navItem}>
                    <FontAwesomeIcon icon={ faHome } className={styles.icon} />
                </li>

                 <li
                    onClick={() => router.push("/pages/profile")} className= {styles.navItem}>
                    <FontAwesomeIcon icon={ faUser } className={styles.icon} />
                </li>

                {/* setting มี 2 อัน คือ settingrole กับ settinguser */}
                 <li
                    onClick={toggleSubMenu} className= {styles.navItem}>
                    <FontAwesomeIcon icon={ faGear } className={styles.icon} />
                </li>

                {ShowSubMenu &&(
                    <div className="styles.subsetting">
                        
                            <li onClick={() => goTo("/setting/settingprofile")}>
                                <FontAwesomeIcon icon= { faUser } /> Setting Profile
                            </li>

                            <li onClick={() => goTo("/setting/settingrole")}>
                                <FontAwesomeIcon icon= { faUser }  /> Setting Role
                            </li>
                        
                    </div>
                )}

            </ul>

        </nav>
        
    );
}



 //router.push("/login") จะเปลี่ยนหน้าไป /login เมื่อกดปุ่ม   
    //const goToHome = () => {
        //router.push("/home");
  //}



//      const goToSetting = () => {
//         router.push("/setting");
//     }