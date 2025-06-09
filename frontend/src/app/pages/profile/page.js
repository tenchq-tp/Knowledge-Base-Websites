"use client";

import { useState, useEffect } from "react";
import {
  FaIdBadge,
  FaUser,
  FaPhone,
  FaBirthdayCake,
  FaVenusMars,
  FaGlobe,
  FaCity,
  FaMapMarkedAlt,
  FaEdit,
  FaFacebookF,
  FaInstagram,
  FaLine,
  FaDiscord,
} from "react-icons/fa";

import Navbar from "../../component/Navbar";
import { useTranslation } from "react-i18next";
import { useTheme } from "../../contexts/ThemeContext";
import Swal from "sweetalert2";
import "../../../lib/i18n";
import styles from "../../style/profile.module.css";

export default function ProfilePage() {
  const { t, i18n } = useTranslation();
  const { tokens, isDark } = useTheme();
  const [profile, setProfile] = useState(null);
  const [isEditingPersonal, setIsEditingPersonal] = useState(false);
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    const fetchProfile = async () => {
      const accessToken = localStorage.getItem("access_token");
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API}/profiles/me`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        const data = await res.json();
        setProfile(data);
        setFormData(data);
      } catch (err) {
        console.error("Failed to fetch profile", err);
      }
    };
    fetchProfile();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async (section) => {
    const accessToken = localStorage.getItem("access_token");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API}/profiles/me`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error("Update failed");
      const updated = await res.json();
      setProfile(updated);
      if (section === "personal") setIsEditingPersonal(false);
      if (section === "address") setIsEditingAddress(false);

      const successMessage =
        section === "personal"
          ? t("profile.savePersonalSuccess") || "บันทึกข้อมูลส่วนตัวสำเร็จ"
          : t("profile.saveAddressSuccess") || "บันทึกที่อยู่สำเร็จ";

      Swal.fire({
        icon: "success",
        title: t("profile.saveSuccess") || "บันทึกโปรไฟล์สำเร็จ",
        timer: 1500,
        showConfirmButton: false,
        background: tokens.surface, // ใช้ theme
        color: tokens.success, //  ใช้ theme
        confirmButtonColor: tokens.success, //  ใช้ theme
      });
    } catch (err) {
      console.error("Failed to update profile", err);
      Swal.fire({
        icon: "error",
        title: t("profile.saveFailed") || "บันทึกไม่สำเร็จ",
        text: err.message,
        background: tokens.surface, //  ใช้ theme
        color: tokens.error, //  ใช้ theme
        confirmButtonColor: tokens.error, //  ใช้ them
      });
    }
  };

  if (!profile) return <p className={styles.loading}>{t("profile.loading")}</p>;

  const titleOptions = [
    { value: "", label: t("profile.selectTitle") },
    { value: "Mr", label: i18n.language === "th" ? "นาย" : "Mr." },
    { value: "Mrs", label: i18n.language === "th" ? "นาง" : "Mrs." },
    { value: "Ms", label: i18n.language === "th" ? "นางสาว" : "Ms." },
    { value: "Dr", label: i18n.language === "th" ? "ดร." : "Dr." },
  ];

  const genderOptions = [
    { value: "", label: t("profile.selectGender") },
    { value: "male", label: t("profile.male") },
    { value: "female", label: t("profile.female") },
    { value: "other", label: t("profile.other") },
  ];

  const renderFieldValue = (value) => {
    return value && value !== "" ? value : "\u00A0";
  };

  const profileImageUrl = profile.imageUrl || profile.avatar || null;

  return (
  <>
    <Navbar />
    <div
      className={styles.pageWrapper}
      style={{
        backgroundColor: tokens.background,
        color: tokens.text,
      }}
    >
      <div className={styles.container}>
        {/* Header Section with Profile Image and Basic Info */}
        <div className={`${styles.card} ${styles.headerCard}`}>
          <div
            className={`${styles.profileImageWrapper} ${styles.headerImageWrapper}`}
          >
            {profileImageUrl ? (
              <img
                src={profileImageUrl}
                alt="Profile"
                className={styles.profileImage}
                onError={(e) => {
                  e.currentTarget.src = "/images/placeholder.png";
                }}
              />
            ) : (
              <div className={styles.profileImagePlaceholder}>
                <FaUser size={40} color={tokens.textSecondary} />
              </div>
            )}
          </div>

          <div className={styles.profileInfo}>
            <h1 className={styles.profileName}>
              {profile.title ? `${titleOptions.find(o => o.value === profile.title)?.label} ` : ''}
              {profile.first_name} {profile.last_name}
            </h1>
          </div>

          <div className={styles.socialContainer}>
            <div className={`${styles.iconCircle} ${styles.facebook}`}>
              <FaFacebookF size={16} />
            </div>
            <div className={`${styles.iconCircle} ${styles.instagram}`}>
              <FaInstagram size={16} />
            </div>
            <div className={`${styles.iconCircle} ${styles.line}`}>
              <FaLine size={16} />
            </div>
            <div className={`${styles.iconCircle} ${styles.discord}`}>
              <FaDiscord size={16} />
            </div>
          </div>
        </div>

        {/* Personal Information Section */}
        <div className={`${styles.card} ${styles.sectionCard}`}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>
              Personal Information
            </h2>
            <button
              onClick={() =>
                isEditingPersonal
                  ? handleSave("personal")
                  : setIsEditingPersonal(true)
              }
              className={styles.secondaryEditButton}
            >
              <FaEdit size={12} />
              {isEditingPersonal ? "Save" : "Edit"}
            </button>
          </div>

          <div className={styles.fieldGrid}>
            {/* Title */}
            <div>
              <label className={styles.fieldLabel}>
                Title
              </label>
              {isEditingPersonal ? (
                <select
                  className={`${styles.inputField} ${styles.fieldInput}`}
                  name="title"
                  value={formData.title || ""}
                  onChange={handleInputChange}
                >
                  {titleOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              ) : (
                <div className={`${styles.text} ${styles.fieldDisplay}`}>
                  {renderFieldValue(titleOptions.find(o => o.value === profile.title)?.label)}
                </div>
              )}
            </div>

            {/* First Name */}
            <div>
              <label className={styles.fieldLabel}>
                First Name
              </label>
              {isEditingPersonal ? (
                <input
                  className={`${styles.inputField} ${styles.fieldInput}`}
                  name="first_name"
                  value={formData.first_name || ""}
                  onChange={handleInputChange}
                  placeholder="First Name"
                />
              ) : (
                <div className={`${styles.text} ${styles.fieldDisplay}`}>
                  {renderFieldValue(profile.first_name)}
                </div>
              )}
            </div>

            {/* Last Name */}
            <div>
              <label className={styles.fieldLabel}>
                Last Name
              </label>
              {isEditingPersonal ? (
                <input
                  className={`${styles.inputField} ${styles.fieldInput}`}
                  name="last_name"
                  value={formData.last_name || ""}
                  onChange={handleInputChange}
                  placeholder="Last Name"
                />
              ) : (
                <div className={`${styles.text} ${styles.fieldDisplay}`}>
                  {renderFieldValue(profile.last_name)}
                </div>
              )}
            </div>

            {/* Date of Birth */}
            <div>
              <label className={styles.fieldLabel}>
                Date of Birth
              </label>
              {isEditingPersonal ? (
                <input
                  className={`${styles.inputField} ${styles.fieldInput}`}
                  name="date_of_birth"
                  type="date"
                  value={formData.date_of_birth || ""}
                  onChange={handleInputChange}
                />
              ) : (
                <div className={`${styles.text} ${styles.fieldDisplay}`}>
                  {renderFieldValue(profile.date_of_birth)}
                </div>
              )}
            </div>

            {/* Phone */}
            <div>
              <label className={styles.fieldLabel}>
                Phone
              </label>
              {isEditingPersonal ? (
                <input
                  className={`${styles.inputField} ${styles.fieldInput}`}
                  name="phone"
                  value={formData.phone || ""}
                  onChange={handleInputChange}
                  placeholder="Phone Number"
                  type="tel"
                />
              ) : (
                <div className={`${styles.text} ${styles.fieldDisplay}`}>
                  {renderFieldValue(profile.phone)}
                </div>
              )}
            </div>

            {/* Gender */}
            <div>
              <label className={styles.fieldLabel}>
                Gender
              </label>
              {isEditingPersonal ? (
                <select
                  className={`${styles.inputField} ${styles.fieldInput}`}
                  name="gender"
                  value={formData.gender || ""}
                  onChange={handleInputChange}
                >
                  {genderOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              ) : (
                <div className={`${styles.text} ${styles.fieldDisplay}`}>
                  {renderFieldValue(genderOptions.find(o => o.value === profile.gender)?.label)}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Address Section */}
        <div className={styles.card}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>
              Address
            </h2>
            <button
              onClick={() =>
                isEditingAddress
                  ? handleSave("address")
                  : setIsEditingAddress(true)
              }
              className={styles.secondaryEditButton}
            >
              <FaEdit size={12} />
              {isEditingAddress ? "Save" : "Edit"}
            </button>
          </div>

          <div className={styles.fieldGrid}>
            {/* Country */}
            <div>
              <label className={styles.fieldLabel}>
                Country
              </label>
              {isEditingAddress ? (
                <input
                  className={`${styles.inputField} ${styles.fieldInput}`}
                  name="country"
                  value={formData.country || ""}
                  onChange={handleInputChange}
                  placeholder="Country"
                />
              ) : (
                <div className={`${styles.text} ${styles.fieldDisplay}`}>
                  {renderFieldValue(profile.country)}
                </div>
              )}
            </div>

            {/* City */}
            <div>
              <label className={styles.fieldLabel}>
                City
              </label>
              {isEditingAddress ? (
                <input
                  className={`${styles.inputField} ${styles.fieldInput}`}
                  name="city"
                  value={formData.city || ""}
                  onChange={handleInputChange}
                  placeholder="City"
                />
              ) : (
                <div className={`${styles.text} ${styles.fieldDisplay}`}>
                  {renderFieldValue(profile.city)}
                </div>
              )}
            </div>

            {/* Address */}
            <div className={styles.fullWidth}>
              <label className={styles.fieldLabel}>
                Address
              </label>
              {isEditingAddress ? (
                <textarea
                  className={styles.bioTextarea}
                  name="address"
                  value={formData.address || ""}
                  onChange={handleInputChange}
                  placeholder="Address"
                  rows={3}
                />
              ) : (
                <div className={`${styles.text} ${styles.bioDisplay}`}>
                  {renderFieldValue(profile.address)}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  </>
);
}
