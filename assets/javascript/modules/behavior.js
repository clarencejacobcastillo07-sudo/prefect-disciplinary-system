/**
 * Behavior Monitoring & Risk Tracking Module
 * Prefect Disciplinary Action System — St. Agnes Academy
 */

window.renderBehaviorModule = async function(container) {
  let students = [];
  try {
    const res = await ApiClient.get('students', 'list');
    students = res.data || [];
  } catch (e) {
    console.error('Error loading students for behavior monitoring:', e);
    students = [];
  }

  container.innerHTML = `
    <div style="margin-bottom: 25px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
      <div>
        <h2 style="font-size:1.6rem; font-weight:800; color:var(--text-light); margin-bottom:4px;">
          <i class="fas fa-heartbeat" style="color: var(--primary); margin-right:8px;"></i>Behavior Monitoring & Risk Tracking
        </h2>
        <p style="color: var(--text-muted); font-size: 0.88rem;">Monitor real-time conduct point scores, risk tiers, and behavior intervention needs.</p>
      </div>
      <button class="btn btn-secondary" onclick="Router.navigate('points')">
        <i class="fas fa-star"></i> Behavior Points Ledger
      </button>
    </div>

    ${students.length === 0 ? `
      <div class="card card-dark" style="text-align:center; padding:45px;">
        <i class="fas fa-users-slash fa-2x" style="opacity:0.4; margin-bottom:12px; display:block;"></i>
        <h3 style="font-size:1.1rem; color:var(--text-light); margin-bottom:6px;">No Students Available</h3>
        <p style="color:var(--text-muted); font-size:0.85rem; margin-bottom:16px;">Create test student records to begin tracking behavior and conduct standings.</p>
        <button class="btn btn-primary" onclick="Router.navigate('students')">
          <i class="fas fa-user-plus"></i> Go to Student Records
        </button>
      </div>
    ` : `
      <div class="card-grid">
        ${students.map(s => {
          const pts = s.conduct_points !== undefined ? s.conduct_points : 100;
          const riskColor = pts >= 90 ? 'var(--success)' : (pts >= 75 ? 'var(--warning)' : 'var(--danger)');
          const riskLabel = pts >= 90 ? 'Low Risk (Good)' : (pts >= 75 ? 'Moderate Risk' : 'High Risk / Critical');

          return `
            <div class="card card-dark" style="border-top: 4px solid ${riskColor};">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 12px;">
                <span class="badge" style="background: ${riskColor}; color:#fff; font-size:0.75rem;">${riskLabel}</span>
                <strong style="font-size: 1.3rem; color: ${riskColor};">${pts} pts</strong>
              </div>
              <h3 style="font-size: 1.1rem; font-weight:700;">${s.first_name} ${s.last_name}</h3>
              <p style="font-size: 0.8rem; color: var(--text-muted); margin-bottom:12px;">${s.grade_level} - ${s.section} • LRN: <code>${s.lrn}</code></p>

              <div style="background: rgba(255,255,255,0.04); padding:10px 14px; border-radius: var(--radius-sm); font-size:0.82rem; margin-bottom: 15px; border:1px solid var(--border-color);">
                <div style="margin-bottom:4px;">Standing: <strong>${s.status || 'Good Standing'}</strong></div>
                <div>Clearance: <span class="badge ${s.clearance_status === 'Cleared' ? 'badge-success' : 'badge-danger'}">${s.clearance_status || 'Cleared'}</span></div>
                ${s.guardian_name ? `<div style="margin-top:4px; font-size:0.75rem; color:var(--text-muted);">Guardian: ${s.guardian_name} (${s.guardian_phone || 'No phone'})</div>` : ''}
              </div>

              <div style="display:flex; gap:8px;">
                <button class="btn btn-primary btn-sm" style="flex:1; justify-content:center;" onclick="Router.navigate('points')">
                  <i class="fas fa-star"></i> Adjust Points
                </button>
                <button class="btn btn-secondary btn-sm" style="flex:1; justify-content:center;" onclick="Router.navigate('students')">
                  <i class="fas fa-id-badge"></i> Profile
                </button>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `}
  `;
};
