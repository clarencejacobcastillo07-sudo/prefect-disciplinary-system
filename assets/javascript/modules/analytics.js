/**
 * Reports & Analytics Module
 * Prefect Disciplinary Action System — St. Agnes Academy
 */

window.renderAnalyticsModule = async function (container) {
  let metrics = {
    total_students: 0,
    total_incidents: 0,
    category_breakdown: [],
    monthly_trends: []
  };
  let incidents = [];

  try {
    const [dashRes, incRes] = await Promise.all([
      ApiClient.get('reports', 'dashboard'),
      ApiClient.get('incidents')
    ]);
    if (dashRes && dashRes.data) metrics = dashRes.data;
    incidents = incRes.data || [];
  } catch (e) {
    console.error('Error fetching analytics:', e);
  }

  const minorCount = incidents.filter(i => i.violation_category === 'Minor').length;
  const majorCount = incidents.filter(i => i.violation_category === 'Major').length;
  const severeCount = incidents.filter(i => i.violation_category === 'Severe').length;
  const total = incidents.length || 1;

  const minorPct = Math.round((minorCount / total) * 100);
  const majorPct = Math.round((majorCount / total) * 100);
  const severePct = Math.round((severeCount / total) * 100);

  container.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 25px; flex-wrap:wrap; gap:12px;">
      <div>
        <h2 style="font-size:1.6rem; font-weight:800; color:var(--text-light); margin-bottom:4px;">
          <i class="fas fa-chart-line" style="color: var(--primary); margin-right:8px;"></i>Reports &amp; Disciplinary Analytics
        </h2>
        <p style="font-size:0.85rem; color:var(--text-muted);">Statistical summaries, category breakdowns, PDF summaries, and real-time CSV data exports.</p>
      </div>
      <div style="display:flex; gap:10px;">
        <button class="btn btn-secondary" onclick="exportRealCsvData()"><i class="fas fa-file-excel" style="color:#10B981;"></i> Export CSV Data</button>
        <button class="btn btn-primary" onclick="window.print()"><i class="fas fa-file-pdf"></i> Print / PDF Summary</button>
      </div>
    </div>

    <!-- Visual Charts Grid -->
    <div style="display:grid; grid-template-columns: 2fr 1fr; gap:20px; margin-bottom:25px;">
      <div class="card card-dark">
        <h3 style="font-size:1rem; font-weight:700; margin-bottom:15px;"><i class="fas fa-chart-bar" style="color:var(--accent);"></i> Incidents Summary (Year-to-Date)</h3>
        <div style="padding:20px 10px; display:flex; justify-content:space-around; text-align:center;">
          <div>
            <div style="font-size:1.8rem; font-weight:800; color:var(--text-light);">${metrics.total_students || 0}</div>
            <div style="font-size:0.75rem; color:var(--text-muted); text-transform:uppercase;">Total Students</div>
          </div>
          <div>
            <div style="font-size:1.8rem; font-weight:800; color:var(--accent);">${metrics.total_incidents || 0}</div>
            <div style="font-size:0.75rem; color:var(--text-muted); text-transform:uppercase;">Total Incidents</div>
          </div>
          <div>
            <div style="font-size:1.8rem; font-weight:800; color:var(--warning);">${metrics.pending_hearings || 0}</div>
            <div style="font-size:0.75rem; color:var(--text-muted); text-transform:uppercase;">Hearings</div>
          </div>
          <div>
            <div style="font-size:1.8rem; font-weight:800; color:var(--danger);">${metrics.active_holds || 0}</div>
            <div style="font-size:0.75rem; color:var(--text-muted); text-transform:uppercase;">Clearance Holds</div>
          </div>
        </div>
      </div>

      <div class="card card-dark">
        <h3 style="font-size:1rem; font-weight:700; margin-bottom:15px;"><i class="fas fa-chart-pie" style="color:var(--accent);"></i> Category Breakdown</h3>
        <div style="display:flex; flex-direction:column; gap:15px; margin-top:10px;">
          <div>
            <div style="display:flex; justify-content:space-between; font-size:0.82rem; margin-bottom:5px;">
              <span>Minor Offenses (${minorCount})</span>
              <strong>${minorPct}%</strong>
            </div>
            <div style="background:rgba(255,255,255,0.1); height:8px; border-radius:4px;"><div style="width:${minorPct}%; background:var(--accent); height:100%; border-radius:4px;"></div></div>
          </div>
          <div>
            <div style="display:flex; justify-content:space-between; font-size:0.82rem; margin-bottom:5px;">
              <span>Major Offenses (${majorCount})</span>
              <strong>${majorPct}%</strong>
            </div>
            <div style="background:rgba(255,255,255,0.1); height:8px; border-radius:4px;"><div style="width:${majorPct}%; background:var(--warning); height:100%; border-radius:4px;"></div></div>
          </div>
          <div>
            <div style="display:flex; justify-content:space-between; font-size:0.82rem; margin-bottom:5px;">
              <span>Severe Offenses (${severeCount})</span>
              <strong>${severePct}%</strong>
            </div>
            <div style="background:rgba(255,255,255,0.1); height:8px; border-radius:4px;"><div style="width:${severePct}%; background:var(--danger); height:100%; border-radius:4px;"></div></div>
          </div>
        </div>
      </div>
    </div>
  `;

  window.exportRealCsvData = async () => {
    try {
      const res = await ApiClient.get('incidents');
      const data = res.data || [];
      if (data.length === 0) {
        alert('No incident data currently available to export.');
        return;
      }

      let csv = "Incident_No,Student_Name,LRN,Grade_Section,Violation,Category,Demerit_Points,Location,Date,Status\n";
      data.forEach(i => {
        csv += `"${i.incident_number}","${i.first_name} ${i.last_name}","${i.lrn}","${i.grade_level} - ${i.section}","${i.violation_title}","${i.violation_category}",${i.demerit_points || 0},"${i.location}","${i.incident_date}","${i.status}"\n`;
      });

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `St_Agnes_Disciplinary_Report_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      alert('Error exporting CSV: ' + err.message);
    }
  };
};
