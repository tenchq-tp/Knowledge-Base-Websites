// components/RoleSettings.js
"use client";

import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUserTag, faEdit } from "@fortawesome/free-solid-svg-icons";
import { useTranslation } from "react-i18next";
import Swal from "sweetalert2";
import Modal from "../../component/Modal";

export default function RoleSettings({ isDark, styles }) {
  const { t } = useTranslation();
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [rolesList, setRolesList] = useState([]);
  const [isLoadingRoles, setIsLoadingRoles] = useState(false);
  const [roleData, setRoleData] = useState({
    roleName: "",
    permissions: {
      greeting: false,
      messageTemplate: false,
      callManagement: false,
      report: false,
      userManagement: false,
      auditLogs: false,
    }
  });

  // Fetch roles from API
  const fetchRoles = async () => {
    setIsLoadingRoles(true);
    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch("http://localhost:8000/roles", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch roles");
      }

      const data = await response.json();
      setRolesList(data);
    } catch (error) {
      console.error("Error fetching roles:", error);
      await Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to load roles. Please try again.",
        confirmButtonText: "OK",
      });
    } finally {
      setIsLoadingRoles(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  // Event Handlers
  const handleRoleNameChange = (value) => {
    setRoleData(prev => ({ ...prev, roleName: value }));
  };

  const handlePermissionChange = (permission) => {
    setRoleData(prev => ({
      ...prev,
      permissions: { ...prev.permissions, [permission]: !prev.permissions[permission] }
    }));
  };

  const resetRoleData = () => {
    setRoleData({
      roleName: "",
      permissions: {
        greeting: false,
        messageTemplate: false,
        callManagement: false,
        report: false,
        userManagement: false,
        auditLogs: false,
      }
    });
  };

  const showAlert = async (type, title, text, timer = 2000) => {
    await Swal.fire({
      icon: type,
      title,
      text,
      timer,
      timerProgressBar: true,
      showConfirmButton: false,
    });
  };

  const handleCreateRole = async () => {
    if (!roleData.roleName.trim()) {
      return await Swal.fire({
        icon: "warning",
        title: "Warning",
        text: "Please enter role name",
        confirmButtonText: "OK",
      });
    }

    try {
      console.log("Creating role:", roleData);
      await showAlert("success", "Success", "Role created successfully!");
      resetRoleData();
      setIsRoleModalOpen(false);
    } catch (error) {
      console.error("Error creating role:", error);
      await Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to create role. Please try again.",
        confirmButtonText: "OK",
      });
    }
  };

  const handleUpdateRole = async () => {
    if (!roleData.roleName.trim()) {
      return await Swal.fire({
        icon: "warning",
        title: "Warning",
        text: "Please enter role name",
        confirmButtonText: "OK",
      });
    }

    try {
      console.log("Updating role:", roleData);
      await showAlert("success", "Success", "Role updated successfully!");
      setIsRoleModalOpen(false);
    } catch (error) {
      console.error("Error updating role:", error);
      await Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to update role. Please try again.",
        confirmButtonText: "OK",
      });
    }
  };

  const handleDeleteRole = async () => {
    try {
      const result = await Swal.fire({
        icon: "warning",
        title: "Are you sure?",
        text: "You won't be able to revert this!",
        showCancelButton: true,
        confirmButtonColor: "#d33",
        cancelButtonColor: "#3085d6",
        confirmButtonText: "Yes, delete it!",
        cancelButtonText: "Cancel"
      });

      if (result.isConfirmed) {
        console.log("Deleting role:", roleData.roleName);
        await showAlert("success", "Deleted!", "Role has been deleted.");
        resetRoleData();
        setIsRoleModalOpen(false);
      }
    } catch (error) {
      console.error("Error deleting role:", error);
      await Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to delete role. Please try again.",
        confirmButtonText: "OK",
      });
    }
  };

  const permissionItems = [
    { key: "greeting", label: "Greeting" },
    { key: "messageTemplate", label: "Message Template" },
    { key: "callManagement", label: "Call Management" },
    { key: "report", label: "Report" },
    { key: "userManagement", label: "User Management" },
    { key: "auditLogs", label: "Audit Logs" }
  ];

  const actionButtons = [
    { onClick: handleCreateRole, color: "#28a745", hoverColor: "#218838", text: "CREATE" },
    { onClick: handleUpdateRole, color: "#ffc107", hoverColor: "#e0a806", text: "UPDATE" },
    { onClick: handleDeleteRole, color: "#dc3545", hoverColor: "#c82333", text: "DELETE" }
  ];

  return (
    <>
      {/* Role Settings Card */}
      <div style={styles.card}>
        <div style={{ ...styles.sectionHeader, justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center" }}>
            <FontAwesomeIcon
              icon={faUserTag}
              style={{
                fontSize: "1.5rem",
                color: "#4a90e2",
                marginRight: "0.75rem",
              }}
            />
            <h2 style={styles.sectionTitle}>
              {t("settings.role.title")}
            </h2>
          </div>
          <button
            onClick={() => setIsRoleModalOpen(true)}
            style={{
              background: "#4a90e2",
              color: "white",
              border: "none",
              borderRadius: "8px",
              padding: "0.5rem 1rem",
              cursor: "pointer",
              fontSize: "0.9rem",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              transition: "background-color 0.3s ease",
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = "#357abd"}
            onMouseLeave={(e) => e.target.style.backgroundColor = "#4a90e2"}
          >
            <FontAwesomeIcon icon={faEdit} />
            {t("settings.role.edit")}
          </button>
        </div>
      </div>

      {/* Role Management Modal */}
      <Modal
        isOpen={isRoleModalOpen}
        onClose={() => setIsRoleModalOpen(false)}
        title="User Admin Role"
        size="large"
      >
        <div style={{ padding: "1rem" }}>
          {/* Role Name Section */}
          <div style={{ marginBottom: "2rem" }}>
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "1rem"
            }}>
              <label style={{
                fontSize: "1rem",
                fontWeight: "bold",
                color: isDark ? "#ffffff" : "#333333",
                marginBottom: "0"
              }}>
                Role Name
              </label>

              {/* Action Buttons */}
              <div style={{ display: "flex", gap: "0.5rem" }}>
                {actionButtons.map((btn, index) => (
                  <button
                    key={index}
                    onClick={btn.onClick}
                    style={{
                      backgroundColor: btn.color,
                      color: "white",
                      border: "none",
                      borderRadius: "6px",
                      padding: "0.5rem 1rem",
                      fontSize: "0.9rem",
                      fontWeight: "bold",
                      cursor: "pointer",
                      transition: "background-color 0.3s ease",
                    }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = btn.hoverColor}
                    onMouseLeave={(e) => e.target.style.backgroundColor = btn.color}
                  >
                    {btn.text}
                  </button>
                ))}
              </div>
            </div>

            {/* Role Name Dropdown */}
            <select
              value={roleData.roleName}
              onChange={(e) => handleRoleNameChange(e.target.value)}
              disabled={isLoadingRoles}
              style={{
                width: "100%",
                padding: "0.75rem",
                fontSize: "1rem",
                border: `1px solid ${isDark ? "#4a5568" : "#d1d5db"}`,
                borderRadius: "6px",
                backgroundColor: isDark ? "#2d3748" : "#ffffff",
                color: isDark ? "#ffffff" : "#333333",
                outline: "none",
                transition: "border-color 0.3s ease",
                opacity: isLoadingRoles ? 0.6 : 1,
              }}
              onFocus={(e) => e.target.style.borderColor = "#4a90e2"}
              onBlur={(e) => e.target.style.borderColor = isDark ? "#4a5568" : "#d1d5db"}
            >
              {isLoadingRoles ? (
                <option value="">Loading roles...</option>
              ) : (
                <>
                  <option value="">Select role</option>
                  {rolesList.map(role => (
                    <option key={role.id} value={role.name}>{role.name}</option>
                  ))}
                </>
              )}
            </select>
          </div>

          {/* Display Menu Section */}
          <div>
            <h3 style={{
              fontSize: "1.1rem",
              fontWeight: "bold",
              color: isDark ? "#ffffff" : "#333333",
              marginBottom: "1rem",
              borderBottom: `1px solid ${isDark ? "#4a5568" : "#e5e7eb"}`,
              paddingBottom: "0.5rem"
            }}>
              Display Menu
            </h3>

            {/* Permission Items */}
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {permissionItems.map((item) => (
                <div
                  key={item.key}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "0.75rem",
                    backgroundColor: isDark ? "#374151" : "#f9fafb",
                    borderRadius: "6px",
                    border: `1px solid ${isDark ? "#4b5563" : "#e5e7eb"}`,
                  }}
                >
                  <span style={{
                    fontSize: "1rem",
                    color: isDark ? "#ffffff" : "#374151",
                    fontWeight: "500"
                  }}>
                    {item.label}
                  </span>

                  {/* Toggle Switch */}
                  <div
                    onClick={() => handlePermissionChange(item.key)}
                    style={{
                      width: "50px",
                      height: "24px",
                      borderRadius: "12px",
                      backgroundColor: roleData.permissions[item.key] ? "#4a90e2" : "#d1d5db",
                      position: "relative",
                      cursor: "pointer",
                      transition: "background-color 0.3s ease",
                      boxShadow: "inset 0 1px 3px rgba(0, 0, 0, 0.1)",
                    }}
                  >
                    <div
                      style={{
                        width: "20px",
                        height: "20px",
                        borderRadius: "50%",
                        backgroundColor: "white",
                        position: "absolute",
                        top: "2px",
                        left: roleData.permissions[item.key] ? "28px" : "2px",
                        transition: "left 0.3s ease",
                        boxShadow: "0 1px 3px rgba(0, 0, 0, 0.2)",
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
}