"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import '../../style/login.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faLock, faEarthAmericas, faGlobe } from '@fortawesome/free-solid-svg-icons';
import Swal from 'sweetalert2';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

     if (!username.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Incomplete Information!',
        text: 'Please enter your username',
        confirmButtonText: 'OK',
        iconColor: '#ff9500'
      });
      setIsLoading(false);
      return;
    }

    if (!password.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Incomplete Information!',
        text: 'Please enter your password',
        confirmButtonText: 'OK',
        iconColor: '#ff9500'
      });
      setIsLoading(false);
      return;
    }

    try {
      // เชื่อมต่อกับ FastAPI backend
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, {
        method: 'POST',
        
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          username, 
          password 
        })
      });
      console.log(response)
      const data = await response.json();
      
      if (response.ok && data.access_token) {
        // **เก็บ token และข้อมูล user ใน localStorage**
        localStorage.setItem('access_token', data.access_token);
        localStorage.setItem('refresh_token', data.refresh_token);
        localStorage.setItem('token_type', data.token_type);
        localStorage.setItem('user_data', JSON.stringify(data.user));
        
        // เก็บข้อมูลสำคัญแยกเพื่อง่ายต่อการเข้าถึง
        localStorage.setItem('user_id', data.user.id.toString());
        localStorage.setItem('username', data.user.username);
        localStorage.setItem('user_role', data.user.role);
        localStorage.setItem('is_verified', data.user.is_verified.toString());

        Swal.fire({
          icon: 'success',
          title: 'OK',
          text: 'Login Successful!',
          text: `Welcome , ${data.user.username}`,
          confirmButtonText: 'OK'
        }).then(() => {
          router.push('../../pages/home');
        });
       } else {
        Swal.fire({
          icon: 'error',
          title: 'Login Failed',
          text: data.detail || 'Invalid credentials',
          confirmButtonText: 'Try Again'
        });
      }
    } catch (error) {
      console.error('Login error:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Cannot connect to server Please try again.',
        confirmButtonText: 'OK'
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
          <Link href="/reset-password" className="forgot-link">Change Password?</Link>
        </div>
        <div className="button button-centered">
          <button 
            type="submit" 
            className="btn-login"
            disabled={isLoading}
          >
            {isLoading ? 'Logging in...' : 'Login'}
          </button>
        </div>
      </form>
    </div>
  );
}