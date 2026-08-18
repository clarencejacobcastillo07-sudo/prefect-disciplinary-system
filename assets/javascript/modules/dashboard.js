/**
 * Main Executive Dashboard Module
 * Prefect Disciplinary Action System — St. Agnes Academy
 */

window.renderDashboardModule = async function (container) {
  const user = typeof AuthManager !== 'undefined' && AuthManager.getCurrentUser
    ? AuthManager.getCurrentUser()
    : { full_name: 'Administrator', role_name: 'System Administrator' };

  let data = {
    total_students: 0,
    total_incidents: 0,
    active_holds: 0,
    pending_hearings: 0,
    active_reformations: 0,
    at_risk_students: 0,
    recent_incidents: []
  };

  try {
    const res = await ApiClient.get('reports', 'dashboard');
    if (res && res.data) data = res.data;
  } catch (e) {
    console.error("Error fetching dashboard metrics:", e);
  }

  container.innerHTML = `
    <div class="hero-banner">
      <div class="hero-content">
        <h1>Welcome Back, ${user.full_name}! 👋</h1>
        <p>St. Agnes Academy of Caloocan Inc. • Prefect Disciplinary Action System</p>
      </div>
      <div class="hero-logo-box">
        <img src="../assets/images/img_logo.png" alt="St. Agnes Crest">
      </div>
    </div>

    <!-- Metric Cards -->
    <div class="card-grid">
      <div class="card metric-card" onclick="Router.navigate('students')" style="cursor:pointer;" title="View Student Records">
        <div class="metric-info">
          <h3>${data.total_students}</h3>
          <p>Total Students</p>
        </div>
        <div class="metric-icon"><i class="fas fa-user-graduate"></i></div>
      </div>
      <div class="card metric-card" onclick="Router.navigate('infractions')" style="cursor:pointer;" title="View Infractions">
        <div class="metric-info">
          <h3>${data.total_incidents}</h3>
          <p>Incidents Logged</p>
        </div>
        <div class="metric-icon"><i class="fas fa-exclamation-triangle"></i></div>
      </div>
      <div class="card metric-card" onclick="Router.navigate('hearings')" style="cursor:pointer;" title="View Hearings">
        <div class="metric-info">
          <h3 style="color: var(--warning);">${data.pending_hearings}</h3>
          <p>Pending Hearings</p>
        </div>
        <div class="metric-icon" style="background: rgba(245, 158, 11, 0.15); color: var(--warning);"><i class="fas fa-gavel"></i></div>
      </div>
      <div class="card metric-card" onclick="Router.navigate('clearance')" style="cursor:pointer;" title="View Clearance Holds">
        <div class="metric-info">
          <h3 style="color: var(--danger);">${data.active_holds}</h3>
          <p>Clearance Holds</p>
        </div>
        <div class="metric-icon" style="background: rgba(239, 68, 68, 0.15); color: var(--danger);"><i class="fas fa-lock"></i></div>
      </div>
    </div>

    <!-- Recent Incidents Table & Quick Actions -->
    <div class="table-container">
      <div class="table-header">
        <div>
          <h3><i class="fas fa-history" style="color: var(--accent);"></i> Recent Incident Reports</h3>
          <p style="font-size: 0.8rem; color: var(--text-muted); margin-top:2px;">Latest disciplinary cases logged by prefect officers.</p>
        </div>
        <button class="btn btn-primary btn-sm" onclick="Router.navigate('infractions')">
          <i class="fas fa-plus"></i> Log New Infraction
        </button>
      </div>
      <table>
        <thead>
          <tr>
            <th>Incident No.</th>
            <th>Student Name</th>
            <th>Violation</th>
            <th>Category</th>
            <th>Date Recorded</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          ${(!data.recent_incidents || data.recent_incidents.length === 0) ? `
            <tr>
              <td colspan="7" style="text-align:center; color:var(--text-muted); padding:30px;">
                <i class="fas fa-clipboard-check fa-2x" style="opacity:0.4; margin-bottom:8px; display:block;"></i>
                No incidents recorded yet. Clean starting state.
              </td>
            </tr>
          ` : data.recent_incidents.map(inc => `
            <tr>
              <td><code><strong>${inc.incident_number}</strong></code></td>
              <td><strong>${inc.first_name} ${inc.last_name}</strong></td>
              <td>${inc.violation_title}</td>
              <td><span class="badge ${inc.category === 'Severe' ? 'badge-danger' : (inc.category === 'Major' ? 'badge-warning' : 'badge-primary')}">${inc.category}</span></td>
              <td>${inc.incident_date}</td>
              <td><span class="badge badge-success">${inc.status}</span></td>
              <td>
                <button class="btn btn-secondary btn-sm" onclick="Router.navigate('incident-reports')">View Report</button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
};
