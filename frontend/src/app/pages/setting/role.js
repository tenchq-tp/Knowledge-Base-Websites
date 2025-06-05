// components/RoleSettings.js
"use client";

import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUserTag, faEdit } from "@fortawesome/free-solid-svg-icons";
import { useTranslation } from "react-i18next";
import Swal from "sweetalert2";
import Modal from "../../component/setting_modal";
import { useTheme } from "../../contexts/ThemeContext";
import "../../style/role_setting.css";

export default function RoleSettings() {
  const { t } = useTranslation();
  const { tokens } = useTheme();
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

  // 🚀 Simplified API call
  const apiCall = async (endpoint, options = {}) => {
    const token = localStorage.getItem("access_token");
    const response = await fetch(`http://localhost:8000${endpoint}`, {
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
      ...options,
    });
    if (!response.ok) throw new Error(`Failed to ${options.method || 'GET'} ${endpoint}`);
    return response.json();
  };

  // 🎯 Simplified alert
  const showAlert = (type, title, text) => 
    Swal.fire({ icon: type, title, text, timer: 2000, timerProgressBar: true, showConfirmButton: false });

  // 🔄 Reset role data
  const resetRoleData = () => setRoleData({
    roleName: "",
    permissions: { greeting: false, messageTemplate: false, callManagement: false, report: false, userManagement: false, auditLogs: false }
  });

  // 📝 Event handlers
  const handleRoleNameChange = (value) => setRoleData(prev => ({ ...prev, roleName: value }));
  const handlePermissionChange = (permission) => setRoleData(prev => ({
    ...prev,
    permissions: { ...prev.permissions, [permission]: !prev.permissions[permission] }
  }));

  // 🎯 Unified role action handler
  const handleRoleAction = async (action) => {
    if (!roleData.roleName.trim()) {
      return Swal.fire({ icon: "warning", title: "Warning", text: "Please enter role name", confirmButtonText: "OK" });
    }

    if (action === 'delete') {
      const result = await Swal.fire({
        icon: "warning", title: "Are you sure?", text: "You won't be able to revert this!",
        showCancelButton: true, confirmButtonColor: "#d33", cancelButtonColor: "#3085d6",
        confirmButtonText: "Yes, delete it!", cancelButtonText: "Cancel"
      });
      if (!result.isConfirmed) return;
    }

    try {
      console.log(`${action}ing role:`, roleData);
      const messages = { create: "Role created successfully!", update: "Role updated successfully!", delete: "Role has been deleted." };
      await showAlert("success", action === 'delete' ? "Deleted!" : "Success", messages[action]);
      resetRoleData();
      setIsRoleModalOpen(false);
    } catch (error) {
      console.error(`Error ${action}ing role:`, error);
      Swal.fire({ icon: "error", title: "Error", text: `Failed to ${action} role. Please try again.`, confirmButtonText: "OK" });
    }
  };

  // 🔍 Fetch roles
  const fetchRoles = async () => {
    setIsLoadingRoles(true);
    try {
      const data = await apiCall("/roles");
      setRolesList(data);
    } catch (error) {
      console.error("Error fetching roles:", error);
      showAlert("error", "Error", "Failed to load roles. Please try again.");
    } finally {
      setIsLoadingRoles(false);
    }
  };

  useEffect(() => { fetchRoles(); }, []);

  const permissions = [
    { key: "greeting", label: "Greeting" },
    { key: "messageTemplate", label: "Message Template" },
    { key: "callManagement", label: "Call Management" },
    { key: "report", label: "Report" },
    { key: "userManagement", label: "User Management" },
    { key: "auditLogs", label: "Audit Logs" }
  ];

  const actions = [
    { action: 'create', className: "btn-create", text: "CREATE" },
    { action: 'update', className: "btn-update", text: "UPDATE" },
    { action: 'delete', className: "btn-delete", text: "DELETE" }
  ];

 return (
    <>
      <div className="role-setting-card" style={{ backgroundColor: tokens.surface, borderColor: tokens.border }}>
        <div className="section-header" style={{ borderBottomColor: tokens.border }}>
          <div className="section-info">
            <FontAwesomeIcon icon={faUserTag} className="section-icon" />
            <h2 className="section-title" style={{ color: tokens.text }}>{t("settings.role.title")}</h2>
          </div>
          <button onClick={() => setIsRoleModalOpen(true)} className="btn btn-primary">
            <FontAwesomeIcon icon={faEdit} />{t("settings.role.edit")}
          </button>
        </div>
      </div>
      <Modal isOpen={isRoleModalOpen} onClose={() => setIsRoleModalOpen(false)} title="User Admin Role" size="large">
        <div className="role-modal-content">
          <div className="role-name-section">
            <div className="role-header">
              <label className="role-label" style={{ color: tokens.text }}>Role Name</label>
              <div className="action-buttons">
                {actions.map(({ action, className, text }) => (
                  <button key={action} onClick={() => handleRoleAction(action)} className={`btn ${className}`}>
                    {text}
                  </button>
                ))}
              </div>
            </div>
            <select
              value={roleData.roleName}
              onChange={(e) => handleRoleNameChange(e.target.value)}
              disabled={isLoadingRoles}
              className="role-select"
              style={{ backgroundColor: tokens.surface, borderColor: tokens.border, color: tokens.text, opacity: isLoadingRoles ? 0.6 : 1 }}
            >
              {isLoadingRoles ? (
                <option value="">Loading roles...</option>
              ) : (
                <>
                  <option value="">Select role</option>
                  {rolesList.map(role => <option key={role.id} value={role.name}>{role.name}</option>)}
                </>
              )}
            </select>
          </div>
          <div className="permissions-section">
            <h3 className="permissions-title">Display Menu</h3>
            <div className="permissions-list">
              {permissions.map(({ key, label }) => (
                <div key={key} className="permission-item" style={{ backgroundColor: tokens.surfaceAlt, borderColor: tokens.border }}>
                  <span className="permission-label" style={{ color: tokens.text }}>{label}</span>
                  <div onClick={() => handlePermissionChange(key)} className={`toggle-switch ${roleData.permissions[key] ? 'active' : ''}`}>
                    <div className="toggle-slider" />
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