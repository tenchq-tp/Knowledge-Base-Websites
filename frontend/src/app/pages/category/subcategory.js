"use client";

import { useState, useEffect} from "react";
import { useTranslation } from "react-i18next";
import * as FaIcons from "react-icons/fa";
import { useTheme } from "../../contexts/ThemeContext";
import Swal from "sweetalert2";
import api from "../../../lib/axios";
import styles from "../../style/subcategory.module.css";

export default function SubcategoryModal({ categoryId, categoryIcon, onClose }) {
  const { t } = useTranslation();
  const { tokens } = useTheme();
  const [subcategories, setSubcategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoryData, setCategoryData] = useState(null);
  //Add Subcategory
  const [formMode, setFormMode] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ name: "", description: "" });


  function parseIcon(iconStr) {
    if (!iconStr) return { IconComponent: null, color: tokens.primary };
    const [iconName, color] = iconStr.split("_");
    const IconComponent = FaIcons[iconName] || null;
    return { IconComponent, color: color ? "#" + color : tokens.primary };
  }

  // Fetch category data และ subcategories
  const fetchCategoryData = async () => {
    try {
      const res = await api.get(`/categories/${categoryId}`);
      setCategoryData(res.data);
      setSubcategories(res.data.subcategories || []);
    } catch (error) {
      console.error("Failed to fetch category:", error);
      setSubcategories([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (categoryId) {
      fetchCategoryData();
    }
  }, [categoryId]);

  const openAddForm = () => {
    setFormMode('add');
    setFormData({ name: "", description: "" });
  };

  const openEditForm = (subcategory) => {
    setFormMode('edit');
    setEditingId(subcategory.id);
    setFormData({ name: subcategory.name, description: subcategory.description || "" });
  };

  const closeForm = () => {
    setFormMode(null);
    setEditingId(null);
    setFormData({ name: "", description: "" });
  };

  const handleSubmit = async () => {
    try {
      if (formMode === 'add') {
        const response = await api.post(`/categories/subcategories/`, {
          ...formData,
          category_id: categoryId,
          status: categoryData?.status 
        });
        setSubcategories([...subcategories, response.data]);
        Swal.fire({
          icon: 'success',
          title: t("success", { defaultValue: "สำเร็จ" }),
          text: t("subcategoryModal.addSuccess", { defaultValue: "เพิ่ม subcategory สำเร็จ" }),
          timer: 2000,
          showConfirmButton: false
        });
      } else if (formMode === 'edit') {
        await api.put(`/categories/subcategories/${editingId}`, {
        ...formData,
        status: categoryData?.status  // ดึง status จาก categoryData
      });
        setSubcategories(subcategories.map(sub =>
          sub.id === editingId ? { ...sub, ...formData } : sub
        ));
        Swal.fire({
          icon: 'success',
          title: t("success", { defaultValue: "สำเร็จ" }),
          text: t("subcategoryModal.editSuccess", { defaultValue: "แก้ไข subcategory สำเร็จ" }),
          timer: 2000,
          showConfirmButton: false
        });
      }
      closeForm();
    } catch (error) {
      console.error(`Failed to ${formMode} subcategory:`, error);
      Swal.fire({
        icon: 'error',
        title: t("error", { defaultValue: "เกิดข้อผิดพลาด" }),
        text: t(`subcategoryModal.${formMode}Error`, {
          defaultValue: `ไม่สามารถ${formMode === 'add' ? 'เพิ่ม' : 'แก้ไข'} subcategory ได้`
        })
      });
    }
  };

  //ลบsubcategory 
  const handleDeleteSubcategory = async (subcategoryId, subcategoryName) => {
    const result = await Swal.fire({
      title: t("subcategoryModal.deleteConfirmTitle", { defaultValue: "คุณแน่ใจหรือไม่?" }),
      text: t("subcategoryModal.deleteConfirmText", {
        defaultValue: "คุณต้องการลบ subcategory นี้หรือไม่?",
        name: subcategoryName
      }),
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: t("delete", { defaultValue: "ลบ" }),
      cancelButtonText: t("cancel", { defaultValue: "ยกเลิก" })
    });

    if (result.isConfirmed) {
      try {
        await api.delete(`/categories/subcategories/${subcategoryId}`);

        // Remove from local state
        setSubcategories(subcategories.filter(sub => sub.id !== subcategoryId));

        Swal.fire({
          icon: 'success',
          title: t("deleted", { defaultValue: "ลบแล้ว!" }),
          text: t("subcategoryModal.deleteSuccess", { defaultValue: "ลบ subcategory สำเร็จ" }),
          timer: 2000,
          showConfirmButton: false
        });
      } catch (error) {
        console.error("Failed to delete subcategory:", error);
        Swal.fire({
          icon: 'error',
          title: t("error", { defaultValue: "เกิดข้อผิดพลาด" }),
          text: t("subcategoryModal.deleteError", { defaultValue: "ไม่สามารถลบ subcategory ได้" })
        });
      }
    }
  };

  const iconToUse = categoryData?.icon || categoryIcon;
  const { IconComponent, color } = parseIcon(iconToUse);

 return (
    <div className={styles.overlay}>
      <div
        className={styles.modal}
        style={{
          backgroundColor: tokens.surface,
          border: `1px solid ${tokens.border}`,
          boxShadow: tokens.shadow,
        }}
      >
        {/* Header */}
        <div
          className={styles.header}
          style={{ borderBottom: `1px solid ${tokens.border}` }}
        >
          <h2 style={{ color: tokens.text }}>
            {IconComponent && (
              <IconComponent style={{ marginRight: '12px' }} size={24} color={color} />
            )}
            {t("subcategoryModal.title", { defaultValue: "จัดการ Subcategory" })}
            {categoryData && (
              <span style={{ color: tokens.textSecondary, fontSize: '0.9em' }}>
                - {categoryData.name}
              </span>
            )}
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              onClick={openAddForm}
              className={styles.saveBtn}
              style={{
                backgroundColor: tokens.success,
                color: "white"
              }}
            >
              <FaIcons.FaPlus size={12} />
              {t("subcategoryModal.addSubcategory", { defaultValue: "เพิ่ม" })}
            </button>
            <button onClick={onClose} className={styles.closeBtn} style={{ color: tokens.textMuted }}>
              <FaIcons.FaTimes size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className={styles.content}>
          {/* Add Form - แสดงเมื่อ formMode === 'add' */}
          {formMode === 'add' && (
            <div className={styles.addFormContainer} style={{ marginBottom: '20px' }}>
              <h3 style={{ color: tokens.text, marginBottom: '12px' }}>
                {t("subcategoryModal.addSubcategory", { defaultValue: "เพิ่ม Subcategory" })}
              </h3>
              <div className={styles.editForm}>
                <div className={styles.inputGroup}>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder={t("name", { defaultValue: "ชื่อ" })}
                    className={styles.input}
                    style={{
                      backgroundColor: tokens.surface,
                      border: `1px solid ${tokens.border}`,
                      color: tokens.text,
                    }}
                  />
                </div>
                <div className={styles.inputGroup}>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder={t("description", { defaultValue: "คำอธิบาย" })}
                    className={styles.textarea}
                    style={{
                      backgroundColor: tokens.surface,
                      border: `1px solid ${tokens.border}`,
                      color: tokens.text,
                    }}
                    rows={2}
                  />
                </div>
                <div className={styles.editActions}>
                  <button
                    onClick={handleSubmit}
                    className={styles.saveBtn}
                    style={{ backgroundColor: tokens.success, color: "white" }}
                  >
                    <FaIcons.FaSave size={14} />
                    {t("save", { defaultValue: "บันทึก" })}
                  </button>
                  <button
                    onClick={closeForm}
                    className={styles.cancelBtn}
                    style={{ backgroundColor: tokens.textMuted, color: "white" }}
                  >
                    <FaIcons.FaTimes size={14} />
                    {t("cancel", { defaultValue: "ยกเลิก" })}
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {/* Subcategories List */}
          <div className={styles.subcategoriesList}>
            {loading ? (
              <p style={{ color: tokens.textMuted, textAlign: 'center' }}>
                {t("loading", { defaultValue: "กำลังโหลด..." })}
              </p>
            ) : subcategories.length === 0 ? (
              <p style={{ color: tokens.textMuted, textAlign: 'center' }}>
                {t("subcategoryModal.noSubcategories", { defaultValue: "ยังไม่มี subcategory" })}
              </p>
            ) : (
              <div className={styles.grid}>
                {subcategories.map((sub) => (
                  <div
                    key={sub.id}
                    className={styles.subcategoryCard}
                    style={{
                      backgroundColor: tokens.background,
                      border: `1px solid ${tokens.border}`,
                      boxShadow: tokens.shadow,
                    }}
                  >
                    {formMode === 'edit' && editingId === sub.id ? (
                      <div className={styles.editForm}>
                        <div className={styles.inputGroup}>
                          <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                            placeholder={t("name", { defaultValue: "ชื่อ" })}
                            className={styles.input}
                            style={{
                              backgroundColor: tokens.surface,
                              border: `1px solid ${tokens.border}`,
                              color: tokens.text,
                            }}
                          />
                        </div>
                        <div className={styles.inputGroup}>
                          <textarea
                            value={formData.description}
                            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                            placeholder={t("description", { defaultValue: "คำอธิบาย" })}
                            className={styles.textarea}
                            style={{
                              backgroundColor: tokens.surface,
                              border: `1px solid ${tokens.border}`,
                              color: tokens.text,
                            }}
                            rows={2}
                          />
                        </div>
                        <div className={styles.editActions}>
                          <button
                            onClick={handleSubmit}
                            className={styles.saveBtn}
                            style={{ backgroundColor: tokens.success, color: "white" }}
                          >
                            <FaIcons.FaSave size={14} />
                            {t("save", { defaultValue: "บันทึก" })}
                          </button>
                          <button
                            onClick={closeForm}
                            className={styles.cancelBtn}
                            style={{ backgroundColor: tokens.textMuted, color: "white" }}
                          >
                            <FaIcons.FaTimes size={14} />
                            {t("cancel", { defaultValue: "ยกเลิก" })}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className={styles.subcategoryInfo}>
                          <h4 style={{ color: tokens.primary }}>{sub.name}</h4>
                          {sub.description && (
                            <p style={{ color: tokens.textSecondary }}>{sub.description}</p>
                          )}
                        </div>
                        <div className={styles.subcategoryActions}>
                          <button
                            onClick={() => openEditForm(sub)}
                            className={styles.editBtn}
                            style={{ color: tokens.warning }}
                            title={t("actions.edit", { defaultValue: "แก้ไข" })}
                          >
                            <FaIcons.FaEdit size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteSubcategory(sub.id, sub.name)}
                            className={styles.deleteBtn}
                            style={{ color: tokens.error }}
                            title={t("actions.delete", { defaultValue: "ลบ" })}
                          >
                            <FaIcons.FaTrash size={16} />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}