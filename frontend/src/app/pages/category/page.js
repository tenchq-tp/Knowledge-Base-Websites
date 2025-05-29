"use client";

import { useState, useEffect } from "react";
import * as FaIcons from "react-icons/fa"; // นำเข้าไอคอน FontAwesome ทั้งหมด
import CreateCategoryModal from "../../component/create_category_modal";
import styles from "../../style/category.module.css";
import Navbar from "../../component/Navbar";

export default function CategoryPage() {
  const [showModal, setShowModal] = useState(false);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingCategory, setEditingCategory] = useState(null);

  useEffect(() => {
    async function fetchCategories() {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/categories`
        );
        const data = await res.json();
        setCategories(data);
      } catch (error) {
        console.error("Failed to fetch categories:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchCategories();
  }, []);

  // ฟังก์ชันสำหรับแยก icon name และสีจาก string เช่น "FaTree_#000000"
  function parseIcon(iconStr) {
    if (!iconStr) return { IconComponent: null, color: "#000" };
    const [iconName, color] = iconStr.split("_");
    const IconComponent = FaIcons[iconName] || null;
    return { IconComponent, color: color || "#000" };
  }

  if (loading) {
    return (
      <>
        <Navbar />
        <div className={styles.container}>
          <p>Loading categories...</p>
        </div>
      </>
    );
  }
  const handleEdit = (category) => {
    setEditingCategory(category);
    setShowModal(true);
  };
  return (
    <>
      <Navbar />
      <div className={styles.container}>
        <button onClick={() => setShowModal(true)} className={styles.addBtn}>
          + Add Category
        </button>

        <div className={styles.grid}>
          {categories.map((cat) => {
            const { IconComponent, color } = parseIcon(cat.icon);

            return (
              <div key={cat.id} className={styles.card}>
                <div className={styles.iconWrapper}>
                  {IconComponent ? (
                    <IconComponent size={40} color={color} />
                  ) : (
                    <div style={{ fontSize: 40, color: "#ccc" }}>?</div>
                  )}
                </div>
                <h3 className={styles.cardTitle}>{cat.name}</h3>
                <p className={styles.cardDesc}>{cat.description}</p>
                <div className={styles.buttonGroup}>
                  <button className={styles.createArticleBtn}>
                    <FaIcons.FaPlus className={styles.icon} /> Create Article
                  </button>
                  <button className={styles.readBtn}>
                    <FaIcons.FaBookOpen className={styles.icon} /> Read
                  </button>
                </div>

                <div className={styles.actions}>
                  <button
                    className={styles.editBtn}
                    title="Edit"
                    onClick={() => handleEdit(cat)}
                  >
                    <FaIcons.FaEdit />
                  </button>

                  <button className={styles.deleteBtn} title="Delete">
                    <FaIcons.FaTrash />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {showModal && (
          <CreateCategoryModal
            onClose={() => {
              setShowModal(false);
              setEditingCategory(null); // reset หลังปิด
            }}
            mode={editingCategory ? "edit" : "create"}
            categoryData={editingCategory}
          />
        )}
      </div>
    </>
  );
}
