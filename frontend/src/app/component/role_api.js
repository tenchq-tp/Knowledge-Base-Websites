class RoleApi {
  constructor() {
    this.baseURL = process.env.NEXT_PUBLIC_API;
  }

  // Base API call method
  async apiCall(endpoint, options = {}) {
    const token = localStorage.getItem("access_token");
    
    const config = {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      ...options,
    };

    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, config);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        let errorMessage = "API request failed";

        if (errorData.detail) {
          errorMessage = Array.isArray(errorData.detail)
            ? errorData.detail
                .map((err) => `${err.loc?.slice(-1)[0] || "field"}: ${err.msg}`)
                .join(", ")
            : errorData.detail;
        }

        throw new Error(errorMessage);
      }

      return response.json();
    } catch (error) {
      console.error(`API Error [${endpoint}]:`, error);
      throw error;
    }
  }

  // Get all roles
  async getRoles() {
    return this.apiCall("/roles");
  }

  // Create new role
  async createRole(roleData) {
    return this.apiCall("/roles", {
      method: "POST",
      body: JSON.stringify(roleData),
    });
  }

  // Update role
  async updateRole(roleId, roleData) {
    return this.apiCall(`/roles/${roleId}`, {
      method: "PUT",
      body: JSON.stringify(roleData),
    });
  }

  // Delete role
  async deleteRole(roleId) {
    return this.apiCall(`/roles/${roleId}`, {
      method: "DELETE",
    });
  }

  // Get all permissions
  async getPermissions() {
    return this.apiCall("/permissions");
  }

  // Get role permissions by role ID
  async getRolePermissions(roleId) {
    return this.apiCall(`/role-permissions/role/${roleId}`);
  }

  // Update role permissions
  async updateRolePermissions(roleId, permissionIds) {
    return this.apiCall("/role-permissions/role", {
      method: "PUT",
      body: JSON.stringify({
        role_id: roleId,
        permission_id: permissionIds,
      }),
    });
  }
}

// Create singleton instance
const roleApi = new RoleApi();
export default roleApi;