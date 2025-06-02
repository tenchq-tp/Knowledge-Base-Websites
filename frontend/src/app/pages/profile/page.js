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
import Swal from "sweetalert2";
import "../../../lib/i18n";
import styles from "../../style/profile.module.css";

export default function ProfilePage() {
  const { t, i18n } = useTranslation();
  const [profile, setProfile] = useState(null);
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

  const handleSave = async () => {
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
      setIsEditing(false);

      Swal.fire({
        icon: "success",
        title: t("profile.saveSuccess") || "บันทึกโปรไฟล์สำเร็จ",
        timer: 1500,
        showConfirmButton: false,
        background: "#ffffff", // พื้นหลังขาว
        color: "#4caf50", // ฟอนต์เขียว (Success)
      });
    } catch (err) {
      console.error("Failed to update profile", err);
      Swal.fire({
        icon: "error",
        title: t("profile.saveFailed") || "บันทึกไม่สำเร็จ",
        text: err.message,
        background: "#ffffff", // พื้นหลังขาว
        color: "#f44336", // ฟอนต์แดง (Error)
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
        className={styles.container}
        style={{ backgroundColor: "#f9f9f9", color: "#222" }}
      >
        <div className={styles.profileImageWrapper}>
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
              <FaUser size={64} color="#999" />
            </div>
          )}
        </div>

        <h1 className={styles.title} style={{ color: "#00796b" }}>
          {isEditing ? t("profile.editmyProfile") : t("profile.myProfile")}
        </h1>

        <div
          className={styles.card}
          style={{
            background: "linear-gradient(135deg, #e0f2f1, #b2dfdb)",
            color: "#004d40",
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
          }}
        >
          {/* Title */}
          <div className={styles.row}>
            <FaIdBadge className={styles.icon} />
            <label className={styles.label}>{t("profile.title")}:</label>
            {isEditing ? (
              <select
                className={styles.inputField}
                name="title"
                value={formData.title || ""}
                onChange={handleInputChange}
              >
                {titleOptions.map(({ value, label }) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            ) : (
              <span className={styles.text}>
                {renderFieldValue(
                  titleOptions.find((o) => o.value === profile.title)?.label
                )}
              </span>
            )}
          </div>

          {/* First Name */}
          <div className={styles.row}>
            <FaUser className={styles.icon} />
            <label className={styles.label}>{t("profile.firstName")}:</label>
            {isEditing ? (
              <input
                className={styles.inputField}
                name="first_name"
                value={formData.first_name || ""}
                onChange={handleInputChange}
                placeholder={t("profile.firstName")}
              />
            ) : (
              <span className={styles.text}>
                {renderFieldValue(profile.first_name)}
              </span>
            )}
          </div>

          {/* Last Name */}
          <div className={styles.row}>
            <FaUser className={styles.icon} />
            <label className={styles.label}>{t("profile.lastName")}:</label>
            {isEditing ? (
              <input
                className={styles.inputField}
                name="last_name"
                value={formData.last_name || ""}
                onChange={handleInputChange}
                placeholder={t("profile.lastName")}
              />
            ) : (
              <span className={styles.text}>
                {renderFieldValue(profile.last_name)}
              </span>
            )}
          </div>

          {/* Phone */}
          <div className={styles.row}>
            <FaPhone className={styles.icon} />
            <label className={styles.label}>{t("profile.phone")}:</label>
            {isEditing ? (
              <input
                className={styles.inputField}
                name="phone"
                value={formData.phone || ""}
                onChange={handleInputChange}
                placeholder={t("profile.phone")}
                type="tel"
              />
            ) : (
              <span className={styles.text}>
                {renderFieldValue(profile.phone)}
              </span>
            )}
          </div>

          {/* Date of Birth */}
          <div className={styles.row}>
            <FaBirthdayCake className={styles.icon} />
            <label className={styles.label}>{t("profile.dateOfBirth")}:</label>
            {isEditing ? (
              <input
                className={styles.inputField}
                name="date_of_birth"
                type="date"
                value={formData.date_of_birth || ""}
                onChange={handleInputChange}
              />
            ) : (
              <span className={styles.text}>
                {renderFieldValue(profile.date_of_birth)}
              </span>
            )}
          </div>

          {/* Gender */}
          <div className={styles.row}>
            <FaVenusMars className={styles.icon} />
            <label className={styles.label}>{t("profile.gender")}:</label>
            {isEditing ? (
              <select
                className={styles.inputField}
                name="gender"
                value={formData.gender || ""}
                onChange={handleInputChange}
              >
                {genderOptions.map(({ value, label }) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            ) : (
              <span className={styles.text}>
                {renderFieldValue(
                  genderOptions.find((o) => o.value === profile.gender)?.label
                )}
              </span>
            )}
          </div>

          {/* Country */}
          <div className={styles.row}>
            <FaGlobe className={styles.icon} />
            <label className={styles.label}>{t("profile.country")}:</label>
            {isEditing ? (
              <input
                className={styles.inputField}
                name="country"
                value={formData.country || ""}
                onChange={handleInputChange}
                placeholder={t("profile.country")}
              />
            ) : (
              <span className={styles.text}>
                {renderFieldValue(profile.country)}
              </span>
            )}
          </div>

          {/* City */}
          <div className={styles.row}>
            <FaCity className={styles.icon} />
            <label className={styles.label}>{t("profile.city")}:</label>
            {isEditing ? (
              <input
                className={styles.inputField}
                name="city"
                value={formData.city || ""}
                onChange={handleInputChange}
                placeholder={t("profile.city")}
              />
            ) : (
              <span className={styles.text}>
                {renderFieldValue(profile.city)}
              </span>
            )}
          </div>

          {/* Address */}
          <div className={styles.row}>
            <FaMapMarkedAlt className={styles.icon} />
            <label className={styles.label}>{t("profile.address")}:</label>
            {isEditing ? (
              <input
                className={styles.inputField}
                name="address"
                value={formData.address || ""}
                onChange={handleInputChange}
                placeholder={t("profile.address")}
              />
            ) : (
              <span className={styles.text}>
                {renderFieldValue(profile.address)}
              </span>
            )}
          </div>
        </div>
        <div className={styles.contactBox}>
          <h2 className={styles.contactTitle}>Contact</h2>
          <div className={styles.iconRow}>
            <div className={`${styles.iconCircle} ${styles.facebook}`}>
              <FaFacebookF />
            </div>
            <div className={`${styles.iconCircle} ${styles.instagram}`}>
              <FaInstagram />
            </div>
            <div className={`${styles.iconCircle} ${styles.line}`}>
              <FaLine />
            </div>
            <div className={`${styles.iconCircle} ${styles.discord}`}>
              <FaDiscord />
            </div>
          </div>
        </div>
        <button
          className={styles.editButton}
          onClick={() => (isEditing ? handleSave() : setIsEditing(true))}
          style={{ backgroundColor: "#00796b", color: "#fff" }}
        >
          <FaEdit className={styles.editIcon} />{" "}
          {isEditing ? t("profile.save") : t("profile.edit")}
        </button>
      </div>
    </>
  );
}
