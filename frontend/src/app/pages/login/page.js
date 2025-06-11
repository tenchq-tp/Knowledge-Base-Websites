"use client";
import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import "../../style/login.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser, faLock, faGlobe } from "@fortawesome/free-solid-svg-icons";
import Swal from "sweetalert2";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    if (!username.trim()) {
      Swal.fire({
        icon: "warning",
        title: "Incomplete Information!",
        text: "Please enter your username",
        confirmButtonText: "OK",
        iconColor: "#ff9500",
      });
      setIsLoading(false);
      return;
    }

    if (!password.trim()) {
      Swal.fire({
        icon: "warning",
        title: "Incomplete Information!",
        text: "Please enter your password",
        confirmButtonText: "OK",
        iconColor: "#ff9500",
      });
      setIsLoading(false);
      return;
    }

    try {
      // สร้าง form data string สำหรับส่งแบบ x-www-form-urlencoded
      const formData = new URLSearchParams();
      formData.append("username", username);
      formData.append("password", password);
      formData.append("grant_type", "");
      formData.append("scope", "");
      formData.append("client_id", "");
      formData.append("client_secret", "");

      // เชื่อมต่อกับ FastAPI backend
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API}/auth/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            accept: "application/json",
          },
          body: formData.toString(), // ส่งข้อมูลในรูปแบบ query string
        }
      );

      const data = await response.json();
      console.log("Login response:", data);

      if (response.ok && data.access_token) {
        // 1. เก็บ token และข้อมูล user ใน localStorage
        localStorage.setItem("access_token", data.access_token);
        localStorage.setItem("refresh_token", data.refresh_token);
        localStorage.setItem("token_type", data.token_type);
        localStorage.setItem("user_data", JSON.stringify(data.user));
        localStorage.setItem("user_id", data.user.id.toString());
        localStorage.setItem("username", data.user.username);
        localStorage.setItem("user_role", data.user.role_name);
        localStorage.setItem("is_verified", data.user.is_verified.toString());

        // 2. เรียก role-permissions/me และเก็บใน localStorage
        try {
          const roleResponse = await fetch(
            `${process.env.NEXT_PUBLIC_API}/role-permissions/me`,
            {
              method: "GET",
              headers: {
                accept: "application/json",
                Authorization: `Bearer ${data.access_token}`,
              },
            }
          );

          const roleData = await roleResponse.json();
          if (roleResponse.ok) {
            localStorage.setItem(
              "user_permissions",
              JSON.stringify(roleData.permissions)
            );
            localStorage.setItem("user_role_id", roleData.role_id.toString());
          } else {
            console.warn("Failed to fetch permissions:", roleData);
          }
        } catch (roleError) {
          console.error("Error fetching role permissions:", roleError);
        }

        // 3. แสดง Swal แล้ว redirect
        Swal.fire({
          icon: "success",
          title: "Login Success",
          text: `Welcome, ${data.user.username}`,
          confirmButtonText: "OK",
        }).then(() => {
          router.push("../../pages/home");
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Login Failed",
          text: data.detail || "Invalid credentials",
          confirmButtonText: "Try Again",
        });
      }
    } catch (error) {
      console.error("Login error:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Cannot connect to server. Please try again.",
        confirmButtonText: "OK",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-header">
        <FontAwesomeIcon icon={faGlobe} className="login-icon" />
        <h1 className="login-title">Login</h1>
      </div>
      <form onSubmit={handleSubmit} className="login-form">
        <div className="input-container">
          <FontAwesomeIcon icon={faUser} className="input-icon" />
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            disabled={isLoading}
          />
        </div>
        <div className="input-container">
          <FontAwesomeIcon icon={faLock} className="input-icon" />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={isLoading}
          />
        </div>
        <div className="ChangePassword">
          <Link href="/pages/login/change_password" className="forgot-link">
            Change Password?
          </Link>
        </div>
        <div className="button button-centered">
          <button type="submit" className="btn-login" disabled={isLoading}>
            {isLoading ? "Logging in..." : "Login"}
          </button>
        </div>
      </form>
    </div>
  );
}
