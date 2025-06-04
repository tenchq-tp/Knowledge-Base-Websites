// components/UserSettings.js
"use client";

import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser, faEdit } from "@fortawesome/free-solid-svg-icons";
import { useTranslation } from "react-i18next";
import Swal from "sweetalert2";
import Modal from "../../component/Modal";

export default function UserSettings({ isDark, styles }) {
  const { t } = useTranslation();
  
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
    username: "",
    email: "",
    password: "",
    role: "",
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

  // API Functions
  const apiCall = async (endpoint, options = {}) => {
    const token = localStorage.getItem("access_token");
    const response = await fetch(`http://localhost:8000${endpoint}`, {
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      ...options,
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
      const data = await apiCall("/roles");
      setRolesList(data);
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
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role?.name || user.role_name || user.role || 'N/A', // เช็คหลายแบบ
          status: user.is_verified ? "active" : "inactive",
          updatedDate: user.updated_at ? 
            new Date(user.updated_at).toLocaleString('en-GB', {
              day: '2-digit', month: '2-digit', year: 'numeric',
              hour: '2-digit', minute: '2-digit'
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
    try {
      await apiCall("/users/create", {
        method: "POST",
        body: JSON.stringify(userData),
      });
      
      await loadUsers(searchUsername);
      showAlert("success", "Success", "User created successfully!");
    } catch (error) {
      throw error;
    }
  };

  // Utility Functions
  const showAlert = (type, title, text, timer = 2000) => {
    return Swal.fire({
      icon: type, title, text, timer,
      timerProgressBar: true,
      showConfirmButton: false,
    });
  };

  const resetForm = () => {
    setUserFormData({
      username: "", email: "", password: "", role: "",
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

  // Event Handlers
  const handleCreateUser = () => {
    setEditingUser(null);
    resetForm();
    setIsCreateUserModalOpen(true);
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
    setUserFormData({
      username: user.username,
      email: user.email,
      password: "",
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
    const result = await Swal.fire({
      icon: "warning",
      title: "Are you sure?",
      text: `You want to delete user "${username}"?`,
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
      cancelButtonText: "Cancel"
    });

    if (result.isConfirmed) {
      setUsersList(prev => prev.filter(user => user.id !== userId));
      showAlert("success", "Deleted!", "User has been deleted.");
    }
  };

  const handleSaveUser = async () => {
    // Validation
    const { username, email, password, role } = userFormData;
    
    if (!username.trim() || !email.trim() || !role) {
      return showAlert("warning", "Warning", "Please fill in all required fields");
    }

    if (!editingUser && (!password.trim() || password.trim().length < 8)) {
      return showAlert("warning", "Warning", 
        !password.trim() ? "Password is required for new users" : "Password must be at least 8 characters long"
      );
    }

    try {
      if (editingUser) {
        // TODO: Add update API call
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
          password: password.trim(),
          role_id: selectedRole.id,
          is_verified: false,
          profile: {
            title: userFormData.profile.title || null,
            first_name: userFormData.profile.first_name || null,
            last_name: userFormData.profile.last_name || null,
            phone: userFormData.profile.phone || null,
            date_of_birth: userFormData.profile.date_of_birth || null,
            gender: userFormData.profile.gender || null,
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

  // Effects
  useEffect(() => {
    loadUsers();
    fetchRoles();
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => loadUsers(searchUsername), 300);
    return () => clearTimeout(timeoutId);
  }, [searchUsername]);

  // Render Helpers
  const renderUserTable = () => (
    <table style={{ width: "100%", borderCollapse: "collapse" }}>
      <thead>
        <tr style={{ backgroundColor: isDark ? "#374151" : "#f9fafb" }}>
          {["#", "Username", "Email", "Role", "Status", "Updated date", "Action"].map((header) => (
            <th key={header} style={{
              padding: "0.75rem 0.5rem",
              textAlign: "left",
              fontSize: "0.9rem",
              fontWeight: "600",
              color: isDark ? "#e5e7eb" : "#374151",
              borderBottom: `1px solid ${isDark ? "#4a5568" : "#e5e7eb"}`
            }}>
              {header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {usersList.map((user, index) => (
          <tr key={user.id} style={{
            borderBottom: `1px solid ${isDark ? "#4a5568" : "#e5e7eb"}`,
            backgroundColor: index % 2 === 0 
              ? (isDark ? "#2d3748" : "#ffffff") 
              : (isDark ? "#374151" : "#f9fafb")
          }}>
            <td style={{ padding: "0.75rem 0.5rem", fontSize: "0.9rem", color: isDark ? "#ffffff" : "#333333" }}>
              {index + 1}
            </td>
            <td style={{ padding: "0.75rem 0.5rem", fontSize: "0.9rem", color: isDark ? "#ffffff" : "#333333" }}>
              {user.username}
            </td>
            <td style={{ padding: "0.75rem 0.5rem", fontSize: "0.9rem", color: isDark ? "#ffffff" : "#333333" }}>
              {user.email}
            </td>
            <td style={{ padding: "0.75rem 0.5rem", fontSize: "0.9rem", color: isDark ? "#ffffff" : "#333333" }}>
              {user.role}
            </td>
            <td style={{ padding: "0.75rem 0.5rem" }}>
              <span style={{
                padding: "0.25rem 0.5rem",
                borderRadius: "4px",
                fontSize: "0.8rem",
                fontWeight: "500",
                backgroundColor: user.status === "active" ? "#10b981" : "#ef4444",
                color: "white"
              }}>
                {user.status}
              </span>
            </td>
            <td style={{ padding: "0.75rem 0.5rem", fontSize: "0.9rem", color: isDark ? "#ffffff" : "#333333" }}>
              {user.updatedDate}
            </td>
            <td style={{ padding: "0.75rem 0.5rem" }}>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button
                  onClick={() => handleEditUser(user)}
                  style={{
                    backgroundColor: "#007bff",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    padding: "0.25rem 0.5rem",
                    fontSize: "0.8rem",
                    cursor: "pointer",
                  }}
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDeleteUser(user.id, user.username)}
                  style={{
                    backgroundColor: "#dc3545",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    padding: "0.25rem 0.5rem",
                    fontSize: "0.8rem",
                    cursor: "pointer",
                  }}
                >
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
    <div>
      <label style={{
        display: "block",
        fontSize: "0.9rem",
        fontWeight: "500",
        color: isDark ? "#ffffff" : "#333333",
        marginBottom: "0.5rem"
      }}>
        {label} {required && "*"}
      </label>
      {options ? (
        <select
          value={userFormData[name] || ""}
          onChange={(e) => setUserFormData(prev => ({ ...prev, [name]: e.target.value }))}
          disabled={name === 'role' && isLoadingRoles}
          style={{
            width: "100%",
            padding: "0.75rem",
            fontSize: "1rem",
            border: `1px solid ${isDark ? "#4a5568" : "#d1d5db"}`,
            borderRadius: "6px",
            backgroundColor: isDark ? "#2d3748" : "#ffffff",
            color: isDark ? "#ffffff" : "#333333",
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
          style={{
            width: "100%",
            padding: "0.75rem",
            fontSize: "1rem",
            border: `1px solid ${isDark ? "#4a5568" : "#d1d5db"}`,
            borderRadius: "6px",
            backgroundColor: isDark ? "#2d3748" : "#ffffff",
            color: isDark ? "#ffffff" : "#333333",
          }}
          placeholder={placeholder}
        />
      )}
    </div>
  );

  const renderProfileField = (label, name, type = "text", placeholder = "") => (
    <div>
      <label style={{
        display: "block",
        fontSize: "0.9rem",
        fontWeight: "500",
        color: isDark ? "#ffffff" : "#333333",
        marginBottom: "0.5rem"
      }}>
        {label}
      </label>
      <input
        type={type}
        value={userFormData.profile[name] || ""}
        onChange={(e) => setUserFormData(prev => ({
          ...prev,
          profile: { ...prev.profile, [name]: e.target.value }
        }))}
        style={{
          width: "100%",
          padding: "0.75rem",
          fontSize: "1rem",
          border: `1px solid ${isDark ? "#4a5568" : "#d1d5db"}`,
          borderRadius: "6px",
          backgroundColor: isDark ? "#2d3748" : "#ffffff",
          color: isDark ? "#ffffff" : "#333333",
        }}
        placeholder={placeholder}
      />
    </div>
  );

  // Role options
  const roleOptions = [
    { value: "", label: isLoadingRoles ? "Loading roles..." : "Select role" },
    ...rolesList.map(role => ({ value: role.name, label: role.name }))
  ];

  return (
    <>
      {/* User Settings Card */}
      <div style={styles.card}>
        <div style={{ ...styles.sectionHeader, justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center" }}>
            <FontAwesomeIcon
              icon={faUser}
              style={{
                fontSize: "1.5rem",
                color: "#4a90e2",
                marginRight: "0.75rem",
              }}
            />
            <h2 style={styles.sectionTitle}>
              {t("settings.user.title")}
            </h2>
          </div>
          <button
            onClick={() => setIsUserModalOpen(true)}
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
            }}
          >
            <FontAwesomeIcon icon={faEdit} />
            {t("settings.user.edit")}
          </button>
        </div>
      </div>

      {/* User Management Modal */}
      <Modal 
        isOpen={isUserModalOpen} 
        onClose={() => setIsUserModalOpen(false)} 
        title="User Management" 
        size="large"
      >
        <div style={{ padding: "1rem" }}>
          {/* Search and Create Button */}
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "1.5rem",
            flexWrap: "wrap",
            gap: "1rem"
          }}>
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              flex: "1",
              minWidth: "200px"
            }}>
              <label style={{
                fontSize: "1rem",
                fontWeight: "500",
                color: isDark ? "#ffffff" : "#333333"
              }}>
                Search:
              </label>
              <input
                type="text"
                placeholder="Search users..."
                value={searchUsername}
                onChange={(e) => setSearchUsername(e.target.value)}
                style={{
                  flex: "1",
                  padding: "0.5rem",
                  fontSize: "0.9rem",
                  border: `1px solid ${isDark ? "#4a5568" : "#d1d5db"}`,
                  borderRadius: "6px",
                  backgroundColor: isDark ? "#2d3748" : "#ffffff",
                  color: isDark ? "#ffffff" : "#333333",
                }}
              />
            </div>
            <button
              onClick={handleCreateUser}
              style={{
                backgroundColor: "#007bff",
                color: "white",
                border: "none",
                borderRadius: "6px",
                padding: "0.5rem 1rem",
                fontSize: "0.9rem",
                fontWeight: "bold",
                cursor: "pointer",
              }}
            >
              Create User
            </button>
          </div>

          {/* Users Table */}
          <div style={{
            border: `1px solid ${isDark ? "#4a5568" : "#e5e7eb"}`,
            borderRadius: "8px",
            backgroundColor: isDark ? "#2d3748" : "#ffffff",
            overflow: "hidden"
          }}>
            {loading ? (
              <div style={{
                textAlign: "center",
                padding: "2rem",
                color: isDark ? "#a0aec0" : "#666666"
              }}>
                Loading users...
              </div>
            ) : usersList.length === 0 ? (
              <div style={{
                textAlign: "center",
                padding: "2rem",
                color: isDark ? "#a0aec0" : "#666666"
              }}>
                No users found
              </div>
            ) : (
              renderUserTable()
            )}
          </div>
        </div>
      </Modal>

      {/* Create/Edit User Modal */}
      <Modal
        isOpen={isCreateUserModalOpen}
        onClose={() => setIsCreateUserModalOpen(false)}
        title={editingUser ? "Edit User" : "Create User"}
        size="large"
      >
        <div style={{ padding: "1rem" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
            {/* Left Column - Basic Info */}
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <h3 style={{
                color: isDark ? "#ffffff" : "#333333",
                marginBottom: "0.5rem",
                borderBottom: `1px solid ${isDark ? "#4a5568" : "#e5e7eb"}`,
                paddingBottom: "0.5rem"
              }}>
                Basic Information
              </h3>

              {renderFormField("Username", "username", "text", "Enter username", true)}
              {renderFormField("Email", "email", "email", "Enter email", true)}
              {!editingUser && renderFormField("Password", "password", "password", "Enter password", true)}
              {renderFormField("Role", "role", "text", "", true, roleOptions)}
            </div>

            {/* Right Column - Profile Info */}
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <h3 style={{
                color: isDark ? "#ffffff" : "#333333",
                marginBottom: "0.5rem",
                borderBottom: `1px solid ${isDark ? "#4a5568" : "#e5e7eb"}`,
                paddingBottom: "0.5rem"
              }}>
                Profile Information
              </h3>

              {renderProfileField("Title", "title", "text", "Mr./Ms./Dr.")}

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
                {renderProfileField("First Name", "first_name", "text", "First name")}
                {renderProfileField("Last Name", "last_name", "text", "Last name")}
              </div>

              {renderProfileField("Phone", "phone", "tel", "Phone number")}

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
                <div>
                  <label style={{
                    display: "block",
                    fontSize: "0.9rem",
                    fontWeight: "500",
                    color: isDark ? "#ffffff" : "#333333",
                    marginBottom: "0.5rem"
                  }}>
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    value={userFormData.profile.date_of_birth || ""}
                    onChange={(e) => setUserFormData(prev => ({
                      ...prev,
                      profile: { ...prev.profile, date_of_birth: e.target.value }
                    }))}
                    style={{
                      width: "100%",
                      padding: "0.75rem",
                      fontSize: "1rem",
                      border: `1px solid ${isDark ? "#4a5568" : "#d1d5db"}`,
                      borderRadius: "6px",
                      backgroundColor: isDark ? "#2d3748" : "#ffffff",
                      color: isDark ? "#ffffff" : "#333333",
                    }}
                  />
                </div>

                <div>
                  <label style={{
                    display: "block",
                    fontSize: "0.9rem",
                    fontWeight: "500",
                    color: isDark ? "#ffffff" : "#333333",
                    marginBottom: "0.5rem"
                  }}>
                    Gender
                  </label>
                  <select
                    value={userFormData.profile.gender || ""}
                    onChange={(e) => setUserFormData(prev => ({
                      ...prev,
                      profile: { ...prev.profile, gender: e.target.value }
                    }))}
                    style={{
                      width: "100%",
                      padding: "0.75rem",
                      fontSize: "1rem",
                      border: `1px solid ${isDark ? "#4a5568" : "#d1d5db"}`,
                      borderRadius: "6px",
                      backgroundColor: isDark ? "#2d3748" : "#ffffff",
                      color: isDark ? "#ffffff" : "#333333",
                    }}
                  >
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
                {renderProfileField("Country", "country", "text", "Country")}
                {renderProfileField("City", "city", "text", "City")}
              </div>

              <div>
                <label style={{
                  display: "block",
                  fontSize: "0.9rem",
                  fontWeight: "500",
                  color: isDark ? "#ffffff" : "#333333",
                  marginBottom: "0.5rem"
                }}>
                  Address
                </label>
                <textarea
                  value={userFormData.profile.address || ""}
                  onChange={(e) => setUserFormData(prev => ({
                    ...prev,
                    profile: { ...prev.profile, address: e.target.value }
                  }))}
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    fontSize: "1rem",
                    border: `1px solid ${isDark ? "#4a5568" : "#d1d5db"}`,
                    borderRadius: "6px",
                    backgroundColor: isDark ? "#2d3748" : "#ffffff",
                    color: isDark ? "#ffffff" : "#333333",
                    minHeight: "80px",
                    resize: "vertical"
                  }}
                  placeholder="Full address"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: "0.5rem",
            marginTop: "2rem",
            paddingTop: "1rem",
            borderTop: `1px solid ${isDark ? "#4a5568" : "#e5e7eb"}`
          }}>
            <button
              onClick={() => setIsCreateUserModalOpen(false)}
              style={{
                backgroundColor: "#6c757d",
                color: "white",
                border: "none",
                borderRadius: "6px",
                padding: "0.75rem 1.5rem",
                fontSize: "0.9rem",
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleSaveUser}
              style={{
                backgroundColor: "#28a745",
                color: "white",
                border: "none",
                borderRadius: "6px",
                padding: "0.75rem 1.5rem",
                fontSize: "0.9rem",
                cursor: "pointer",
              }}
            >
              {editingUser ? "Update" : "Create"}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}