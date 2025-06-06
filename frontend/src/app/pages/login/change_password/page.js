"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUser,
  faLock,
  faGlobe,
  faArrowLeft,
} from "@fortawesome/free-solid-svg-icons";
import Swal from "sweetalert2";
import "../../../style/login.css";

export default function ChangePasswordPage() {
  const [username, setUsername] = useState("");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleChangePassword = async (e) => {
    e.preventDefault();

    if (!username || !oldPassword || !newPassword || !confirmPassword) {
      Swal.fire({
        icon: "warning",
        title: "Incomplete Information!",
        text: "Please fill out all fields",
        confirmButtonText: "OK",
        iconColor: "#ff9500",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      Swal.fire({
        icon: "error",
        title: "Mismatch",
        text: "New passwords do not match",
        confirmButtonText: "OK",
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API}/users/change-password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            accept: "application/json",
          },
          body: JSON.stringify({
            username: username,
            old_password: oldPassword,
            new_password: newPassword,
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        Swal.fire({
          icon: "success",
          title: "Password Changed!",
          text: "You can now log in with your new password",
          confirmButtonText: "Login",
        }).then(() => {
          router.push("/pages/login");
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: data.detail || "Failed to change password",
          confirmButtonText: "Try Again",
        });
      }
    } catch (error) {
      console.error("Change password error:", error);
      Swal.fire({
        icon: "error",
        title: "Server Error",
        text: "Could not connect to server",
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
        <h1 className="login-title">Change Password</h1>
      </div>
      <form onSubmit={handleChangePassword} className="login-form">
        <div className="input-container">
          <FontAwesomeIcon icon={faUser} className="input-icon" />
          <input
            type="text"
            placeholder="Username"
            value={username}
            disabled={isLoading}
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>
        <div className="input-container">
          <FontAwesomeIcon icon={faLock} className="input-icon" />
          <input
            type="password"
            placeholder="Old Password"
            value={oldPassword}
            disabled={isLoading}
            onChange={(e) => setOldPassword(e.target.value)}
          />
        </div>
        <div className="input-container">
          <FontAwesomeIcon icon={faLock} className="input-icon" />
          <input
            type="password"
            placeholder="New Password"
            value={newPassword}
            disabled={isLoading}
            onChange={(e) => setNewPassword(e.target.value)}
          />
        </div>
        <div className="input-container">
          <FontAwesomeIcon icon={faLock} className="input-icon" />
          <input
            type="password"
            placeholder="Confirm New Password"
            value={confirmPassword}
            disabled={isLoading}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </div>

        <div className="ChangePassword">
          <Link href="/pages/login" className="forgot-link">
            <FontAwesomeIcon icon={faArrowLeft} /> Go Back to Login
          </Link>
        </div>

        <div className="button button-centered">
          <button type="submit" className="btn-login" disabled={isLoading}>
            {isLoading ? "Changing..." : "Change Password"}
          </button>
        </div>
      </form>
    </div>
  );
}
