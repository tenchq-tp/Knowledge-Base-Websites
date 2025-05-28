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
  const router = useRouter();

  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: Add authentication logic here (e.g., check credentials)
    // If login successful, show popup and redirect

    
    Swal.fire({
      icon: 'success',
      title: 'OK',
      text: 'Login Successful!',
      confirmButtonText: 'OK'
    }).then(() => {
      router.push('../../pages/home');
    });
  };

  return (
    <div className="login-container">
      <div className= "login-header">
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
          />
        </div>
        <div className="ChangePassword">
          <Link href="/reset-password" className="forgot-link">Change Password?</Link>
        </div>
        <div className="button button-centered">
          <button type="submit" className="btn-login">Login</button>
        </div>
      </form>
    </div>
  );
}
