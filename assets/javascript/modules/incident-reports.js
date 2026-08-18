/**
 * Incident Reports Generation & Official Document Printing Module
 * Prefect Disciplinary Action System — St. Agnes Academy
 */

window.renderIncidentReportsModule = async function(container) {
  let incidents = [];
  let selectedIncidentId = null;

  try {
    const res = await ApiClient.get('incidents');
    incidents = res.data || [];
  } catch (e) {
    console.error('Error fetching incident reports:', e);
    incidents = [];
  }

  const activeInc = incidents.find(i => i.id == selectedIncidentId) || (incidents.length > 0 ? incidents[0] : null);

  container.innerHTML = `
    <div style="margin-bottom: 20px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px;">
      <div>
        <h2 style="font-size:1.6rem; font-weight:800; color:var(--text-light); margin-bottom:4px;">
          <i class="fas fa-file-pdf" style="color: var(--primary); margin-right:8px;"></i>Incident Report Generation
        </h2>
        <p style="font-size:0.85rem; color:var(--text-muted);">Generate and print official Prefect Disciplinary Proceeding forms for student records.</p>
      </div>
      <div style="display:flex; gap:10px;">
        ${activeInc ? `
          <button class="btn btn-primary" onclick="window.print()">
            <i class="fas fa-print"></i> Print Official Incident Document
          </button>
        ` : ''}
      </div>
    </div>

    ${incidents.length === 0 ? `
      <div class="card card-dark" style="text-align:center; padding:45px; max-width:850px; margin:0 auto;">
        <i class="fas fa-file-alt fa-2x" style="opacity:0.4; margin-bottom:12px; display:block;"></i>
        <h3 style="font-size:1.1rem; color:var(--text-light); margin-bottom:6px;">No Incident Reports on File</h3>
        <p style="color:var(--text-muted); font-size:0.85rem; margin-bottom:16px;">When infractions are logged for students, official printable document forms will appear here.</p>
        <button class="btn btn-primary" onclick="Router.navigate('infractions')">
          <i class="fas fa-edit"></i> Go to Infraction Logging
        </button>
      </div>
    ` : `
      <!-- Incident Selector Bar -->
      <div style="background:var(--card-bg); border:1px solid var(--border-color); border-radius:var(--radius-md); padding:14px 18px; margin-bottom:20px; display:flex; gap:14px; align-items:center; flex-wrap:wrap; max-width:850px; margin-left:auto; margin-right:auto;">
        <label style="font-weight:700; font-size:0.85rem; color:var(--text-light);"><i class="fas fa-folder-open" style="color:var(--accent); margin-right:6px;"></i>Select Incident Case:</label>
        <select id="incidentDocSelector" style="flex:1; min-width:260px;" onchange="changeActiveIncidentDoc(this.value)">
          ${incidents.map(i => `<option value="${i.id}" ${activeInc && activeInc.id == i.id ? 'selected' : ''}>[${i.incident_number}] ${i.first_name} ${i.last_name} (${i.lrn}) — ${i.violation_title}</option>`).join('')}
        </select>
      </div>

      <!-- Official Printable Incident Document Card -->
      <div style="background: #FFFFFF; color: #1A202C; padding: 40px; border-radius: var(--radius-md); box-shadow: var(--shadow-md); border: 2px solid #E2E8F0; max-width: 850px; margin: 0 auto;">
        
        <!-- Document Header with Official St. Agnes Crest -->
        <div style="display:flex; align-items:center; justify-content:space-between; border-bottom: 3px double #E91E63; padding-bottom: 20px; margin-bottom: 25px;">
          <img src="../assets/images/img_logo.png" style="width: 85px; height: 85px; object-fit: contain;" alt="St. Agnes Crest">
          <div style="text-align:center; flex:1;">
            <h2 style="font-size: 1.4rem; font-weight:800; color:#E91E63; text-transform:uppercase; letter-spacing:1px; margin-bottom:2px;">St. Agnes Academy of Caloocan Inc.</h2>
            <p style="font-size: 0.85rem; font-weight:600; color:#4A5568; margin-bottom:2px;">OFFICE OF THE SCHOOL PREFECT OF DISCIPLINE</p>
            <p style="font-size: 0.78rem; color:#718096;">Caloocan City, Metro Manila • Founded 2011</p>
          </div>
          <div style="text-align:right;">
            <span style="font-size: 0.75rem; font-weight:700; background:#FCE7F3; color:#9D174D; padding:4px 10px; border-radius:4px;">OFFICIAL FORM</span>
          </div>
        </div>

        <div style="text-align:center; margin-bottom: 25px;">
          <h3 style="font-size: 1.3rem; font-weight:800; text-transform:uppercase; letter-spacing:1px; color:#2D3748; margin-bottom:4px;">INCIDENT REPORT &amp; PROCEEDINGS FORM</h3>
          <p style="font-size: 0.88rem; color:#E91E63; font-weight:700;">Document Ref: ${activeInc ? activeInc.incident_number : 'INC-2026-0001'}</p>
        </div>

        <table style="width:100%; border:1px solid #CBD5E0; margin-bottom:20px; font-size:0.88rem; border-collapse:collapse;">
          <tr style="background:#F7FAFC; border-bottom:1px solid #CBD5E0;">
            <td style="padding:10px; font-weight:700; width:20%; border-right:1px solid #CBD5E0;">Student Name:</td>
            <td style="padding:10px; border-right:1px solid #CBD5E0;"><strong>${activeInc ? activeInc.first_name + ' ' + activeInc.last_name : '—'}</strong></td>
            <td style="padding:10px; font-weight:700; width:20%; border-right:1px solid #CBD5E0;">LRN / Student ID:</td>
            <td style="padding:10px;"><code>${activeInc ? activeInc.lrn : '—'}</code></td>
          </tr>
          <tr style="border-bottom:1px solid #CBD5E0;">
            <td style="padding:10px; font-weight:700; border-right:1px solid #CBD5E0;">Grade &amp; Section:</td>
            <td style="padding:10px; border-right:1px solid #CBD5E0;">${activeInc ? (activeInc.grade_level + ' - ' + activeInc.section) : '—'}</td>
            <td style="padding:10px; font-weight:700; border-right:1px solid #CBD5E0;">Incident Date:</td>
            <td style="padding:10px;">${activeInc ? activeInc.incident_date : '—'}</td>
          </tr>
          <tr style="background:#F7FAFC; border-bottom:1px solid #CBD5E0;">
            <td style="padding:10px; font-weight:700; border-right:1px solid #CBD5E0;">Offense Title:</td>
            <td style="padding:10px; border-right:1px solid #CBD5E0;"><strong>${activeInc ? activeInc.violation_title : '—'}</strong></td>
            <td style="padding:10px; font-weight:700; border-right:1px solid #CBD5E0;">Severity Level:</td>
            <td style="padding:10px;"><strong style="color:#E91E63;">${activeInc ? activeInc.violation_category : '—'} (-${activeInc ? activeInc.demerit_points : 0} pts)</strong></td>
          </tr>
          <tr style="border-bottom:1px solid #CBD5E0;">
            <td style="padding:10px; font-weight:700; border-right:1px solid #CBD5E0;">Incident Location:</td>
            <td style="padding:10px; border-right:1px solid #CBD5E0;">${activeInc ? activeInc.location : '—'}</td>
            <td style="padding:10px; font-weight:700; border-right:1px solid #CBD5E0;">Case Status:</td>
            <td style="padding:10px;"><strong>${activeInc ? activeInc.status : 'Pending'}</strong></td>
          </tr>
          ${activeInc && activeInc.witnesses ? `
            <tr>
              <td style="padding:10px; font-weight:700; border-right:1px solid #CBD5E0;">Witnesses:</td>
              <td style="padding:10px;" colspan="3">${activeInc.witnesses}</td>
            </tr>
          ` : ''}
        </table>

        <div style="margin-bottom:20px; border:1px solid #CBD5E0; padding:15px; border-radius:6px; background:#FAFAFA;">
          <h4 style="font-size:0.9rem; font-weight:700; margin-bottom:8px; color:#2D3748;">Incident Description &amp; Findings:</h4>
          <p style="font-size:0.88rem; line-height:1.6; color:#4A5568;">
            ${activeInc ? activeInc.description : 'No narrative available.'}
          </p>
        </div>

        <!-- Signatures Block -->
        <div style="display:flex; justify-content:space-between; margin-top:50px; padding-top:20px;">
          <div style="text-align:center; width:220px;">
            <div style="border-bottom:1px solid #333; margin-bottom:5px; height:40px;"></div>
            <p style="font-size:0.8rem; font-weight:700;">${activeInc && activeInc.reported_by_name ? activeInc.reported_by_name : 'Mr. Ricardo Santos'}</p>
            <p style="font-size:0.75rem; color:#718096;">Reporting Prefect Officer</p>
          </div>
          <div style="text-align:center; width:220px;">
            <div style="border-bottom:1px solid #333; margin-bottom:5px; height:40px;"></div>
            <p style="font-size:0.8rem; font-weight:700;">Ms. Maria Teresa Cruz</p>
            <p style="font-size:0.75rem; color:#718096;">Guidance Counselor</p>
          </div>
          <div style="text-align:center; width:220px;">
            <div style="border-bottom:1px solid #333; margin-bottom:5px; height:40px;"></div>
            <p style="font-size:0.8rem; font-weight:700;">Parent / Guardian Signature</p>
            <p style="font-size:0.75rem; color:#718096;">Date Signed</p>
          </div>
        </div>

      </div>
    `}
  `;

  window.changeActiveIncidentDoc = (id) => {
    selectedIncidentId = id;
    window.renderIncidentReportsModule(container);
  };
};
