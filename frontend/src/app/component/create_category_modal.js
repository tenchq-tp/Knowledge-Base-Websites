"use client";

import React, { useState, useEffect } from "react";
import styles from "../style/create_category_modal.module.css";
import { FaSearch } from "react-icons/fa";
import * as FaIcons from "react-icons/fa";
import Swal from "sweetalert2";
import { FaQuestionCircle } from "react-icons/fa";
import { useTranslation } from "react-i18next";

const colors = [
  "#000000", // Black
  "#555555", // Dark Gray
  "#999999", // Light Gray
  "#f44336", // Red
  "#e91e63", // Pink
  "#9c27b0", // Purple
  "#673ab7", // Deep Purple
  "#3f51b5", // Indigo
  "#2196f3", // Blue
  "#03a9f4", // Light Blue
  "#00bcd4", // Cyan
  "#009688", // Teal
  "#4caf50", // Green
  "#23c686", // Light Green
  "#8bc34a", // Lime
  "#cddc39", // Yellow Green
  "#ffeb3b", // Yellow
  "#999145",
  "#ff9800", // Orange
  "#ff5722", // Deep Orange
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
  const { t } = useTranslation();
  // ✅ ดึงข้อมูลเก่ามาใช้เมื่อ mode = "edit"
  useEffect(() => {
    if (mode === "edit" && categoryData) {
      const [iconName, iconColorRaw] = categoryData.icon.split("_");
      const iconColor = "#" + iconColorRaw; // เติม # นำหน้า
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
      const accessToken = localStorage.getItem("access_token");

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API}/categories${
          mode === "edit" ? `/${categoryData.id}` : ""
        }`,
        {
          method: mode === "edit" ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
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
        title: t("categoryModal.successTitle"),
        text:
          mode === "edit"
            ? t("categoryModal.successUpdate")
            : t("categoryModal.successCreate"),
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
        title: t("categoryModal.errorTitle"),
        text:
          mode === "edit"
            ? t("categoryModal.errorUpdate")
            : t("categoryModal.errorCreate"),
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
          {mode === "edit"
            ? t("categoryModal.editTitle")
            : t("categoryModal.createTitle")}
        </h2>

        <div className={styles.selectedIconPreview}>
          {SelectedIconComponent ? (
            <SelectedIconComponent size={64} color={selectedColor} />
          ) : (
            <FaQuestionCircle size={64} color="#ccc" />
          )}
        </div>
        <h4 className={styles.sectionTitle}>
          {t("categoryModal.selectColorTitle")}
        </h4>
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
        <h4 className={styles.sectionTitle}>
          {t("categoryModal.selectIconTitle")}
        </h4>
        <div className={styles.searchBox}>
          <FaSearch className={styles.searchIcon} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("categoryModal.searchPlaceholder")}
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

        <label className={styles.label}>{t("categoryModal.nameLabel")}</label>
        <input
          className={styles.input}
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t("categoryModal.nameLabelinput")}
        />

        <label className={styles.label}>
          {t("categoryModal.descriptionLabel")}
        </label>
        <input
          className={styles.input}
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={t("categoryModal.descriptionLabelinput")}
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
                ? `${t("categoryModal.updateBtn")}...`
                : `${t("categoryModal.createBtn")}...`
              : mode === "edit"
              ? t("categoryModal.updateBtn")
              : t("categoryModal.createBtn")}
          </button>
          <button
            className={styles.cancelBtn}
            onClick={onClose}
            disabled={loading}
          >
            {t("categoryModal.cancelBtn")}
          </button>
        </div>
      </div>
    </div>
  );
}
