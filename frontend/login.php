<?php
/**
 * Login Page
 * St. Agnes Academy of Caloocan Inc.
 * Prefect Disciplinary Action System
 */
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Login | Prefect Disciplinary Action System - St. Agnes Academy</title>

  <!-- Google Fonts & Font Awesome Icons -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
  
  <!-- System CSS -->
  <link rel="stylesheet" href="../assets/css/main.css">
  <link rel="stylesheet" href="../assets/css/dashboard.css">

  <style>
    body {
      background: radial-gradient(circle at top right, rgba(233, 30, 99, 0.15), transparent 40%),
                  radial-gradient(circle at bottom left, rgba(255, 95, 162, 0.1), transparent 40%),
                  var(--dark-bg);
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 20px;
      transition: background-color 0.3s ease, color 0.3s ease;
    }

    .login-box {
      width: 100%;
      max-width: 440px;
      background: var(--card-bg);
      backdrop-filter: blur(16px);
      border: 1px solid rgba(255, 95, 162, 0.3);
      border-radius: var(--radius-lg);
      padding: 45px 35px 35px 35px;
      box-shadow: var(--shadow-md), 0 0 30px rgba(233, 30, 99, 0.15);
      text-align: center;
      position: relative;
    }

    .login-theme-toggle {
      position: absolute;
      top: 15px;
      right: 15px;
    }

    .login-logo {
      width: 110px;
      height: 110px;
      margin: 0 auto 20px auto;
      object-fit: contain;
      filter: drop-shadow(0 6px 15px rgba(233, 30, 99, 0.5));
    }

    .login-header h2 {
      font-size: 1.25rem;
      font-weight: 800;
      color: var(--text-light);
      margin-bottom: 4px;
    }

    .login-header h3 {
      font-size: 0.95rem;
      font-weight: 700;
      color: var(--accent);
      margin-bottom: 25px;
    }

    .input-group {
      position: relative;
      margin-bottom: 20px;
      text-align: left;
    }

    .input-group label {
      display: block;
      font-size: 0.78rem;
      font-weight: 700;
      color: var(--text-muted);
      margin-bottom: 6px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .input-group input {
      width: 100%;
      padding: 12px 16px 12px 42px;
      background: var(--input-bg);
      border: 1px solid var(--input-border);
      border-radius: var(--radius-sm);
      color: var(--text-light);
      font-size: 0.9rem;
      outline: none;
      transition: var(--transition);
    }

    .input-group input:focus {
      border-color: var(--accent);
      box-shadow: 0 0 12px rgba(255, 95, 162, 0.3);
    }

    .input-group i {
      position: absolute;
      left: 15px;
      top: 36px;
      color: var(--accent);
      font-size: 1rem;
    }

    .form-options {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.82rem;
      color: var(--text-muted);
      margin-bottom: 25px;
    }

    .form-options a {
      color: var(--accent);
      text-decoration: none;
      font-weight: 600;
    }

    .form-options a:hover {
      text-decoration: underline;
    }

    .btn-login {
      width: 100%;
      padding: 14px;
      font-size: 1rem;
      font-weight: 700;
      background: linear-gradient(135deg, var(--brand-pink), #C2185B);
      color: #FFFFFF;
      border: 1px solid rgba(255, 95, 162, 0.3);
      border-radius: var(--radius-sm);
      cursor: pointer;
      box-shadow: var(--shadow-pink);
      transition: var(--transition);
    }

    .btn-login:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(233, 30, 99, 0.5);
    }

    .demo-roles {
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid var(--border-color);
    }

    .demo-roles p {
      font-size: 0.75rem;
      color: var(--text-muted);
      margin-bottom: 10px;
      font-weight: 600;
      text-transform: uppercase;
    }

    .role-btns {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
    }

    .role-btn {
      padding: 8px;
      font-size: 0.75rem;
      font-weight: 600;
      background: var(--input-bg);
      color: var(--text-light);
      border: 1px solid var(--border-color);
      border-radius: 6px;
      cursor: pointer;
      transition: var(--transition);
    }

    .role-btn:hover {
      background: var(--accent-light);
      color: var(--accent);
      border-color: var(--accent);
    }
  </style>
</head>
<body>

  <div class="login-box">
    <!-- Theme Toggle -->
    <div class="login-theme-toggle">
      <button class="theme-toggle-btn" id="themeToggleBtn" onclick="ThemeManager.toggleTheme()" title="Toggle Dark/Light Theme">
        <i class="fas fa-moon" id="themeToggleIcon"></i>
      </button>
    </div>

    <!-- St. Agnes Academy Crest Logo (Transparent) -->
    <img src="../assets/images/img_logo.png" alt="St. Agnes Academy Crest" class="login-logo">

    <div class="login-header">
      <h2>St. Agnes Academy of Caloocan Inc.</h2>
      <h3>Prefect Disciplinary Action System</h3>
    </div>

    <form id="loginForm" onsubmit="handleLoginSubmit(event)">
      <div class="input-group">
        <label>Email Address</label>
        <i class="fas fa-envelope"></i>
        <input type="email" id="email" value="admin@stagnes.edu.ph" placeholder="name@stagnes.edu.ph" required />
      </div>

      <div class="input-group">
        <label>Password</label>
        <i class="fas fa-lock"></i>
        <input type="password" id="password" value="Password123!" placeholder="••••••••••••" required />
      </div>

      <div class="form-options">
        <label style="display:flex; align-items:center; gap:6px; cursor:pointer;">
          <input type="checkbox" checked style="accent-color: var(--brand-pink);" /> Remember Me
        </label>
        <a href="#" onclick="alert('Please contact the System Administrator to reset your credentials.')">Forgot Password?</a>
      </div>

      <button type="submit" class="btn-login">
        <i class="fas fa-sign-in-alt"></i> Sign In to Dashboard
      </button>
    </form>
  </div>

  <!-- Scripts -->
  <script src="../assets/javascript/api.js"></script>
  <script src="../assets/javascript/auth.js"></script>
  <script src="../assets/javascript/app.js"></script>

  <script>
    async function handleLoginSubmit(e) {
      e.preventDefault();
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;

      try {
        await AuthManager.login(email, password);
        window.location.href = 'index.php';
      } catch (err) {
        alert('Login failed: ' + err.message);
      }
    }
  </script>
</body>
</html>
