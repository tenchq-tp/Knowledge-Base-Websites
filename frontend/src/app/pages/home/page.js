"use client";

import { useRouter } from "next/navigation";

import Navbar from "../../component/Navbar";
import styles from "../../style/home.module.css";

export default function Homepage() {
  const router = useRouter();

  const handleLogout = () => {};

  return (
    <>
      <Navbar />
      <div className={styles.container}>
        <h1 className={styles.title}>Home Page </h1>
      </div>
    </>
  );
}
