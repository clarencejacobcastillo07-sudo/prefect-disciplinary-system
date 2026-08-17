<?php
/**
 * Dashboard / Main Application Page
 * St. Agnes Academy of Caloocan Inc.
 * Prefect Disciplinary Action System
 */
?>
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Prefect Disciplinary Action System - St. Agnes Academy</title>

    <!-- Google Fonts & Font Awesome Icons -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap"
        rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">

    <!-- System CSS -->
    <link rel="stylesheet" href="../assets/css/main.css">
    <link rel="stylesheet" href="../assets/css/dashboard.css">
</head>

<body>

    <div class="app-container">

        <!-- Sidebar Navigation -->
        <aside class="sidebar">
            <div class="sidebar-header">
                <img src="../assets/images/img_logo.png" alt="St. Agnes Logo" class="sidebar-logo">
                <div class="sidebar-title">
                    <h2>St. Agnes Academy</h2>
                    <p>Prefect Disciplinary</p>
                </div>
            </div>

            <div class="sidebar-menu">
                <div class="menu-category">Main Workspace</div>
                <a class="nav-item active" data-module="dashboard" onclick="Router.navigate('dashboard')">
                    <i class="fas fa-chart-pie"></i> <span>Dashboard</span>
                </a>

                <div class="menu-category">Discipline &amp; Incidents</div>
                <a class="nav-item" data-module="infractions" onclick="Router.navigate('infractions')">
                    <i class="fas fa-edit"></i> <span>Infraction Logging</span>
                </a>
                <a class="nav-item" data-module="behavior" onclick="Router.navigate('behavior')">
                    <i class="fas fa-heartbeat"></i> <span>Behavior Monitoring</span>
                </a>
                <a class="nav-item" data-module="violations" onclick="Router.navigate('violations')">
                    <i class="fas fa-list-ul"></i> <span>Violation Categories</span>
                </a>

                <div class="menu-category">Proceedings &amp; Actions</div>
                <a class="nav-item" data-module="sanctions" onclick="Router.navigate('sanctions')">
                    <i class="fas fa-gavel"></i> <span>Sanction Management</span>
                </a>
                <a class="nav-item" data-module="notifications" onclick="Router.navigate('notifications')">
                    <i class="fas fa-sms"></i> <span>Parent Notification</span>
                </a>
                <a class="nav-item" data-module="hearings" onclick="Router.navigate('hearings')">
                    <i class="fas fa-calendar-check"></i> <span>Disciplinary Hearings</span>
                </a>

                <div class="menu-category">Student Standing</div>
                <a class="nav-item" data-module="points" onclick="Router.navigate('points')">
                    <i class="fas fa-star"></i> <span>Behavior Points</span>
                </a>
                <a class="nav-item" data-module="clearance" onclick="Router.navigate('clearance')">
                    <i class="fas fa-user-lock"></i> <span>Clearance Hold</span>
                </a>
                <a class="nav-item" data-module="reformation" onclick="Router.navigate('reformation')">
                    <i class="fas fa-hands-helping"></i> <span>Reformation Program</span>
                </a>

                <div class="menu-category">Analytics &amp; Admin</div>
                <a class="nav-item" data-module="incident-reports" onclick="Router.navigate('incident-reports')">
                    <i class="fas fa-file-pdf"></i> <span>Incident Reports</span>
                </a>
                <a class="nav-item" data-module="analytics" onclick="Router.navigate('analytics')">
                    <i class="fas fa-chart-line"></i> <span>Reports &amp; Analytics</span>
                </a>
                <a class="nav-item" data-module="users" onclick="Router.navigate('users')">
                    <i class="fas fa-users-cog"></i> <span>User Management</span>
                </a>
                <a class="nav-item" data-module="audit" onclick="Router.navigate('audit')">
                    <i class="fas fa-clipboard-list"></i> <span>Audit Logs</span>
                </a>
                <a class="nav-item" data-module="settings" onclick="Router.navigate('settings')">
                    <i class="fas fa-sliders-h"></i> <span>System Settings</span>
                </a>

                <div style="margin-top:20px; border-top:1px solid rgba(255,255,255,0.06); padding-top:10px;">
                    <a class="nav-item" style="color:var(--danger);" onclick="AuthManager.logout()">
                        <i class="fas fa-sign-out-alt"></i> <span>Logout</span>
                    </a>
                </div>
            </div>
        </aside>

        <!-- Main Workspace Container -->
        <main class="main-content">
            <!-- Top Navigation Bar -->
            <header class="topbar">
                <div class="topbar-search" id="globalSearchContainer">
                    <i class="fas fa-search" style="color: var(--text-muted);"></i>
                    <input type="text" id="globalSearchInput" placeholder="Search student, LRN, incident #..." autocomplete="off">
                    <div id="globalSearchResults" class="global-search-dropdown" style="display: none;"></div>
                </div>

                <div class="topbar-right-controls">
                    <button class="theme-toggle-btn" id="themeToggleBtn" onclick="ThemeManager.toggleTheme()" title="Toggle Dark/Light Theme">
                        <i class="fas fa-moon" id="themeToggleIcon"></i>
                    </button>

                    <div class="user-profile">
                        <div class="user-info" style="text-align: right;">
                            <h4 id="topbarUserName">System Administrator</h4>
                            <p id="topbarUserRole">Administrator</p>
                        </div>
                        <div class="user-avatar" id="topbarUserAvatar">SA</div>
                    </div>
                </div>
            </header>

            <!-- Dynamic Module Host Container -->
            <div class="page-container" id="moduleContainer">
                <!-- Rendered by SPA Router -->
            </div>
        </main>

    </div>

    <!-- System Libraries & Scripts -->
    <script src="../assets/javascript/api.js"></script>
    <script src="../assets/javascript/auth.js"></script>
    <script src="../assets/javascript/router.js"></script>
    <script src="../assets/javascript/global-search.js"></script>

    <!-- Module Implementation Scripts -->
    <script src="../assets/javascript/modules/dashboard.js"></script>
    <script src="../assets/javascript/modules/infractions.js"></script>
    <script src="../assets/javascript/modules/behavior.js"></script>
    <script src="../assets/javascript/modules/violations.js"></script>
    <script src="../assets/javascript/modules/sanctions.js"></script>
    <script src="../assets/javascript/modules/notifications.js"></script>
    <script src="../assets/javascript/modules/hearings.js"></script>
    <script src="../assets/javascript/modules/clearance.js"></script>
    <script src="../assets/javascript/modules/incident-reports.js"></script>
    <script src="../assets/javascript/modules/points.js"></script>
    <script src="../assets/javascript/modules/reformation.js"></script>
    <script src="../assets/javascript/modules/analytics.js"></script>
    <script src="../assets/javascript/modules/users.js"></script>
    <script src="../assets/javascript/modules/settings.js"></script>
    <script src="../assets/javascript/modules/audit.js"></script>

    <script src="../assets/javascript/app.js"></script>
</body>

</html>
