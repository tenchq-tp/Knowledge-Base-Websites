class UserApi {
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

  //เรียก user
  async getUsers(params = { skip: 0, limit: 100 }) {
    const queryParams = new URLSearchParams(params);
    return this.apiCall(`/users/?${queryParams.toString()}`);
  }

  //สร้าง user ใหม่
  async createUser(userData) {
    return this.apiCall("/users/create", {
      method: "POST",
      body: JSON.stringify(userData),
    });
  }

  //อัปเดต user
  async updateUser(userId, userData) {
    return this.apiCall(`/users/${userId}`, {
      method: "PUT",
      body: JSON.stringify(userData),
    });
  }

  //ลบ user
  async deleteUser(username) {
    return this.apiCall(`/users/${username}`, {
      method: "DELETE",
    });
  }

  // Role-related API methods
  async getRoles() {
    return this.apiCall("/roles");
  }
}

// Create singleton instance
const userApi = new UserApi();
export default userApi;