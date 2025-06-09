// src/components/Modal.js
import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes } from "@fortawesome/free-solid-svg-icons";
import { useTheme } from "../contexts/ThemeContext";

const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  size = "default", // "small", "default", "large"
  showCloseButton = true,
}) => {
  const { isDark } = useTheme();

  if (!isOpen) return null;

  // ⭐ Styles รวมอยู่ในไฟล์เดียวกัน
  const getModalStyles = () => {
    const baseStyles = {
      overlay: {
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      },
      closeButton: {
        position: "absolute",
        top: "1rem",
        right: "1rem",
        background: "none",
        border: "none",
        fontSize: "1.5rem",
        cursor: "pointer",
        color: isDark ? "#ffffff" : "#333333",
        padding: "0.5rem",
        borderRadius: "50%",
        transition: "background-color 0.3s ease",
      },
      modalTitle: {
        fontSize: "1.5rem",
        fontWeight: "bold",
        marginBottom: "1rem",
        paddingRight: "2rem",
        color: isDark ? "#ffffff" : "#333333",
      },
      modalContent: {
        padding: "1rem 0",
      },
    };

    // ⭐ Modal sizes
    const modalSizes = {
      small: {
        backgroundColor: isDark ? "#2d3748" : "#ffffff",
        borderRadius: "12px",
        padding: "1.5rem",
        width: "90%",
        maxWidth: "450px",

        maxHeight: "80vh",
        overflowY: "auto",
        boxShadow: "0 10px 25px rgba(0, 0, 0, 0.2)",
        position: "relative",
        color: isDark ? "#ffffff" : "#333333",
      },
      default: {
        backgroundColor: isDark ? "#2d3748" : "#ffffff",
        borderRadius: "12px",
        padding: "2rem",
        width: "90%",
        maxWidth: "500px",
        maxHeight: "80vh",
        overflowY: "auto",
        boxShadow: "0 10px 25px rgba(0, 0, 0, 0.2)",
        position: "relative",
        color: isDark ? "#ffffff" : "#333333",
      },
      large: {
        backgroundColor: isDark ? "#2d3748" : "#ffffff",
        borderRadius: "12px",
        padding: "2rem",
        width: "90%",
        maxWidth: "800px",
        maxHeight: "80vh",
        overflowY: "auto",
        boxShadow: "0 10px 25px rgba(0, 0, 0, 0.2)",
        position: "relative",
        color: isDark ? "#ffffff" : "#333333",
      },
    };

    return {
      ...baseStyles,
      modal: modalSizes[size] || modalSizes.default,
    };
  };

  const styles = getModalStyles();

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        {showCloseButton && (
          <button
            style={styles.closeButton}
            onClick={onClose}
            onMouseEnter={(e) =>
              (e.target.style.backgroundColor = isDark ? "#4a5568" : "#f7fafc")
            }
            onMouseLeave={(e) =>
              (e.target.style.backgroundColor = "transparent")
            }
          >
            <FontAwesomeIcon icon={faTimes} />
          </button>
        )}

        {title && <h2 style={styles.modalTitle}>{title}</h2>}

        <div style={styles.modalContent}>{children}</div>
      </div>
    </div>
  );
};

export default Modal;
