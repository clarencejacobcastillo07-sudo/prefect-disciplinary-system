window.renderDashboardModule = async function(container) {
  const user = AuthManager.getCurrentUser();
  
  let data = {
    total_students: 1250,
    total_incidents: 42,
    active_holds: 5,
    pending_hearings: 3,
    active_reformations: 8,
    at_risk_students: 4,
    recent_incidents: [
      { incident_number: 'INC-2026-0001', first_name: 'Juan', last_name: 'Dela Cruz', violation_title: 'Cutting Classes / Truancy', category: 'Major', incident_date: '2026-07-20 10:15:00', status: 'Sanctioned' },
      { incident_number: 'INC-2026-0002', first_name: 'Mark Anthony', last_name: 'Bautista', violation_title: 'Bullying / Harassment', category: 'Major', incident_date: '2026-07-22 13:30:00', status: 'Hearing Scheduled' },
      { incident_number: 'INC-2026-0003', first_name: 'Christian', last_name: 'Navarro', violation_title: 'Brawling / Physical Assault', category: 'Severe', incident_date: '2026-07-25 15:45:00', status: 'Under Investigation' }
    ]
  };

  try {
    const res = await ApiClient.get('reports', 'dashboard');
    if (res.data) data = res.data;
  } catch (e) {
    console.log("Using cached dashboard dataset.");
  }

  container.innerHTML = `
    <div class="hero-banner">
      <div class="hero-content">
        <h1>Welcome Back, ${user.full_name}! 👋</h1>
        <p>St. Agnes Academy of Caloocan Inc. • Prefect Disciplinary Action</p>
      </div>
      <div class="hero-logo-box">
        <img src="../assets/images/img_logo.png" alt="St. Agnes Crest">
      </div>
    </div>

    <!-- Metric Cards -->
    <div class="card-grid">
      <div class="card metric-card">
        <div class="metric-info">
          <h3>${data.total_students}</h3>
          <p>Total High Schoolers</p>
        </div>
        <div class="metric-icon"><i class="fas fa-user-graduate"></i></div>
      </div>
      <div class="card metric-card">
        <div class="metric-info">
          <h3>${data.total_incidents}</h3>
          <p>Incidents Logged</p>
        </div>
        <div class="metric-icon"><i class="fas fa-exclamation-triangle"></i></div>
      </div>
      <div class="card metric-card">
        <div class="metric-info">
          <h3 style="color: var(--warning);">${data.pending_hearings}</h3>
          <p>Pending Hearings</p>
        </div>
        <div class="metric-icon" style="background: rgba(245, 158, 11, 0.15); color: var(--warning);"><i class="fas fa-gavel"></i></div>
      </div>
      <div class="card metric-card">
        <div class="metric-info">
          <h3 style="color: var(--danger);">${data.active_holds}</h3>
          <p>Clearance Holds</p>
        </div>
        <div class="metric-icon" style="background: rgba(239, 68, 68, 0.15); color: var(--danger);"><i class="fas fa-lock"></i></div>
      </div>
    </div>

    <!-- Recent Incidents Table & Analytics Summary -->
    <div class="table-container">
      <div class="table-header">
        <h3><i class="fas fa-history" style="color: var(--accent);"></i> Recent Incident Reports</h3>
        <button class="btn btn-primary btn-sm" onclick="Router.navigate('infractions'); setTimeout(() => { if (window.openLogIncidentModal) window.openLogIncidentModal(); }, 250);">
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
          ${data.recent_incidents.map(inc => `
            <tr>
              <td><strong>${inc.incident_number}</strong></td>
              <td>${inc.first_name} ${inc.last_name}</td>
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
