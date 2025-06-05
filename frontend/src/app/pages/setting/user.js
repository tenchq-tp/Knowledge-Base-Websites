// components/UserSettings.js
"use client";

import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser, faEdit } from "@fortawesome/free-solid-svg-icons";
import { useTranslation } from "react-i18next";
import Swal from "sweetalert2";
import Modal from "../../component/setting_modal";
import { useTheme } from "../../contexts/ThemeContext";
import "../../style/user_setting.css";


export default function UserSettings() {
  const { t } = useTranslation();
  const { tokens, getComponentStyle } = useTheme();

  // State Management
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isCreateUserModalOpen, setIsCreateUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [searchUsername, setSearchUsername] = useState("");
  const [usersList, setUsersList] = useState([]);
  const [rolesList, setRolesList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isLoadingRoles, setIsLoadingRoles] = useState(false);
  const [userFormData, setUserFormData] = useState({
    username: "", email: "", role: "",
    profile: { title: "", first_name: "", last_name: "", phone: "", date_of_birth: "", gender: "", country: "", city: "", address: "" }
  });

  // API Functions
  const apiCall = async (endpoint, options = {}) => {
    const token = localStorage.getItem("access_token");
    const response = await fetch(`http://localhost:8000${endpoint}`, {
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}`, }, ...options,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      let errorMessage = "API request failed";

      if (errorData.detail) {
        errorMessage = Array.isArray(errorData.detail)
          ? errorData.detail.map(err => `${err.loc?.slice(-1)[0] || 'field'}: ${err.msg}`).join(', ')
          : errorData.detail;
      }

      throw new Error(errorMessage);
    }

    return response.json();
  };

  const fetchRoles = async () => {
    setIsLoadingRoles(true);
    try {
      const data = await apiCall("/roles"); setRolesList(data);
    } catch (error) {
      showAlert("error", "Error", "Failed to load roles. Please try again.");
    } finally {
      setIsLoadingRoles(false);
    }
  };

  const loadUsers = async (searchTerm = "") => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ skip: 0, limit: 100 });
      if (searchTerm) params.append('search', searchTerm);

      const users = await apiCall(`/users/?${params.toString()}`);

      const formattedUsers = users.map(user => {
        return {
          id: user.id, username: user.username, email: user.email, role: user.role?.name || user.role_name || user.role || 'N/A', 
          status: user.is_verified ? "active" : "inactive",
          updatedDate: user.updated_at ? new Date(user.updated_at).toLocaleString('en-GB', {
            day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
          }).replace(',', '') : 'N/A',
          profile: user.profile || {}
        };
      });

      setUsersList(formattedUsers);
    } catch (error) {
      console.error("Load users error:", error);
      showAlert("error", "Error", "Failed to load users. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const createUser = async (userData) => {
    await apiCall("/users/create", { method: "POST", body: JSON.stringify(userData) });
    await loadUsers(searchUsername);
    showAlert("success", "Success", "User created successfully!");
  };

  const showAlert = (type, title, text, timer = 2000) =>
    Swal.fire({ icon: type, title, text, timer, timerProgressBar: true, showConfirmButton: false });

  const resetForm = () => {
    setUserFormData({
      username: "", email: "", role: "",
      profile: {
        title: "",
        first_name: "",
        last_name: "",
        phone: "",
        date_of_birth: "",
        gender: "",
        country: "",
        city: "",
        address: ""
      }
    });
  };

  const handleCreateUser = () => { setEditingUser(null); resetForm(); setIsCreateUserModalOpen(true); };

  const handleEditUser = (user) => {
    setEditingUser(user);
    setUserFormData({
      username: user.username,
      email: user.email,
      role: user.role,
      profile: {
        title: user.profile?.title || "",
        first_name: user.profile?.first_name || "",
        last_name: user.profile?.last_name || "",
        phone: user.profile?.phone || "",
        date_of_birth: user.profile?.date_of_birth || "",
        gender: user.profile?.gender || "",
        country: user.profile?.country || "",
        city: user.profile?.city || "",
        address: user.profile?.address || ""
      }
    });
    setIsCreateUserModalOpen(true);
  };

  const handleDeleteUser = async (userId, username) => {
    const result = await Swal.fire({ icon: "warning", title: "Are you sure?", text: `You want to delete user "${username}"?`, showCancelButton: true, confirmButtonColor: "#d33", cancelButtonColor: "#3085d6", confirmButtonText: "Yes, delete it!", cancelButtonText: "Cancel" });

    if (result.isConfirmed) {
      try {
        await apiCall(`/users/${username}`, { method: "DELETE" });
        setUsersList(prev => prev.filter(user => user.id !== userId));
        await loadUsers(searchUsername);
        showAlert("success", "Success", "User deleted successfully!");
      } catch (error) {
        const errorMessage = error.message !== "[object Object]" ? error.message : "Failed to delete user.";
        showAlert("error", "Error", errorMessage);
      }
    }
  };

  const handleSaveUser = async () => {
    const { username, email, role, profile } = userFormData;

    if (!username.trim() || !email.trim() || !role ||
      !profile.title || !profile.first_name?.trim() ||
      !profile.last_name?.trim() || !profile.gender) {
      return showAlert("warning", "Warning", "Please fill in all required fields");
    }

    try {
      if (editingUser) {
        setUsersList(prev => prev.map(user =>
          user.id === editingUser.id
            ? {
              ...user,
              username: userFormData.username,
              email: userFormData.email,
              role: userFormData.role,
              profile: userFormData.profile,
              updatedDate: new Date().toLocaleString('en-GB', {
                day: '2-digit', month: '2-digit', year: 'numeric',
                hour: '2-digit', minute: '2-digit'
              }).replace(',', '')
            }
            : user
        ));
        showAlert("success", "Success", "User updated successfully!");
      } else {
        const selectedRole = rolesList.find(role => role.name === userFormData.role.trim());

        if (!selectedRole) {
          return showAlert("warning", "Warning", `Role "${userFormData.role}" not found`);
        }

        const apiData = {
          username: username.trim(),
          email: email.trim(),
          password: "P@ssW0rd",
          role_id: selectedRole.id,
          is_verified: false,
          profile: {
            title: userFormData.profile.title,
            first_name: userFormData.profile.first_name.trim(),
            last_name: userFormData.profile.last_name.trim(),
            phone: userFormData.profile.phone || null,
            date_of_birth: userFormData.profile.date_of_birth || null,
            gender: userFormData.profile.gender,
            country: userFormData.profile.country || null,
            city: userFormData.profile.city || null,
            address: userFormData.profile.address || null,
          }
        };

        await createUser(apiData);
      }

      setIsCreateUserModalOpen(false);
      setEditingUser(null);
    } catch (error) {
      const errorMessage = error.message && error.message !== "[object Object]"
        ? error.message
        : "Failed to save user. Please try again.";

      showAlert("error", "Error", errorMessage);
    }
  };

  useEffect(() => {
    loadUsers();
    fetchRoles();
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => loadUsers(searchUsername), 300);
    return () => clearTimeout(timeoutId);
  }, [searchUsername]);

  const renderUserTable = () => (
    <table className="users-table">
      <thead>
        <tr className="table-header" style={{ backgroundColor: tokens.surfaceAlt }}>{["#", "Username", "Email", "Role", "Status", "Updated date", "Action"].map((header) => (<th key={header} style={{ color: tokens.text, borderBottomColor: tokens.border }}> {header} </th>))}</tr>
      </thead>
      <tbody>
        {usersList.map((user, index) => (<tr key={user.id} className="table-row" style={{ ...getComponentStyle('table-stripe')(index), borderBottomColor: tokens.border }}>
          <td style={{ color: tokens.text }}>{index + 1}</td>
          <td style={{ color: tokens.text }}>{user.username}</td>
          <td style={{ color: tokens.text }}>{user.email}</td>
          <td style={{ color: tokens.text }}>{user.role}</td>
          <td>
            <span className={`status-badge ${user.status === "active" ? "status-active" : "status-inactive"}`}>
              {user.status}
            </span>
          </td>
          <td style={{ color: tokens.text }}>{user.updatedDate}</td>
          <td>
            <div className="action-buttons">
              <button onClick={() => handleEditUser(user)} className="btn btn-edit">
                Edit
              </button>
              <button onClick={() => handleDeleteUser(user.id, user.username)} className="btn btn-delete">
                Delete
              </button>
            </div>
          </td>
        </tr>
        ))}
      </tbody>
    </table>
  );

  const renderFormField = (label, name, type = "text", placeholder = "", required = false, options = null) => (
    <div className="form-group">
      <label className="form-label" style={{ color: tokens.text }}>
        {label} {required && <span className="required">*</span>}
      </label>
      {options ? (
        <select
          value={userFormData[name] || ""}
          onChange={(e) => setUserFormData(prev => ({ ...prev, [name]: e.target.value }))}
          disabled={name === 'role' && isLoadingRoles}
          className="form-field form-select"
          style={{
            backgroundColor: tokens.surface,
            borderColor: tokens.border,
            color: tokens.text,
            opacity: (name === 'role' && isLoadingRoles) ? 0.6 : 1,
          }}
        >
          {options.map(option => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      ) : (
        <input
          type={type}
          value={userFormData[name] || ""}
          onChange={(e) => setUserFormData(prev => ({ ...prev, [name]: e.target.value }))}
          className="form-field"
          style={{
            backgroundColor: tokens.surface,
            borderColor: tokens.border,
            color: tokens.text
          }}
          placeholder={placeholder}
        />
      )}
    </div>
  );

  const roleOptions = [
    { value: "", label: isLoadingRoles ? "Loading roles..." : "Select role" },
    ...rolesList.map(role => ({ value: role.name, label: role.name }))
  ];

  return (
    <>
      <div className="setting-card" style={{ backgroundColor: tokens.surface, borderColor: tokens.border }}>
        <div className="section-header" style={{ borderBottomColor: tokens.border }}>
          <div className="section-info">
            <FontAwesomeIcon icon={faUser} className="section-icon" />
            <h2 className="section-title" style={{ color: tokens.text }}>
              {t("settings.user.title")}
            </h2>
          </div>
          <button onClick={() => setIsUserModalOpen(true)} className="btn btn-primary"><FontAwesomeIcon icon={faEdit} /> Manage </button>
        </div>
      </div>

      <Modal isOpen={isUserModalOpen} onClose={() => setIsUserModalOpen(false)} title="User Management" size="large">
        <div className="modal-content">
          <div className="search-section">
            <div className="search-input-group">
              <label className="form-label" style={{ color: tokens.text }}>Search:</label>
              <input
                type="text"
                placeholder="Search users..."
                value={searchUsername}
                onChange={(e) => setSearchUsername(e.target.value)}
                className="form-field search-input"
                style={{
                  backgroundColor: tokens.surface,
                  borderColor: tokens.border,
                  color: tokens.text
                }}
              />
            </div>
            <button onClick={handleCreateUser} className="btn btn-create">
              Create User
            </button>
          </div>

          <div className="table-container" style={{
            borderColor: tokens.border,
            backgroundColor: tokens.surface
          }}>
            {loading ? (<div className="loading-state" style={{ color: tokens.textSecondary }}>Loading users...</div>) : usersList.length === 0 ? (<div className="empty-state" style={{ color: tokens.textSecondary }}>No users found</div>
            ) : (
              renderUserTable()
            )}
          </div>
        </div>
      </Modal>

      <Modal isOpen={isCreateUserModalOpen} onClose={() => setIsCreateUserModalOpen(false)} title={editingUser ? "Edit User" : "Create User"} size="large">
        <div className="modal-content">
          <div className="form-grid">
            <div className="form-section"><h3 className="form-section-title" style={{ color: tokens.text, borderBottomColor: tokens.border }}>Basic Information</h3>
              {renderFormField("Username", "username", "text", "Enter username", true)}
              <div className="form-group">
                <label className="form-label" style={{ color: tokens.text }}>
                  Email <span className="required">*</span>
                </label>
                <input
                  type="email"
                  value={userFormData.email || ""}
                  onChange={(e) => setUserFormData(prev => ({ ...prev, email: e.target.value }))}
                  onFocus={(e) => {
                    if (!userFormData.email && userFormData.username) {
                      setUserFormData(prev => ({
                        ...prev,
                        email: `${prev.username}@company.com`
                      }));
                    }
                  }}
                  className="form-field"
                  style={{
                    backgroundColor: tokens.surface,
                    borderColor: tokens.border,
                    color: tokens.text
                  }}
                  placeholder="Enter email"
                />
              </div>
              {renderFormField("Role", "role", "text", "", true, roleOptions)}
            </div>

            <div className="form-section">
              <h3 className="form-section-title" style={{
                color: tokens.text,
                borderBottomColor: tokens.border
              }}>
                Profile Information
              </h3>

              <div className="form-group">
                <label className="form-label" style={{ color: tokens.text }}>
                  Title <span className="required">*</span>
                </label>
                <select
                  value={userFormData.profile.title || ""}
                  onChange={(e) => setUserFormData(prev => ({
                    ...prev,
                    profile: { ...prev.profile, title: e.target.value }
                  }))}
                  className="form-field form-select"
                  style={{
                    backgroundColor: tokens.surface,
                    borderColor: tokens.border,
                    color: tokens.text
                  }}
                >
                  <option value="">Select title</option>
                  <option value="Mr.">Mr.</option>
                  <option value="Ms.">Ms.</option>
                  <option value="Mrs.">Mrs.</option>
                  <option value="Dr.">Dr.</option>
                </select>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label" style={{ color: tokens.text }}>
                    First Name <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    value={userFormData.profile.first_name || ""}
                    onChange={(e) => setUserFormData(prev => ({
                      ...prev,
                      profile: { ...prev.profile, first_name: e.target.value }
                    }))}
                    className="form-field"
                    style={{
                      backgroundColor: tokens.surface,
                      borderColor: tokens.border,
                      color: tokens.text
                    }}
                    placeholder="First name"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ color: tokens.text }}>
                    Last Name <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    value={userFormData.profile.last_name || ""}
                    onChange={(e) => setUserFormData(prev => ({
                      ...prev,
                      profile: { ...prev.profile, last_name: e.target.value }
                    }))}
                    className="form-field"
                    style={{
                      backgroundColor: tokens.surface,
                      borderColor: tokens.border,
                      color: tokens.text
                    }}
                    placeholder="Last name"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" style={{ color: tokens.text }}>
                  Phone
                </label>
                <input
                  type="tel"
                  value={userFormData.profile.phone || ""}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9]/g, '');
                    setUserFormData(prev => ({
                      ...prev,
                      profile: { ...prev.profile, phone: value }
                    }));
                  }}
                  className="form-field"
                  style={{
                    backgroundColor: tokens.surface,
                    borderColor: tokens.border,
                    color: tokens.text
                  }}
                  placeholder="Phone number"
                  maxLength="15"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label" style={{ color: tokens.text }}>
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    value={userFormData.profile.date_of_birth || ""}
                    onChange={(e) => setUserFormData(prev => ({
                      ...prev,
                      profile: { ...prev.profile, date_of_birth: e.target.value }
                    }))}
                    className="form-field"
                    style={{
                      backgroundColor: tokens.surface,
                      borderColor: tokens.border,
                      color: tokens.text
                    }}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ color: tokens.text }}>
                    Gender <span className="required">*</span>
                  </label>
                  <select
                    value={userFormData.profile.gender || ""}
                    onChange={(e) => setUserFormData(prev => ({
                      ...prev,
                      profile: { ...prev.profile, gender: e.target.value }
                    }))}
                    className="form-field form-select"
                    style={{
                      backgroundColor: tokens.surface,
                      borderColor: tokens.border,
                      color: tokens.text
                    }}
                  >
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label" style={{ color: tokens.text }}>Country</label>
                  <input type="text" value={userFormData.profile.country || ""}
                    onChange={(e) => setUserFormData(prev => ({ ...prev, profile: { ...prev.profile, country: e.target.value } }))}
                    className="form-field" style={{ backgroundColor: tokens.surface, borderColor: tokens.border, color: tokens.text }} placeholder="Country" />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ color: tokens.text }}>City</label>
                  <input type="text" value={userFormData.profile.city || ""}
                    onChange={(e) => setUserFormData(prev => ({ ...prev, profile: { ...prev.profile, city: e.target.value } }))}
                    className="form-field" style={{ backgroundColor: tokens.surface, borderColor: tokens.border, color: tokens.text }} placeholder="City" />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" style={{ color: tokens.text }}>
                  Address
                </label>
                <textarea
                  value={userFormData.profile.address || ""}
                  onChange={(e) => setUserFormData(prev => ({
                    ...prev,
                    profile: { ...prev.profile, address: e.target.value }
                  }))}
                  className="form-field form-textarea"
                  style={{
                    backgroundColor: tokens.surface,
                    borderColor: tokens.border,
                    color: tokens.text
                  }}
                  placeholder="Full address"
                />
              </div>
            </div>
          </div>

          <div className="modal-actions" style={{ borderTopColor: tokens.border }}>
            <button
              onClick={() => setIsCreateUserModalOpen(false)}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveUser}
              className="btn btn-success"
            >
              {editingUser ? "Update" : "Create"}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}