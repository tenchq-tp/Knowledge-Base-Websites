"use client";
import { useState, useEffect, useRef } from "react";
import Navbar from "../../component/Navbar";
import styles from "../../style/home.module.css";
import * as FaIcons from "react-icons/fa";
import "../../../lib/i18n";
import { useTranslation } from "react-i18next";
import { useRouter } from "next/navigation";
import { useTheme } from "../../contexts/ThemeContext";

const spinningEarthGif = "/images/earth.gif";

export default function Homepage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const router = useRouter();
  // ลบ state rotationSpeedRef และ requestAnimationFrame ที่หมุนอัตโนมัติออก

  const [rotation, setRotation] = useState(0);

  const earthRef = useRef(null); // ref ของรูปโลก เพื่อหาตำแหน่งศูนย์กลาง

  const { t } = useTranslation();

const { tokens, isDark } = useTheme();

  useEffect(() => {
    async function fetchCategories() {
      setLoading(true);

      const accessToken = localStorage.getItem("access_token");

      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API}/categories`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
        });

        const data = await res.json();

        if (Array.isArray(data)) {
          setCategories(data);
        } else {
          setCategories([]);
          console.error("Data is not an array");
        }
      } catch (error) {
        console.error("Failed to fetch categories:", error);
        setCategories([]);
      } finally {
        setLoading(false);
      }
    }

    fetchCategories();
  }, []);

  // ฟังก์ชันจับเมาส์เพื่อหมุนโลกตามทิศทางเมาส์ (หมุนตามหรือทวนเข็ม)
  const handleMouseMove = (e) => {
    if (!earthRef.current) return;

    const rect = earthRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const dx = e.clientX - centerX;
    const dy = e.clientY - centerY;

    // คำนวณมุมความหมุน (radians -> degrees)
    // ใช้ atan2(dy, dx) เพราะแกน Y ลงด้านล่าง
    let angle = Math.atan2(dy, dx) * (180 / Math.PI);

    // ปรับมุมให้อยู่ในช่วง 0-360 องศา
    if (angle < 0) angle += 360;

    // เราอาจจะหมุนกลับด้าน (ถ้าต้องการให้ทวนเข็มแทนตามเข็ม)
    // angle = 360 - angle; // ลองสลับดูตามต้องการ

    setRotation(angle);
  };

  // เมื่อ mouse ออกนอกโลก ให้หยุดหมุนหรือหมุนช้าๆ ก็ได้
  const handleMouseLeave = () => {
    // ตัวอย่าง: หมุนกลับมาเริ่มที่ 0 แบบนิ่ม ๆ
    setRotation(0);
  };

  const filteredCategories = categories.filter((cat) =>
    cat.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <Navbar />

      <div className={styles.homeContainer}>
        <div
          className={styles.centerContent}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          <div className={styles.earthSearchWrapper}>
            {!selectedCategory ? (
              <img
                ref={earthRef}
                src={spinningEarthGif}
                alt="Spinning Earth"
                className={styles.spinningEarth}
                style={{ transform: `rotate(${rotation}deg)`,
               filter: isDark ? 'brightness(0.8)' : 'brightness(1)'
               }}
              />
            ) : (
              <div className={styles.categoryDetail}>
                <div className={styles.categoryIconAndName}>
                  {selectedCategory.icon &&
                    (() => {
                      const [iconName, color] =
                        selectedCategory.icon.split("_");
                      const IconComponent = FaIcons[iconName];
                      return IconComponent ? (
                        <IconComponent
                          size={60}
                          color={color ? "#" + color : "#000"}
                          className={styles.categoryIcon}
                        />
                      ) : (
                        <FaIcons.FaQuestion size={60} color="#ccc" />
                      );
                    })()}
                  <h2>{selectedCategory.name}</h2>
                </div>
                <p>{selectedCategory.description}</p>
              </div>
            )}

            <div className={styles.searchWrapper}>
              <input
                type="text"
                placeholder=""
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={styles.searchInputOverlay}
              />
              <FaIcons.FaSearch className={styles.searchIcon} />
            </div>

            {selectedCategory && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  gap: "15px",
                  marginTop: "20px",
                }}
              >
                <button
                  className={styles.createArticleBtn}
                  onClick={() => {
                    router.push(
                      `/pages/article/create_article?categoryId=${selectedCategory.id}`
                    );
                  }}
                >
                  <FaIcons.FaPlus className={styles.icon} />
                  {t("actions.createArticle")}
                </button>

                <button
                  className={styles.readBtn}
                  type="button"
                  onClick={() => alert("อ่านบทความ")}
                >
                  <FaIcons.FaBookOpen className={styles.icon} />
                  {t ? t("actions.read") : "อ่าน"}
                </button>
                <button
                  className={styles.backButton}
                  type="button"
                  onClick={() => setSelectedCategory(null)}
                >
                  &larr; {t ? t("actions.backtoearth") : "Back to Earth"}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ส่วน categoryGrid ไม่เปลี่ยนแปลง */}
        <div className={styles.categoryGrid}>
          {loading ? (
            <p style={{color: tokens.textSecondary}}>Loading categories...</p>
          ) : filteredCategories.length > 0 ? (
            filteredCategories.map((cat) => (
              <div
                key={cat.id}
                className={styles.categoryCard}
                onClick={() => setSelectedCategory(cat)}
                title={`View ${cat.name}`}
              >
                {cat.icon ? (
                  (() => {
                    const [iconName, color] = cat.icon.split("_");
                    const IconComponent = FaIcons[iconName];
                    return IconComponent ? (
                      <IconComponent
                        size={40}
                        color={color ? "#" + color : tokens.primary}
                        className={styles.categoryIcon}
                      />
                    ) : (
                      <FaIcons.FaQuestion size={40} color={tokens.textMuted} />
                    );
                  })()
                ) : (
                  <FaIcons.FaQuestion size={40} color={tokens.textMuted} />
                )}
                <div className={styles.categoryInfo}>
                  <h3>{cat.name}</h3>
                  <p className={styles.categoryDescription}>
                    {cat.description}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <p style={{ color: tokens.textSecondary}}>No categories found.</p>
          )}
        </div>
      </div>
    </>
  );
}
