"use client";

import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import * as FaIcons from "react-icons/fa";
import CreateCategoryModal from "../../component/create_category_modal";
import styles from "../../style/category.module.css";
import Navbar from "../../component/Navbar";
import Swal from "sweetalert2";
import { useTheme } from "../../contexts/ThemeContext";
import "../../../lib/i18n";
import { useRouter } from "next/navigation";
import api from "../../../lib/axios";

export default function CategoryPage() {
  const { t } = useTranslation();
  const { tokens, isDark } = useTheme();
  const [showModal, setShowModal] = useState(false);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingCategory, setEditingCategory] = useState(null);
  const [canCreate, setCanCreate] = useState(false);
  const [canRead, setCanRead] = useState(false);
  const [canEdit, setCanEdit] = useState(false);
  const [canDelete, setCanDelete] = useState(false);

  const router = useRouter();

  async function fetchCategories() {
    setLoading(true);
    try {
      const res = await api.get("/categories");
      const data = res.data;
      console.log("Fetched categories:", data); // เช็คข้อมูล

      if (Array.isArray(data)) {
        setCategories(data);
      } else {
        setCategories([]); // กรณีไม่ใช่ array ตั้งเป็น array ว่าง
        console.error("Data is not an array");
      }
    } catch (error) {
      console.error("Failed to fetch categories:", error);
      setCategories([]); // กรณี error ตั้ง array ว่าง
    } finally {
      setLoading(false);
    }
  }

  // เรียก fetch ครั้งแรกตอน mount
  useEffect(() => {
    fetchCategories();
  }, []);

  function parseIcon(iconStr) {
    if (!iconStr) return { IconComponent: null, color: tokens.primary };
    const [iconName, color] = iconStr.split("_");
    const IconComponent = FaIcons[iconName] || null;
    return { IconComponent, color: color ? "#" + color : tokens.primary };
  }

  // กด edit
  const handleEdit = (category) => {
    setEditingCategory(category);
    setShowModal(true);
  };

  // ฟังก์ชันลบ category พร้อม Swal และ fetch ใหม่
  const handleDelete = async (categoryId) => {
    const result = await Swal.fire({
      title: t("categoryModal.deleteConfirmTitle"),
      text: t("categoryModal.deleteConfirmText"),
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: t("categoryModal.confirmYes"),
      cancelButtonText: t("categoryModal.confirmNo"),
      confirmButtonColor: tokens.error,
      cancelButtonColor: tokens.primary,
      background: tokens.surface,
      color: tokens.text,
    });

    if (result.isConfirmed) {
      try {
        await api.delete(`/categories/${categoryId}`);
        await Swal.fire({
          icon: "success",
          title: t("categoryModal.deleteSuccessTitle"),
          text: t("categoryModal.deleteSuccessText"),
          confirmButtonColor: tokens.primary,
          confirmButtonText: "OK",
          background: tokens.surface,
          color: tokens.text,
        });

        fetchCategories(); // fetch ข้อมูลใหม่หลังลบ
      } catch (error) {
        Swal.fire({
          icon: "error",
          title: t("categoryModal.errorTitle"),
          text: t("categoryModal.deleteErrorText"),
          confirmButtonColor: tokens.error,
          confirmButtonText: "OK",
          background: tokens.surface,
          color: tokens.text,
        });
      }
    }
  };

  useEffect(() => {
    const permissions = JSON.parse(
      localStorage.getItem("user_permissions") || "[]"
    );
    const hasPermission = permissions.some(
      (p) => p.permission?.name === "view_category"
    );

    if (!hasPermission) {
      router.push("/pages/access-denied");
    }
  }, [router]);
  
  useEffect(() => {
    const stored = localStorage.getItem("user_permissions");
    if (stored) {
      const userPermissions = JSON.parse(stored);

      setCanCreate(
        userPermissions.some((perm) => perm.permission?.name === "add_category")
      );
      setCanRead(
        userPermissions.some(
          (perm) => perm.permission?.name === "read_category"
        )
      );
      setCanEdit(
        userPermissions.some(
          (perm) => perm.permission?.name === "edit_category"
        )
      );
      setCanDelete(
        userPermissions.some(
          (perm) => perm.permission?.name === "delete_category"
        )
      );
    }
  }, []);
  if (loading) {
    return (
      <>
        <Navbar />
        <div className={styles.container}>
          <p style={{ color: tokens.text }}>
            {t("loading", { defaultValue: "Loading categories..." })}
          </p>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className={styles.container}>
        {canCreate && (
          <button
            onClick={() => setShowModal(true)}
            className={styles.addBtn}
            style={{
              backgroundColor: tokens.success,
              boxShadow: `0 4px 8px ${tokens.success}80`,
              color: "white",
            }}
          >
            <FaIcons.FaPlus className={styles.icon} />
            {t("navbar.category")}
          </button>
        )}

        <div className={styles.grid}>
          {categories.map((cat) => {
            const { IconComponent, color } = parseIcon(cat.icon);

            return (
              <div
                key={cat.id}
                className={styles.card}
                style={{
                  backgroundColor: tokens.surface,
                  boxShadow: tokens.shadow,
                  border: `1px solid ${tokens.border}`,
                }}
              >
                <div
                  className={styles.iconWrapper}
                  style={{
                    backgroundColor: `${tokens.primary}20`,
                    boxShadow: `0 2px 6px ${tokens.primary}40`,
                  }}
                >
                  {IconComponent ? (
                    <IconComponent size={40} color={color} />
                  ) : (
                    <div style={{ fontSize: 40, color: tokens.textMuted }}>
                      ?
                    </div>
                  )}
                </div>
                <h3
                  className={styles.cardTitle}
                  style={{ color: tokens.primary }}
                >
                  {cat.name}
                </h3>
                <p
                  className={styles.cardDesc}
                  style={{ color: tokens.textSecondary }}
                >
                  {cat.description}
                </p>
                <div className={styles.buttonGroup}>
                  {canCreate && (
                    <button
                      className={styles.createArticleBtn}
                      style={{
                        backgroundColor: tokens.success,
                        boxShadow: `0 4px 10px ${tokens.success}70`,
                        color: "white",
                      }}
                    >
                      <FaIcons.FaPlus className={styles.icon} />
                      {t("actions.createArticle")}
                    </button>
                  )}

                  {canRead && (
                    <button
                      className={styles.readBtn}
                      style={{
                        backgroundColor: tokens.primary,
                        boxShadow: `0 4px 10px ${tokens.primary}70`,
                      }}
                    >
                      <FaIcons.FaBookOpen className={styles.icon} />
                      {t("actions.read")}
                    </button>
                  )}
                </div>

                <div className={styles.actions}>
                  {canEdit && (
                    <button
                      className={styles.editBtn}
                      title={t("actions.edit")}
                      onClick={() => handleEdit(cat)}
                      style={{ color: tokens.warning }}
                    >
                      <FaIcons.FaEdit />
                    </button>
                  )}
                  {canDelete && (
                    <button
                      className={styles.deleteBtn}
                      title={t("actions.delete")}
                      onClick={() => handleDelete(cat.id)} // เรียกฟังก์ชันลบ
                      style={{ color: tokens.error }}
                    >
                      <FaIcons.FaTrash />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {showModal && (
          <CreateCategoryModal
            onClose={() => {
              setShowModal(false);
              setEditingCategory(null);
            }}
            mode={editingCategory ? "edit" : "create"}
            categoryData={editingCategory}
            onUpdate={fetchCategories} // ส่งฟังก์ชัน fetch ใหม่ให้ modal
          />
        )}
      </div>
    </>
  );
}
