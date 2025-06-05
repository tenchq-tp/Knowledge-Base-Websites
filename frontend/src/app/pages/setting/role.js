// components/RoleSettings.js
"use client";

import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUserTag, faEdit, faChevronDown, faChevronRight, faPlus } from "@fortawesome/free-solid-svg-icons";
import { useTranslation } from "react-i18next";
import Swal from "sweetalert2";
import Modal from "../../component/setting_modal";
import { useTheme } from "../../contexts/ThemeContext";
import "../../style/role_setting.css";

export default function RoleSettings() {
  const { t } = useTranslation();
  const { tokens } = useTheme();
  const [open, setOpen] = useState(false);
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState({});
  const [role, setRole] = useState("");
  const [perms, setPerms] = useState({});

  const [formMode, setFormMode] = useState("create"); // "create" or "edit"
  const [formRoleName, setFormRoleName] = useState("");
  const [formRoleDescription, setFormRoleDescription] = useState("");
  const [formLoading, setFormLoading] = useState(false);
  const [selectedRoleForEdit, setSelectedRoleForEdit] = useState(null);

  const api = async (url, opts = {}) => {
    const res = await fetch(`http://localhost:8000${url}`, {
      headers: { "Authorization": `Bearer ${localStorage.getItem("access_token")}`, "Content-Type": "application/json" },
      ...opts
    });
    if (!res.ok) throw new Error("API Error");
    return res.json();
  };

  const alert = (type, msg) => Swal.fire({ icon: type, text: msg, timer: 2000, showConfirmButton: false });

  const loadRoles = async () => {
    setLoading(true);
    try { setRoles(await api("/roles")); }
    catch { alert("error", "Failed to load roles"); }
    finally { setLoading(false); }
  };

  const openCreateModal = () => {
    setFormMode("create");
    setFormRoleName("");
    setFormRoleDescription("");
    setSelectedRoleForEdit(null);
    setFormModalOpen(true);
  };

  const openEditModal = () => {
    if (!role.trim()) {
      return alert("warning", "Please select a role to edit");
    }

    const selectedRole = roles.find(r => r.name === role);
    if (!selectedRole) {
      return alert("error", "Selected role not found");
    }

    setFormMode("edit");
    setSelectedRoleForEdit(selectedRole);
    setFormRoleName(selectedRole.name);
    setFormRoleDescription(selectedRole.description || "");
    setFormModalOpen(true);
  };

  const closeFormModal = () => {
    setFormModalOpen(false);
    setFormRoleName("");
    setFormRoleDescription("");
    setSelectedRoleForEdit(null);
  };

  const handleFormSubmit = async () => {
    if (!formRoleName.trim()) {
      return alert("warning", "Please enter role name");
    }

    if (!formRoleDescription.trim()) {
      return alert("warning", "Please enter role description");
    }

    setFormLoading(true);
    try {
      if (formMode === "create") {
        await api("/roles", {
          method: "POST",
          body: JSON.stringify({
            name: formRoleName.trim(),
            description: formRoleDescription.trim()
          })
        });
        alert("success", "Role created successfully!");
      } else if (formMode === "edit") {
        if (!selectedRoleForEdit) {
          return alert("error", "Role data not found");
        }
        await api(`/roles/${selectedRoleForEdit.id}`, {
          method: "PUT",
          body: JSON.stringify({
            name: formRoleName.trim(),
            description: formRoleDescription.trim()
          })
        });
        alert("success", "Role updated successfully!");
      }

      closeFormModal();
      await loadRoles();

    } catch (error) {
      console.error(`${formMode} role error:`, error);
      alert("error", formMode === "create" ? "Failed to create role" : "Failed to update role");
    } finally {
      setFormLoading(false);
    }
  };

  const handleAction = async (action) => {
    if (action === "create") {
      openCreateModal();
      return;
    }

    if (action === "update") {
      openEditModal();
      return;
    }

    if (!role.trim()) return alert("warning", "Select a role");

    if (action === "delete") {
      const confirm = await Swal.fire({
        icon: "warning", title: "Delete role?", showCancelButton: true,
        confirmButtonColor: "#d33", confirmButtonText: "Delete"
      });
      if (!confirm.isConfirmed) return;

      
    const selectedRole = roles.find(r => r.name === role);
      if (!selectedRole) {
        return alert("error", "Selected role not found");
      }

      try {
        await api(`/roles/${selectedRole.id}`, {
          method: "DELETE"
        });
        
        alert("success", "Role deleted successfully!");
        setRole(""); 
        setPerms({}); 
        setExpanded({}); 
        await loadRoles(); // Reload roles list
        
      } catch (error) {
        console.error("Delete role error:", error);
        alert("error", "Failed to delete role");
      }
      return;
    }

    try {
      alert("success", `Role ${action}d successfully!`);
      setRole(""); setPerms({}); setExpanded({}); setOpen(false);
    } catch { alert("error", `Failed to ${action} role`); }
  };

  const toggle = (menu) => setExpanded(p => ({ ...p, [menu]: !p[menu] }));
  const setPerm = (menu, type, val) => setPerms(p => ({ ...p, [menu]: { ...p[menu], [type]: val } }));

  useEffect(() => { loadRoles(); }, []);

  const menus = ["home", "dashboard", "category", "setting"];
  const types = [
    { key: "view", color: "#28a745" },
    { key: "add", color: "#007bff" },
    { key: "edit", color: "#ffc107" },
    { key: "delete", color: "#dc3545" }
  ];

  return (
    <>
      <div className="role-setting-card" style={{ backgroundColor: tokens.surface, borderColor: tokens.border }}>
        <div className="section-header" style={{ borderBottomColor: tokens.border }}>
          <div className="section-info">
            <FontAwesomeIcon icon={faUserTag} className="section-icon" />
            <h2 className="section-title" style={{ color: tokens.text }}>{t("settings.role.title")}</h2>
          </div>
          <button onClick={() => setOpen(true)} className="btn btn-primary">
            <FontAwesomeIcon icon={faEdit} />Manage
          </button>
        </div>
      </div>

      <Modal
        isOpen={formModalOpen}
        onClose={closeFormModal}
        title={formMode === "create" ? "Create Role" : "Edit Role"}
        size="small"
      >
        <div className="form-role-content">
          <input
            type="text"
            value={formRoleName}
            onChange={(e) => setFormRoleName(e.target.value)}
            placeholder="Role name *"
            className="form-input"
            disabled={formLoading}
            style={{
              backgroundColor: tokens.surface,
              borderColor: tokens.border,
              color: tokens.text
            }}
          />

          <textarea
            value={formRoleDescription}
            onChange={(e) => setFormRoleDescription(e.target.value)}
            placeholder="Description *"
            rows={2}
            className="form-textarea"
            disabled={formLoading}
            style={{
              backgroundColor: tokens.surface,
              borderColor: tokens.border,
              color: tokens.text
            }}
          />

          <div className="modal-actions">
            <button
              onClick={closeFormModal}
              disabled={formLoading}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              onClick={handleFormSubmit}
              disabled={formLoading || !formRoleName.trim() || !formRoleDescription.trim()}
              className={`btn ${formMode === "create" ? "btn-create" : "btn-update"}`}
            >
              {formLoading ? (
                <>
                  <span className="spinner"></span>
                  {formMode === "create" ? "Creating..." : "Updating..."}
                </>
              ) : (
                formMode === "create" ? "Create" : "Update"
              )}
            </button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={open} onClose={() => setOpen(false)} title="Role Settings" size="large">
        <div className="role-modal-content">
          <div className="role-section">
            <div className="role-header">
              <label className="role-label" style={{ color: tokens.text }}>Role Name</label>
              <div className="action-buttons">
                {["create", "update", "delete"].map(action => (
                  <button key={action} onClick={() => handleAction(action)} className={`btn btn-${action}`}>
                    {action.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
            <select value={role} onChange={(e) => setRole(e.target.value)} disabled={loading} className="role-select"
              style={{ backgroundColor: tokens.surface, borderColor: tokens.border, color: tokens.text }}>
              <option value="">{loading ? "Loading..." : "Select role"}</option>
              {roles.map(r => <option key={r.id} value={r.name}>{r.name}</option>)}
            </select>
          </div>

          <div className="permissions-section">
            <h3 className="permissions-title" style={{ color: tokens.text }}>Permissions</h3>
            {menus.map(menu => (
              <div key={menu} className="permission-menu">
                <div className="permission-header" onClick={() => toggle(menu)}>
                  <span style={{ color: tokens.text }}>{menu.charAt(0).toUpperCase() + menu.slice(1)}</span>
                  <FontAwesomeIcon icon={expanded[menu] ? faChevronDown : faChevronRight} style={{ color: tokens.text }} />
                </div>
                {expanded[menu] && (
                  <div className="permission-dropdown">
                    <div className="permission-checkboxes">
                      {types.map(({ key, color }) => (
                        <label key={key} className="permission-checkbox">
                          <input type="checkbox" checked={perms[menu]?.[key] || false}
                            onChange={(e) => setPerm(menu, key, e.target.checked)} />
                          <div className="permission-checkbox-custom"
                            style={{ borderColor: color }}>
                          </div>
                          <span className="permission-text" style={{ color: tokens.text }}>
                            {key.charAt(0).toUpperCase() + key.slice(1)}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </Modal>
    </>
  );
}