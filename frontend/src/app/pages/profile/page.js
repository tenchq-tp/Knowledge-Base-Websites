"use client";

import { useState, useEffect } from "react";
import {
  FaUser,
  FaPhone,
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
import { useRouter } from "next/navigation";

export default function ProfilePage() {
  const { t, i18n } = useTranslation();
  const { tokens, isDark } = useTheme();
  const [profile, setProfile] = useState(null);
  const [isEditingPersonal, setIsEditingPersonal] = useState(false);
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [formData, setFormData] = useState({});
  const [canEdit, setCanEdit] = useState(false);
  const router = useRouter();
  useEffect(() => {
    const permissions = JSON.parse(
      localStorage.getItem("user_permissions") || "[]"
    );
    const hasPermission = permissions.some(
      (p) => p.permission?.name === "view_profile"
    );

    if (!hasPermission) {
      router.push("/pages/access-denied");
    }
  }, [router]);
  useEffect(() => {
    const stored = localStorage.getItem("user_permissions");
    if (stored) {
      const userPermissions = JSON.parse(stored);
      setCanEdit(
        userPermissions.some((perm) => perm.permission?.name === "edit_profile")
      );
    }
  }, []);
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
          ? t("profile.savePersonalSuccess")
          : t("profile.saveAddressSuccess");

      Swal.fire({
        icon: "success",
        title: t("profile.saveSuccess"),
        timer: 1500,
        showConfirmButton: false,
        background: tokens.surface,
        color: tokens.success,
        confirmButtonColor: tokens.success,
      });
    } catch (err) {
      console.error("Failed to update profile", err);
      Swal.fire({
        icon: "error",
        title: t("profile.saveFailed"),
        text: err.message,
        background: tokens.surface,
        color: tokens.error,
        confirmButtonColor: tokens.error,
      });
    }
  };

  if (!profile) return <p className={styles.loading}>{t("profile.loading")}</p>;

  const titleOptions = [
    { value: "Mr", label: t("profile.titleOptions.Mr") },
    { value: "Mrs", label: t("profile.titleOptions.Mrs") },
    { value: "Ms", label: t("profile.titleOptions.Ms") },
    { value: "Dr", label: t("profile.titleOptions.Dr") },
  ];

  const genderOptions = [
    { value: "male", label: t("profile.genderOption.male") },
    { value: "female", label: t("profile.genderOption.female") },
    { value: "other", label: t("profile.genderOption.other") },
  ];

  const renderFieldValue = (value) => {
    return value && value !== "" ? value : "\u00A0";
  };

  const profileImageUrl =
    profile.avatar_url || profile.avatar || profile.imageUrl || null;

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
                {profile.title
                  ? `${
                      titleOptions.find((o) => o.value === profile.title)?.label
                    } `
                  : ""}
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
              <h2 className={styles.sectionTitle}>{t("profile.personal")}</h2>
              {canEdit && (
                <button
                  onClick={() =>
                    isEditingPersonal
                      ? handleSave("personal")
                      : setIsEditingPersonal(true)
                  }
                  className={styles.secondaryEditButton}
                >
                  <FaEdit size={12} />
                  {isEditingPersonal ? t("profile.save") : t("profile.edit")}
                </button>
              )}
            </div>

            <div className={styles.fieldGrid}>
              {/* First Name */}
              <div>
                <label className={styles.fieldLabel}>
                  {t("profile.firstName")}
                </label>
                {isEditingPersonal ? (
                  <input
                    className={`${styles.inputField} ${styles.fieldInput}`}
                    name="first_name"
                    value={formData.first_name || ""}
                    onChange={handleInputChange}
                    placeholder={t("profile.firstName")}
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
                  {t("profile.lastName")}
                </label>
                {isEditingPersonal ? (
                  <input
                    className={`${styles.inputField} ${styles.fieldInput}`}
                    name="last_name"
                    value={formData.last_name || ""}
                    onChange={handleInputChange}
                    placeholder={t("profile.lastName")}
                  />
                ) : (
                  <div className={`${styles.text} ${styles.fieldDisplay}`}>
                    {renderFieldValue(profile.last_name)}
                  </div>
                )}
              </div>

              {/* Title */}
              <div>
                <label className={styles.fieldLabel}>
                  {t("profile.title")}
                </label>
                {isEditingPersonal ? (
                  <select
                    className={`${styles.inputField} ${styles.fieldInput}`}
                    name="title"
                    value={formData.title || ""}
                    onChange={handleInputChange}
                  >
                    <option value="">{t("profile.selectTitle")}</option>
                    {titleOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className={`${styles.text} ${styles.fieldDisplay}`}>
                    {renderFieldValue(
                      titleOptions.find((o) => o.value === profile.title)?.label
                    )}
                  </div>
                )}
              </div>

              {/* Gender */}
              <div>
                <label className={styles.fieldLabel}>
                  {t("profile.gender")}
                </label>
                {isEditingPersonal ? (
                  <select
                    className={`${styles.inputField} ${styles.fieldInput}`}
                    name="gender"
                    value={formData.gender || ""}
                    onChange={handleInputChange}
                  >
                    <option value="">{t("profile.selectGender")}</option>
                    {genderOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {t(`profile.${option.value}`)}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className={`${styles.text} ${styles.fieldDisplay}`}>
                    {renderFieldValue(
                      genderOptions.find((o) => o.value === profile.gender)
                        ?.label
                    )}
                  </div>
                )}
              </div>

              {/* Date of Birth */}
              <div>
                <label className={styles.fieldLabel}>
                  {t("profile.dateOfBirth")}
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
                  {t("profile.phone")}
                </label>
                {isEditingPersonal ? (
                  <input
                    className={`${styles.inputField} ${styles.fieldInput}`}
                    name="phone"
                    value={formData.phone || ""}
                    onChange={handleInputChange}
                    placeholder={t("profile.phone")}
                    type="tel"
                  />
                ) : (
                  <div className={`${styles.text} ${styles.fieldDisplay}`}>
                    {renderFieldValue(profile.phone)}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Address Section */}
          <div className={styles.card}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>{t("profile.address")}</h2>
              {canEdit && (
                <button
                  onClick={() =>
                    isEditingAddress
                      ? handleSave("address")
                      : setIsEditingAddress(true)
                  }
                  className={styles.secondaryEditButton}
                >
                  <FaEdit size={12} />
                  {isEditingAddress ? t("profile.save") : t("profile.edit")}
                </button>
              )}
            </div>

            <div className={styles.fieldGrid}>
              {/* Country */}
              <div>
                <label className={styles.fieldLabel}>
                  {t("profile.country")}
                </label>
                {isEditingAddress ? (
                  <input
                    className={`${styles.inputField} ${styles.fieldInput}`}
                    name="country"
                    value={formData.country || ""}
                    onChange={handleInputChange}
                    placeholder={t("profile.country")}
                  />
                ) : (
                  <div className={`${styles.text} ${styles.fieldDisplay}`}>
                    {renderFieldValue(profile.country)}
                  </div>
                )}
              </div>

              {/* City */}
              <div>
                <label className={styles.fieldLabel}>{t("profile.city")}</label>
                {isEditingAddress ? (
                  <input
                    className={`${styles.inputField} ${styles.fieldInput}`}
                    name="city"
                    value={formData.city || ""}
                    onChange={handleInputChange}
                    placeholder={t("profile.city")}
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
                  {t("profile.address")}
                </label>
                {isEditingAddress ? (
                  <textarea
                    className={styles.bioTextarea}
                    name="address"
                    value={formData.address || ""}
                    onChange={handleInputChange}
                    placeholder={t("profile.address")}
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
