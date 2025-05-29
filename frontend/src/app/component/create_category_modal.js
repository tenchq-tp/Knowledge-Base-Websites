"use client";

import React, { useState, useEffect } from "react";
import styles from "../style/create_category_modal.module.css";
import { FaSearch } from "react-icons/fa";
import * as FaIcons from "react-icons/fa";
import Swal from "sweetalert2";
import { FaQuestionCircle } from "react-icons/fa";
const colors = [
  "#000000", // Black
  "#555555", // Dark Gray
  "#23c686", // Green
  "#f44336", // Red
  "#ff9800", // Orange
  "#2196f3", // Blue
  "#9c27b0", // Purple
  "#009688", // Teal
  "#e91e63", // Pink
  "#795548", // Brown
];
const categoryIcons = [
  "FaBook", // หนังสือ, ความรู้
  "FaGraduationCap", // การศึกษา
  "FaLaptopCode", // โปรแกรมเมอร์, เทคโนโลยี
  "FaBriefcase", // ธุรกิจ, งาน
  "FaChartLine", // สถิติ, วิเคราะห์
  "FaMicroscope", // วิทยาศาสตร์
  "FaUsers", // ชุมชน, กลุ่มคน
  "FaMapMarkerAlt", // สถานที่
  "FaTools", // เครื่องมือ, งานช่าง
  "FaTree", // ธรรมชาติ, สิ่งแวดล้อม
  "FaPaintBrush", // ศิลปะ, การออกแบบ
  "FaAppleAlt", // สุขภาพ, อาหาร
  "FaFootballBall", // กีฬา
  "FaLightbulb", // ไอเดีย, นวัตกรรม
  "FaGlobe", // โลก, ภูมิศาสตร์
  "FaLanguage", // ภาษา
  "FaHeadphones", // ดนตรี, เสียง
  "FaCamera", // การถ่ายภาพ
  "FaFilm", // ภาพยนตร์, สื่อ
  "FaClock", // เวลา, การจัดการเวลา
  "FaShieldAlt", // ความปลอดภัย
  "FaHeart", // สุขภาพ, ความรัก
  "FaMoneyBillWave", // การเงิน, ธุรกิจ
  "FaCode", // การเขียนโปรแกรม
  "FaRocket", // เทคโนโลยี, การเริ่มต้น
  "FaNewspaper", // ข่าวสาร, บทความ
  "FaStar", // ความโดดเด่น, คะแนน
  "FaCloud", // เทคโนโลยี, อินเทอร์เน็ต
  "FaEnvelope", // การสื่อสาร
  "FaCogs", // การตั้งค่า, เครื่องจักร
  "FaComments", // การสนทนา
  "FaUserGraduate", // นักศึกษา
  "FaChalkboardTeacher", // การสอน
  "FaBicycle", // การเดินทาง, กีฬา
  "FaShoppingCart", // การซื้อขาย
  "FaBuilding", // องค์กร, สำนักงาน
  "FaCalculator", // คณิตศาสตร์, การคำนวณ
  "FaBug", // โปรแกรม, แก้บั๊ก
  "FaCalendarAlt", // ปฏิทิน, วันเวลา
  "FaBus", // การขนส่ง
  "FaCar", // ยานพาหนะ
  "FaFileAlt", // เอกสาร
  "FaBriefcaseMedical", // การแพทย์
  "FaQuestionCircle", // คำถาม, ช่วยเหลือ
  "FaSearch", // ค้นหา
  "FaUtensils", // อาหาร
  "FaCloudSun", // สภาพอากาศ
  "FaWifi", // อินเทอร์เน็ต
  "FaPlug", // ไฟฟ้า
  "FaUser", // ผู้ใช้
  "FaGlasses", // การอ่าน, สติปัญญา
  "FaMusic", // เพลง
  "FaMobileAlt", // โทรศัพท์มือถือ
  "FaVideo", // วิดีโอ
  "FaLock", // ความปลอดภัย
  "FaCarBattery", // ยานพาหนะ, พลังงาน
  "FaSeedling", // การเกษตร
  "FaPlane", // การเดินทาง
  "FaAnchor", // ทะเล, การเดินเรือ
  "FaGift", // ของขวัญ, กิจกรรม
  "FaHotel", // ที่พัก
  "FaFire", // ไฟ, ความร้อน
  "FaGavel", // กฎหมาย
  "FaBookOpen", // การเรียนรู้
  "FaHeadset", // การสนทนา, ลูกค้า
  "FaUsersCog", // การบริหาร
  "FaGlobeAmericas", // โลก
  "FaChartPie", // กราฟ, สถิติ
  "FaKeyboard", // เทคโนโลยี
  "FaUniversity", // มหาวิทยาลัย
  "FaPager", // การสื่อสาร
  "FaReceipt", // ใบเสร็จ, การเงิน
  "FaWind", // พลังงาน
  "FaCodeBranch", // โค้ด
  "FaFutbol", // กีฬา
  "FaHandshake", // การเจรจา
  "FaShoppingBag", // การช็อปปิ้ง
  "FaSmile", // อารมณ์
  "FaUserTie", // ธุรกิจ, ผู้บริหาร
  "FaSuitcase", // การเดินทาง, ธุรกิจ
  "FaLaptop", // คอมพิวเตอร์
  "FaGem", // คุณค่า
  "FaDatabase", // ฐานข้อมูล
  "FaBell", // การแจ้งเตือน
  "FaBookReader", // การอ่าน
  "FaChalkboard", // การสอน
  "FaHandsHelping", // ช่วยเหลือ
];
export default function CreateCategoryModal({
  onClose,
  mode = "create",
  categoryData = null,
}) {
  const [search, setSearch] = useState("");
  const [selectedIcon, setSelectedIcon] = useState(null);
  const [selectedColor, setSelectedColor] = useState("#000000");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // ✅ ดึงข้อมูลเก่ามาใช้เมื่อ mode = "edit"
  useEffect(() => {
    if (mode === "edit" && categoryData) {
      const [iconName, iconColor] = categoryData.icon.split("_");
      setSelectedIcon(iconName);
      setSelectedColor(colors.includes(iconColor) ? iconColor : "#000000");
      setName(categoryData.name || "");
      setDescription(categoryData.description || "");
    }
  }, [mode, categoryData]);

  const icons = categoryIcons.filter((iconName) =>
    iconName.toLowerCase().includes(search.toLowerCase())
  );

  const SelectedIconComponent = selectedIcon ? FaIcons[selectedIcon] : null;

  const handleCreate = async () => {
    setLoading(true);
    setError(null);

    const iconName = selectedIcon ? selectedIcon : "FaQuestionCircle";
    const iconColor = selectedIcon ? selectedColor : "#ccc";

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/categories${
          mode === "edit" ? `/${categoryData.id}` : ""
        }`,
        {
          method: mode === "edit" ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            icon: `${iconName}_${iconColor.replace("#", "")}`,
            name,
            description,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to save category");
      }

      const data = await response.json();

      const result = await Swal.fire({
        icon: "success",
        title: "Success!",
        text: `Category ${
          mode === "edit" ? "updated" : "created"
        } successfully.`,
        showCancelButton: true,
        confirmButtonText: "Yes",
        cancelButtonText: "No",
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
      });

      if (result.isConfirmed) {
        onClose();
        window.location.reload();
      }
    } catch (err) {
      setError(err.message || "Something went wrong");

      Swal.fire({
        icon: "error",
        title: "Failed!",
        text:
          err.message ||
          `Failed to ${mode === "edit" ? "update" : "create"} category.`,
        confirmButtonColor: "#d33",
        confirmButtonText: "OK",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <h2 className={styles.headerTitle}>
          {mode === "edit" ? "Edit Category" : "Create Category"}
        </h2>

        <div className={styles.selectedIconPreview}>
          {SelectedIconComponent ? (
            <SelectedIconComponent size={64} color={selectedColor} />
          ) : (
            <FaQuestionCircle size={64} color="#ccc" />
          )}
        </div>

        <div className={styles.colorPicker}>
          {colors.map((color) => (
            <div
              key={color}
              className={`${styles.colorCircle} ${
                selectedColor === color ? styles.colorSelected : ""
              }`}
              style={{ backgroundColor: color }}
              onClick={() => setSelectedColor(color)}
            />
          ))}
        </div>

        <div className={styles.searchBox}>
          <FaSearch className={styles.searchIcon} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search icons..."
            style={{ color: "black" }}
          />
        </div>

        <div className={styles.iconGrid}>
          {icons.slice(0, 100).map((iconName) => {
            const Icon = FaIcons[iconName];
            return (
              <div
                key={iconName}
                className={`${styles.iconItem} ${
                  selectedIcon === iconName ? styles.selected : ""
                }`}
                onClick={() => setSelectedIcon(iconName)}
              >
                <Icon size={24} color="#555" />
              </div>
            );
          })}
        </div>

        <label className={styles.label}>Category Name *</label>
        <input
          className={styles.input}
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter category name..."
        />

        <label className={styles.label}>Description (optional)</label>
        <input
          className={styles.input}
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Enter short description..."
        />

        {error && <p style={{ color: "red" }}>{error}</p>}

        <div className={styles.buttonGroup}>
          <button
            className={styles.createBtn}
            onClick={handleCreate}
            disabled={!name || loading}
          >
            {loading
              ? mode === "edit"
                ? "Updating..."
                : "Creating..."
              : mode === "edit"
              ? "Update"
              : "Create"}
          </button>
          <button
            className={styles.cancelBtn}
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
