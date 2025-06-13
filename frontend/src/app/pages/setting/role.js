"use client";

import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUserTag, faEdit, faChevronDown, faChevronRight, } from "@fortawesome/free-solid-svg-icons";
import { useTranslation } from "react-i18next";
import Swal from "sweetalert2";
import Modal from "../../component/setting_modal";
import { useTheme } from "../../contexts/ThemeContext";
import "../../style/role_setting.css";
import api from "../../../lib/axios";

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
  const [menuPermissions, setMenuPermissions] = useState({});
  const [permissionsLoading, setPermissionsLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [menuGroups, setMenuGroups] = useState([]);  // เพิ่ม state สำหรับ menu groups ที่ดึงจากฐานข้อมูล

  const alert = (type, msg) =>
    Swal.fire({ icon: type, text: msg, timer: 2000, showConfirmButton: false });

  const loadRoles = async () => {
    setLoading(true);
    try {
      const response = await api.get("/roles");
      setRoles(response.data);
    } catch {
      alert("error", t("settings.role.messages.load_roles_failed"));
    } finally {
      setLoading(false);
    }
  };

  const loadPermissions = async () => {
    setPermissionsLoading(true);
    try {
      const { data: permissionsData } = await api.get("/permissions");
      const groupedPerms = groupPermissionsByMenu(permissionsData);
      setMenuPermissions(groupedPerms);
    } catch (error) {
      console.error("Load permissions error:", error);
      setMenuPermissions({});
    } finally {
      setPermissionsLoading(false);
    }
  };

  // โหลดกลุ่มเมนูจาก permissions ที่มีอยู่
  const loadMenuGroups = async () => {
    try {
      const { data: permissionsData } = await api.get("/permissions");
      const menuGroupsSet = new Set();

      // แยกกลุ่มจาก permission names
      permissionsData.forEach(permission => {
        const { name } = permission;
        if (name.includes('_')) {
          const parts = name.split('_');
          if (parts.length >= 2) {
            const menuGroup = parts[parts.length - 1]; // เอาส่วนหลัง _ สุดท้าย
            menuGroupsSet.add(menuGroup);
          }
        }
      });

      // แปลง Set เป็น array ของ objects
      const menuGroupsArray = Array.from(menuGroupsSet).map(groupName => ({
        name: groupName,
        display_name: t(`settings.role.menus.${groupName}`, groupName.charAt(0).toUpperCase() + groupName.slice(1))
      }));

      setMenuGroups(menuGroupsArray);
    } catch (error) {
      console.error("Load menu groups error:", error);
      setMenuGroups([]);
    }
  };

  // จัดกลุ่ม Permission ให้เป็น menu
  const groupPermissionsByMenu = (permissionsData) => {
    const grouped = {};  // สร้าง object ว่างโดยใช้ข้อมูลจาก menuGroups
    menuGroups.forEach(group => {
      grouped[group.name] = [];
    });

    const permissionColors = {
      view: "#28a745", add: "#007bff", edit: "#ffc107", delete: "#dc3545", role: "#6f42c1", user: "#20c997",
    };

    permissionsData.forEach((permission) => {
      const { name, id } = permission;

      if (name.includes('_')) {
        const parts = name.split('_');
        if (parts.length >= 2) {
          const menuGroup = parts[parts.length - 1]; // เอาส่วนหลัง _ สุดท้าย
          const action = parts.slice(0, -1).join('_'); // เอาส่วนหน้า _ สุดท้าย
          if (grouped[menuGroup]) {
            grouped[menuGroup].push({
              key: action,
              id: id,
              color: permissionColors[action] || "#6c757d",
              label: t(`settings.role.permissions.${action}`, action.charAt(0).toUpperCase() + action.slice(1)),
            });
          }
        }
      }
    });

    return grouped;
  };

  // โหลด role permission
  const loadRolePermissions = async (roleId) => {
    try {
      const { data: rolePermissions } = await api.get(`/role-permissions/role/${roleId}`);
      const permsState = {};
      menuGroups.forEach(group => {
        permsState[group.name] = {};  // สร้าง object ว่างสำหรับทุกกลุ่มเมนู
      });

      rolePermissions.forEach((rp) => {
        const permissionName = rp.permission.name;

        if (permissionName.includes('_')) {
          const parts = permissionName.split('_');
          if (parts.length >= 2) {
            const menuGroup = parts[parts.length - 1]; // เอาส่วนหลัง _ สุดท้าย
            const action = parts.slice(0, -1).join('_'); // เอาส่วนหน้า _ สุดท้าย

            if (permsState[menuGroup]) {
              permsState[menuGroup][action] = true;
            }
          }
        }
      });

      setPerms(permsState);
    } catch (error) {
      console.error("Load role permissions error:", error);
      alert("error", t("settings.role.messages.load_permissions_failed"));
      setPerms({});
    }
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
      return alert("warning", t("settings.role.messages.select_role_warning"));
    }

    const selectedRole = roles.find((r) => r.name === role);
    if (!selectedRole) {
      return alert("error", t("settings.role.messages.role_not_found"));
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
      return alert("warning", t("settings.role.messages.role_name_required"));
    }

    if (!formRoleDescription.trim()) {
      return alert("warning", t("settings.role.messages.description_required"));
    }

    setFormLoading(true);
    try {
      if (formMode === "create") {
        await api.post("/roles", {
          name: formRoleName.trim(),
          description: formRoleDescription.trim(),
        });
        alert("success", t("settings.role.messages.role_created"));
      } else if (formMode === "edit") {
        if (!selectedRoleForEdit) {
          return alert("error", t("settings.role.messages.role_not_found"));
        }
        await api.put(`/roles/${selectedRoleForEdit.id}`, {
          name: formRoleName.trim(),
          description: formRoleDescription.trim(),
        });
        alert("success", t("settings.role.messages.role_updated"));
      }

      closeFormModal();
      await loadRoles();
    } catch (error) {
      console.error(`${formMode} role error:`, error);
      alert(
        "error",
        formMode === "create"
          ? t("settings.role.messages.create_failed")
          : t("settings.role.messages.update_failed")
      );
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

    if (!role.trim()) return alert("warning", t("settings.role.messages.select_role_warning"));

    if (action === "delete") {
      const confirm = await Swal.fire({
        icon: "warning",
        title: t("settings.role.messages.confirm_delete_title"),
        showCancelButton: true,
        confirmButtonColor: "#d33",
        confirmButtonText: t("settings.role.messages.confirm_delete_button"),
        cancelButtonText: t("settings.role.cancel")
      });
      if (!confirm.isConfirmed) return;

      const selectedRole = roles.find((r) => r.name === role);
      if (!selectedRole) {
        return alert("error", t("settings.role.messages.role_not_found"));
      }

      try {
        await api.delete(`/roles/${selectedRole.id}`);
        alert("success", t("settings.role.messages.role_deleted"));
        setRole("");
        setPerms({});
        setExpanded({});
        await loadRoles(); // Reload roles list
      } catch (error) {
        console.error("Delete role error:", error);
        alert("error", t("settings.role.messages.delete_failed"));
      }
      return;
    }
  };

  const handleRoleChange = async (selectedRoleName) => {
    setRole(selectedRoleName);

    if (selectedRoleName) {
      const selectedRole = roles.find((r) => r.name === selectedRoleName);
      if (selectedRole) {
        await loadRolePermissions(selectedRole.id);
      }
    } else {
      setPerms({});
    }
  };

  const saveRolePermissions = async () => {
    if (!role.trim()) {
      return alert("warning", t("settings.role.messages.select_role_to_save"));
    }

    const selectedRole = roles.find((r) => r.name === role);
    if (!selectedRole) {
      return alert("error", t("settings.role.messages.role_not_found"));
    }

    const permissionIds = [];

    Object.keys(perms).forEach((menu) => {
      Object.keys(perms[menu]).forEach((action) => {
        if (perms[menu][action]) {
          const menuPerms = menuPermissions[menu] || [];
          const permissionItem = menuPerms.find((p) => p.key === action);
          if (permissionItem && permissionItem.id) {
            permissionIds.push(permissionItem.id);
          }
        }
      });
    });

    setSaveLoading(true);
    try {
      await api.put("/role-permissions/role", {
        role_id: selectedRole.id,
        permission_id: permissionIds,
      });
      alert("success", t("settings.role.messages.permissions_updated"));
    } catch (error) {
      console.error("Save role permissions error:", error);
      alert("error", t("settings.role.messages.permissions_failed"));
    } finally {
      setSaveLoading(false);
    }
  };

  const handleSectionCheckAll = (menuName) => {
    const newPerms = { ...perms };
    const isAllChecked = checkIfSectionAllChecked(menuName);

    if (!newPerms[menuName]) {
      newPerms[menuName] = {};
    }

    if (menuPermissions[menuName]) {
      menuPermissions[menuName].forEach(permission => {
        newPerms[menuName][permission.key] = !isAllChecked;
      });
    }

    setPerms(newPerms);
  };

  // ฟังก์ชันเช็คว่า permissions ในแต่ละ section ถูกเลือกหมดหรือไม่
  const checkIfSectionAllChecked = (menuName) => {
    if (!menuPermissions[menuName] || menuPermissions[menuName].length === 0) {
      return false;
    }

    for (const permission of menuPermissions[menuName]) {
      if (!perms[menuName]?.[permission.key]) {
        return false;
      }
    }
    return true;
  };

  const toggle = (menu) => setExpanded((p) => ({ ...p, [menu]: !p[menu] })); //เปิด/ปิดการแสดงผล แต่ละหมวดหมู่ permission
  const setPerm = (menu, type, val) => setPerms((p) => ({ ...p, [menu]: { ...p[menu], [type]: val } })); //ใช้สำหรับ เปลี่ยนสถานะ checkbox ของ permission แต่ละตัว

  useEffect(() => {
    const initializeData = async () => {
      await loadMenuGroups();
      await loadRoles();
    };
    initializeData();
  }, []);

  useEffect(() => {
    if (menuGroups.length > 0) {
      loadPermissions();
    }
  }, [menuGroups]); // โหลด permissions หลังจากที่ menuGroups โหลดเสร็จแล้ว

  return (
    <>
      <div
        className="role-setting-card"
        style={{ backgroundColor: tokens.surface, borderColor: tokens.border }}
      >
        <div
          className="section-header"
          style={{ borderBottomColor: tokens.border }}
        >
          <div className="section-info">
            <FontAwesomeIcon icon={faUserTag} className="section-icon" />
            <h2 className="section-title" style={{ color: tokens.text }}>
              {t("settings.role.title")}
            </h2>
          </div>
          <button onClick={() => setOpen(true)} className="btn btn-primary">
            <FontAwesomeIcon icon={faEdit} />
            {t("settings.role.manage")}
          </button>
        </div>
      </div>

      <div className="form-role-content">
        <Modal
          isOpen={formModalOpen}
          onClose={closeFormModal}
          title={formMode === "create" ? t("settings.role.modal.create_title") : t("settings.role.modal.edit_title")}
          size="small"
        >
          <input
            type="text"
            value={formRoleName}
            onChange={(e) => setFormRoleName(e.target.value)}
            placeholder={t("settings.role.modal.role_name_placeholder")}
            className="form-input"
            disabled={formLoading}
            style={{
              backgroundColor: tokens.surface,
              borderColor: tokens.border,
              color: tokens.text,
            }}
          />

          <textarea
            value={formRoleDescription}
            onChange={(e) => setFormRoleDescription(e.target.value)}
            placeholder={t("settings.role.modal.description_placeholder")}
            rows={2}
            className="form-textarea"
            disabled={formLoading}
            style={{
              backgroundColor: tokens.surface,
              borderColor: tokens.border,
              color: tokens.text,
            }}
          />

          <div className="modal-actions">
            <button
              onClick={closeFormModal}
              disabled={formLoading}
              className="btn btn-secondary"
            >
              {t("settings.role.modal.cancel")}
            </button>
            <button
              onClick={handleFormSubmit}
              disabled={
                formLoading ||
                !formRoleName.trim() ||
                !formRoleDescription.trim()
              }
              className={`btn ${formMode === "create" ? "btn-create" : "btn-update"
                }`}
            >
              {formLoading ? (
                <>
                  <span className="spinner"></span>
                  {formMode === "create" ? t("settings.role.modal.creating") : t("settings.role.modal.updating")}
                </>
              ) : formMode === "create" ? (
                t("settings.role.modal.create")
              ) : (
                t("settings.role.modal.update")
              )}
            </button>
          </div>
        </Modal>
      </div>


      <Modal
        isOpen={open}
        onClose={() => setOpen(false)}
        title={t("settings.role.modal.title")}
        size="large"
      >
        <div className="role-modal-content">
          <div className="role-section">
            <div className="role-header">
              <label className="role-label" style={{ color: tokens.text }}>
                {t("settings.role.modal.role_name")}
              </label>
              <div className="action-buttons">
                {["create", "update", "delete"].map((action) => (
                  <button
                    key={action}
                    onClick={() => handleAction(action)}
                    className={`btn btn-${action}`}
                  >
                    {t(`settings.role.modal.${action}`).toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
            <select
              value={role}
              onChange={(e) => handleRoleChange(e.target.value)}
              disabled={loading}
              className="role-select"
              style={{
                backgroundColor: tokens.surface,
                borderColor: tokens.border,
                color: tokens.text,
              }}
            >
              <option value="">{loading ? t("settings.role.modal.loading") : t("settings.role.modal.select_role")}</option>
              {roles.map((r) => (
                <option key={r.id} value={r.name}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>

          <div className="permissions-section">
            <div className="permissions-header">
              <h3 className="permissions-title" style={{ color: tokens.text }}>
                {t("settings.role.modal.permissions")}{" "}
                {permissionsLoading && (
                  <span className="loading-text">{t("settings.role.modal.permissions_loading")}</span>
                )}
              </h3>
            </div>

            {menuGroups.map((menuGroup) => {
              const isSectionAllChecked = checkIfSectionAllChecked(menuGroup.name);

              return (
                <div key={menuGroup.name} className="permission-menu">
                  <div className="permission-header" onClick={() => toggle(menuGroup.name)}>
                    <div className="permission-header-left">
                      <span style={{ color: tokens.text }}>
                        {menuGroup.display_name || menuGroup.name.charAt(0).toUpperCase() + menuGroup.name.slice(1)}
                      </span>
                    </div>
                    <div className="permission-header-right" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {role && !permissionsLoading && menuPermissions[menuGroup.name]?.length > 0 && (
                        <label
                          className="permission-checkbox"
                          onClick={(e) => e.stopPropagation()}
                          style={{ display: 'flex', alignItems: 'center', margin: 0 }}
                        >
                          <input
                            type="checkbox"
                            checked={isSectionAllChecked}
                            onChange={() => handleSectionCheckAll(menuGroup.name)}
                          />
                          <div
                            className="permission-checkbox-custom"
                            style={{ borderColor: tokens.primary }}
                          ></div>
                          <span
                            className="permission-text"
                            style={{ color: tokens.text }}
                          >
                            {t("settings.role.modal.all")}
                          </span>
                        </label>
                      )}
                      <FontAwesomeIcon
                        icon={expanded[menuGroup.name] ? faChevronDown : faChevronRight}
                        style={{ color: tokens.text }}
                      />
                    </div>
                  </div>
                  {expanded[menuGroup.name] && (
                    <div className="permission-dropdown">
                      <div className="permission-checkboxes">
                        {menuPermissions[menuGroup.name]?.length > 0 ? (
                          menuPermissions[menuGroup.name].map(({ key, color, label }) => (
                            <label key={key} className="permission-checkbox">
                              <input
                                type="checkbox"
                                checked={perms[menuGroup.name]?.[key] || false}
                                onChange={(e) =>
                                  setPerm(menuGroup.name, key, e.target.checked)
                                }
                              />
                              <div
                                className="permission-checkbox-custom"
                                style={{ borderColor: color }}
                              ></div>
                              <span
                                className="permission-text"
                                style={{ color: tokens.text }}
                              >
                                {label}
                              </span>
                            </label>
                          ))
                        ) : (
                          <span style={{ color: tokens.text, opacity: 0.6 }}>
                            {t("settings.role.modal.no_permissions")} {menuGroup.display_name || menuGroup.name}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            {role && (
              <div
                className="save-permissions-section"
                style={{ marginTop: "20px", textAlign: "center" }}
              >
                <button
                  onClick={saveRolePermissions}
                  disabled={saveLoading}
                  className="btn btn-success"
                >
                  {saveLoading ? (
                    <>
                      <span className="spinner"></span>
                      {t("settings.role.modal.saving")}
                    </>
                  ) : (
                    t("settings.role.modal.save_permissions")
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </Modal>
    </>
  );
}
