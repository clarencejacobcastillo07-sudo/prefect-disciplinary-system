window.renderAnalyticsModule = async function(container) {
  container.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 25px;">
      <div>
        <h2><i class="fas fa-chart-line" style="color: var(--primary);"></i> Reports & Disciplinary Analytics</h2>
        <p style="font-size:0.85rem; color:var(--text-muted);">Generate comprehensive statistical summaries, trend analyses, PDF reports, and Excel data exports.</p>
      </div>
      <div style="display:flex; gap:10px;">
        <button class="btn btn-secondary" onclick="exportExcelDemo()"><i class="fas fa-file-excel" style="color:#10B981;"></i> Export Excel</button>
        <button class="btn btn-primary" onclick="window.print()"><i class="fas fa-file-pdf"></i> Export PDF Summary</button>
      </div>
    </div>

    <!-- Filter Bar -->
    <div class="card card-dark" style="margin-bottom: 25px; padding: 20px;">
      <form style="display:flex; gap:15px; flex-wrap:wrap; align-items:flex-end;">
        <div style="flex:1; min-width:180px;">
          <label style="font-size:0.75rem; color:var(--accent); font-weight:700; display:block; margin-bottom:5px;">START DATE</label>
          <input type="date" value="2026-07-01" style="width:100%; padding:8px 12px; border-radius:6px; border:1px solid rgba(255,255,255,0.1); background:#1B1B1F; color:#fff;" />
        </div>
        <div style="flex:1; min-width:180px;">
          <label style="font-size:0.75rem; color:var(--accent); font-weight:700; display:block; margin-bottom:5px;">END DATE</label>
          <input type="date" value="2026-08-02" style="width:100%; padding:8px 12px; border-radius:6px; border:1px solid rgba(255,255,255,0.1); background:#1B1B1F; color:#fff;" />
        </div>
        <div style="flex:1; min-width:180px;">
          <label style="font-size:0.75rem; color:var(--accent); font-weight:700; display:block; margin-bottom:5px;">OFFENSE CATEGORY</label>
          <select style="width:100%; padding:8px 12px; border-radius:6px; border:1px solid rgba(255,255,255,0.1); background:#1B1B1F; color:#fff;">
            <option value="">All Categories</option>
            <option value="Minor">Minor Offenses</option>
            <option value="Major">Major Offenses</option>
            <option value="Severe">Severe Offenses</option>
          </select>
        </div>
        <button type="button" class="btn btn-primary" style="height:38px;"><i class="fas fa-filter"></i> Apply Filter</button>
      </form>
    </div>

    <!-- Visual Charts Grid -->
    <div style="display:grid; grid-template-columns: 2fr 1fr; gap:20px; margin-bottom:25px;">
      <div class="card card-dark">
        <h3 style="font-size:1rem; font-weight:700; margin-bottom:15px;"><i class="fas fa-chart-bar" style="color:var(--accent);"></i> Monthly Incident Trend (2026)</h3>
        <div style="height:250px; display:flex; align-items:flex-end; gap:20px; padding:20px 10px 0 10px; border-bottom:2px solid rgba(255,255,255,0.1);">
          <div style="flex:1; text-align:center;">
            <div style="background:var(--primary); height:40%; border-radius:6px 6px 0 0;"></div>
            <span style="font-size:0.75rem; margin-top:8px; display:block; color:var(--text-muted);">May</span>
          </div>
          <div style="flex:1; text-align:center;">
            <div style="background:var(--primary); height:60%; border-radius:6px 6px 0 0;"></div>
            <span style="font-size:0.75rem; margin-top:8px; display:block; color:var(--text-muted);">Jun</span>
          </div>
          <div style="flex:1; text-align:center;">
            <div style="background:linear-gradient(to top, var(--primary), var(--accent)); height:90%; border-radius:6px 6px 0 0;"></div>
            <span style="font-size:0.75rem; margin-top:8px; display:block; color:var(--accent); font-weight:700;">Jul</span>
          </div>
          <div style="flex:1; text-align:center;">
            <div style="background:var(--primary); height:30%; border-radius:6px 6px 0 0;"></div>
            <span style="font-size:0.75rem; margin-top:8px; display:block; color:var(--text-muted);">Aug</span>
          </div>
        </div>
      </div>

      <div class="card card-dark">
        <h3 style="font-size:1rem; font-weight:700; margin-bottom:15px;"><i class="fas fa-chart-pie" style="color:var(--accent);"></i> Category Breakdown</h3>
        <div style="display:flex; flex-direction:column; gap:15px; margin-top:20px;">
          <div>
            <div style="display:flex; justify-content:space-between; font-size:0.82rem; margin-bottom:5px;">
              <span>Minor Offenses</span>
              <strong>45%</strong>
            </div>
            <div style="background:rgba(255,255,255,0.1); height:8px; border-radius:4px;"><div style="width:45%; background:var(--accent); height:100%; border-radius:4px;"></div></div>
          </div>
          <div>
            <div style="display:flex; justify-content:space-between; font-size:0.82rem; margin-bottom:5px;">
              <span>Major Offenses</span>
              <strong>35%</strong>
            </div>
            <div style="background:rgba(255,255,255,0.1); height:8px; border-radius:4px;"><div style="width:35%; background:var(--warning); height:100%; border-radius:4px;"></div></div>
          </div>
          <div>
            <div style="display:flex; justify-content:space-between; font-size:0.82rem; margin-bottom:5px;">
              <span>Severe Offenses</span>
              <strong>20%</strong>
            </div>
            <div style="background:rgba(255,255,255,0.1); height:8px; border-radius:4px;"><div style="width:20%; background:var(--danger); height:100%; border-radius:4px;"></div></div>
          </div>
        </div>
      </div>
    </div>
  `;

  window.exportExcelDemo = () => {
    alert('Exporting St. Agnes Academy Disciplinary Summary to Excel (.csv)...');
    const csvContent = "data:text/csv;charset=utf-8,Incident_ID,Student,LRN,Violation,Category,Status,Date\nINC-2026-0001,Juan Dela Cruz,136123450001,Cutting Classes,Major,Sanctioned,2026-07-20\nINC-2026-0002,Mark Anthony Bautista,136123450003,Bullying,Major,Hearing Scheduled,2026-07-22";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "St_Agnes_Disciplinary_Report_2026.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
};
