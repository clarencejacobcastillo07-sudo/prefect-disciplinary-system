/**
 * Single-Page Application Router
 * Switches between all 15 System Modules dynamically.
 */

class Router {
  static init() {
    window.addEventListener('hashchange', () => this.handleRoute());
    this.handleRoute();
  }

  static navigate(moduleKey) {
    window.location.hash = `#${moduleKey}`;
  }

  static handleRoute() {
    const hash = window.location.hash.replace('#', '') || 'dashboard';
    const container = document.getElementById('moduleContainer');
    if (!container) return;

    // Highlight sidebar active item
    document.querySelectorAll('.nav-item').forEach(el => {
      if (el.getAttribute('data-module') === hash) {
        el.classList.add('active');
      } else {
        el.classList.remove('active');
      }
    });

    if (typeof AuthManager !== 'undefined' && !AuthManager.canAccessModule(hash)) {
      container.innerHTML = `
        <div class="card card-dark" style="padding:40px; text-align:center; max-width:600px; margin:40px auto;">
          <div style="width:60px; height:60px; border-radius:50%; background:rgba(239,68,68,0.15); color:var(--danger); display:flex; align-items:center; justify-content:center; margin:0 auto 16px auto; font-size:1.5rem;">
            <i class="fas fa-lock"></i>
          </div>
          <h3 style="color:var(--text-light); margin-bottom:8px; font-size:1.2rem;">Access Denied (HTTP 403)</h3>
          <p style="color:var(--text-muted); font-size:0.88rem; margin-bottom:20px;">
            Your assigned role does not have permission to view or access this module.
          </p>
          <button class="btn btn-primary" onclick="Router.navigate('dashboard')">
            <i class="fas fa-arrow-left"></i> Return to Dashboard
          </button>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div style="display:flex; justify-content:center; align-items:center; height:300px; color:var(--accent);">
        <i class="fas fa-circle-notch fa-spin fa-2x"></i>
      </div>
    `;

    setTimeout(() => {
      switch (hash) {
        case 'dashboard':
          if (window.renderDashboardModule) window.renderDashboardModule(container);
          break;

        case 'students':
          if (window.renderStudentsModule) window.renderStudentsModule(container);
          break;
        case 'infractions':
          if (window.renderInfractionsModule) window.renderInfractionsModule(container);
          break;
        case 'behavior':
          if (window.renderBehaviorModule) window.renderBehaviorModule(container);
          break;
        case 'violations':
          if (window.renderViolationsModule) window.renderViolationsModule(container);
          break;
        case 'sanctions':
          if (window.renderSanctionsModule) window.renderSanctionsModule(container);
          break;
        case 'notifications':
          if (window.renderNotificationsModule) window.renderNotificationsModule(container);
          break;
        case 'hearings':
          if (window.renderHearingsModule) window.renderHearingsModule(container);
          break;
        case 'clearance':
          if (window.renderClearanceModule) window.renderClearanceModule(container);
          break;
        case 'incident-reports':
          if (window.renderIncidentReportsModule) window.renderIncidentReportsModule(container);
          break;
        case 'points':
          if (window.renderPointsModule) window.renderPointsModule(container);
          break;
        case 'reformation':
          if (window.renderReformationModule) window.renderReformationModule(container);
          break;
        case 'analytics':
          if (window.renderAnalyticsModule) window.renderAnalyticsModule(container);
          break;
        case 'users':
          if (window.renderUsersModule) window.renderUsersModule(container);
          break;
        case 'settings':
          if (window.renderSettingsModule) window.renderSettingsModule(container);
          break;
        case 'audit':
          if (window.renderAuditModule) window.renderAuditModule(container);
          break;
        default:
          if (window.renderDashboardModule) window.renderDashboardModule(container);
      }
    }, 150);
  }
}

window.Router = Router;
