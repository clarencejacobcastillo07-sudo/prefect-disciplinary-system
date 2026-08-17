window.renderIncidentReportsModule = async function(container) {
  let incidents = [];
  try {
    const res = await ApiClient.get('incidents');
    incidents = res.data || [];
  } catch (e) {
    incidents = [
      { id: 1, incident_number: 'INC-2026-0001', first_name: 'Juan', last_name: 'Dela Cruz', lrn: '136123450001', grade_level: 'Grade 10', section: 'St. Thomas', violation_title: 'Cutting Classes / Truancy', violation_category: 'Major', demerit_points: 15, location: 'High School Building Floor 2', incident_date: '2026-07-20 10:15:00', description: 'Student was seen scaling the back fence to skip 3rd period Mathematics class.', reported_by_name: 'Mr. Ricardo Santos', status: 'Sanctioned' }
    ];
  }

  const sampleInc = incidents[0] || {};

  container.innerHTML = `
    <div style="margin-bottom: 20px; display:flex; justify-content:space-between; align-items:center;">
      <h2><i class="fas fa-file-pdf" style="color: var(--primary);"></i> Incident Report Generation</h2>
      <button class="btn btn-primary" onclick="window.print()">
        <i class="fas fa-print"></i> Print Official Incident Document
      </button>
    </div>

    <!-- Official Printable Incident Document Card -->
    <div style="background: #FFFFFF; color: #1A202C; padding: 40px; border-radius: var(--radius-md); box-shadow: var(--shadow-md); border: 2px solid #E2E8F0; max-width: 850px; margin: 0 auto;">
      
      <!-- Document Header with Official St. Agnes Crest -->
      <div style="display:flex; align-items:center; justify-content:space-between; border-bottom: 3px double #E91E63; padding-bottom: 20px; margin-bottom: 25px;">
        <img src="../assets/images/img_logo.png" style="width: 85px; height: 85px; object-fit: contain;" alt="St. Agnes Crest">
        <div style="text-align:center; flex:1;">
          <h2 style="font-size: 1.4rem; font-weight:800; color:#E91E63; text-transform:uppercase; letter-spacing:1px;">St. Agnes Academy of Caloocan Inc.</h2>
          <p style="font-size: 0.85rem; font-weight:600; color:#4A5568;">OFFICE OF THE SCHOOL PREFECT OF DISCIPLINE</p>
          <p style="font-size: 0.78rem; color:#718096;">Caloocan City, Metro Manila • Founded 2011</p>
        </div>
        <div style="text-align:right;">
          <span style="font-size: 0.75rem; font-weight:700; background:#FCE7F3; color:#9D174D; padding:4px 10px; border-radius:4px;">OFFICIAL FORM</span>
        </div>
      </div>

      <div style="text-align:center; margin-bottom: 25px;">
        <h3 style="font-size: 1.3rem; font-weight:800; text-transform:uppercase; letter-spacing:1px; color:#2D3748;">INCIDENT REPORT & PROCEEDINGS FORM</h3>
        <p style="font-size: 0.85rem; color:#E91E63; font-weight:700;">Document Ref: ${sampleInc.incident_number || 'INC-2026-0001'}</p>
      </div>

      <table style="width:100%; border:1px solid #CBD5E0; margin-bottom:20px;">
        <tr style="background:#F7FAFC;">
          <td style="padding:10px; font-weight:700; width:20%;">Student Name:</td>
          <td style="padding:10px;">${sampleInc.first_name || 'Juan'} ${sampleInc.last_name || 'Dela Cruz'}</td>
          <td style="padding:10px; font-weight:700; width:20%;">LRN:</td>
          <td style="padding:10px;"><code>${sampleInc.lrn || '136123450001'}</code></td>
        </tr>
        <tr>
          <td style="padding:10px; font-weight:700;">Grade & Section:</td>
          <td style="padding:10px;">${sampleInc.grade_level || 'Grade 10'} - ${sampleInc.section || 'St. Thomas'}</td>
          <td style="padding:10px; font-weight:700;">Incident Date:</td>
          <td style="padding:10px;">${sampleInc.incident_date || '2026-07-20 10:15:00'}</td>
        </tr>
        <tr style="background:#F7FAFC;">
          <td style="padding:10px; font-weight:700;">Offense Title:</td>
          <td style="padding:10px;">${sampleInc.violation_title || 'Cutting Classes / Truancy'}</td>
          <td style="padding:10px; font-weight:700;">Severity Level:</td>
          <td style="padding:10px;"><strong style="color:#E91E63;">${sampleInc.violation_category || 'Major'} (-${sampleInc.demerit_points || 15} pts)</strong></td>
        </tr>
        <tr>
          <td style="padding:10px; font-weight:700;">Incident Location:</td>
          <td style="padding:10px;" colspan="3">${sampleInc.location || 'High School Building Floor 2'}</td>
        </tr>
      </table>

      <div style="margin-bottom:20px; border:1px solid #CBD5E0; padding:15px; border-radius:6px; background:#FAFAFA;">
        <h4 style="font-size:0.9rem; font-weight:700; margin-bottom:8px; color:#2D3748;">Incident Description & Findings:</h4>
        <p style="font-size:0.88rem; line-height:1.6; color:#4A5568;">
          ${sampleInc.description || 'Student was seen scaling the back fence to skip 3rd period Mathematics class.'}
        </p>
      </div>

      <!-- Signatures Block -->
      <div style="display:flex; justify-content:space-between; margin-top:50px; padding-top:20px;">
        <div style="text-align:center; width:220px;">
          <div style="border-bottom:1px solid #333; margin-bottom:5px; height:40px;"></div>
          <p style="font-size:0.8rem; font-weight:700;">Mr. Ricardo Santos</p>
          <p style="font-size:0.75rem; color:#718096;">Prefect of Discipline</p>
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
  `;
};
