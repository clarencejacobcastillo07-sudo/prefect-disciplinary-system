window.renderBehaviorModule = async function(container) {
  let students = [];
  try {
    const res = await ApiClient.get('students');
    students = res.data || [];
  } catch (e) {
    students = [
      { id: 1, first_name: 'Juan', last_name: 'Dela Cruz', lrn: '136123450001', grade_level: 'Grade 10', section: 'St. Thomas', conduct_points: 85, status: 'Under Warning', clearance_status: 'Hold' },
      { id: 2, first_name: 'Maria Clara', last_name: 'Gonzales', lrn: '136123450002', grade_level: 'Grade 11', section: 'St. Bernadette', conduct_points: 95, status: 'Good Standing', clearance_status: 'Cleared' },
      { id: 3, first_name: 'Mark Anthony', last_name: 'Bautista', lrn: '136123450003', grade_level: 'Grade 9', section: 'St. Lorenzo', conduct_points: 70, status: 'Probation', clearance_status: 'Hold' },
      { id: 4, first_name: 'Sophia', last_name: 'Mendoza', lrn: '136123450004', grade_level: 'Grade 12', section: 'St. Catherine', conduct_points: 100, status: 'Good Standing', clearance_status: 'Cleared' },
      { id: 5, first_name: 'Christian', last_name: 'Navarro', lrn: '136123450005', grade_level: 'Grade 8', section: 'St. Francis', conduct_points: 60, status: 'Suspended', clearance_status: 'Hold' }
    ];
  }

  container.innerHTML = `
    <div style="margin-bottom: 25px;">
      <h2><i class="fas fa-heartbeat" style="color: var(--primary);"></i> Behavior Monitoring & Risk Tracking</h2>
      <p style="color: var(--text-muted); font-size: 0.88rem;">Monitor real-time conduct point scores, risk tiers, and behavior intervention needs.</p>
    </div>

    <div class="card-grid">
      ${students.map(s => {
        let riskColor = s.conduct_points >= 90 ? 'var(--success)' : (s.conduct_points >= 75 ? 'var(--warning)' : 'var(--danger)');
        let riskLabel = s.conduct_points >= 90 ? 'Low Risk' : (s.conduct_points >= 75 ? 'Moderate Risk' : 'High Risk');

        return `
          <div class="card card-dark" style="border-top: 4px solid ${riskColor};">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 12px;">
              <span class="badge" style="background: ${riskColor}; color:#fff;">${riskLabel}</span>
              <strong style="font-size: 1.3rem; color: ${riskColor};">${s.conduct_points} pts</strong>
            </div>
            <h3 style="font-size: 1.1rem; font-weight:700;">${s.first_name} ${s.last_name}</h3>
            <p style="font-size: 0.8rem; color: rgba(255,255,255,0.6); margin-bottom:12px;">${s.grade_level} - ${s.section} • LRN: ${s.lrn}</p>

            <div style="background: rgba(255,255,255,0.05); padding:10px 14px; border-radius: var(--radius-sm); font-size:0.82rem; margin-bottom: 15px;">
              <div>Status: <strong>${s.status}</strong></div>
              <div>Clearance: <span class="badge ${s.clearance_status === 'Cleared' ? 'badge-success' : 'badge-danger'}">${s.clearance_status}</span></div>
            </div>

            <button class="btn btn-primary btn-sm" style="width:100%; justify-content:center;" onclick="Router.navigate('points')">
              <i class="fas fa-list-ol"></i> View Points History
            </button>
          </div>
        `;
      }).join('')}
    </div>
  `;
};
