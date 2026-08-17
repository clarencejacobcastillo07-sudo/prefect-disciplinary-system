window.renderPointsModule = async function(container) {
  let history = [];
  let students = [];

  try {
    const [ptRes, stRes] = await Promise.all([
      ApiClient.get('proceedings', 'points'),
      ApiClient.get('students')
    ]);
    history  = ptRes.data || [];
    students = stRes.data || [];
  } catch (e) {
    history = [
      { id: 1, first_name: 'Juan',        last_name: 'Dela Cruz', lrn: '136123450001', points_change: -15, point_type: 'Demerit',            reason: 'Deduction for Cutting Classes infraction (INC-2026-0001)',                created_at: '2026-07-20 10:15:00', conduct_points: 85 },
      { id: 2, first_name: 'Mark Anthony', last_name: 'Bautista',  lrn: '136123450003', points_change: -25, point_type: 'Demerit',            reason: 'Deduction for Bullying / Harassment infraction (INC-2026-0002)',          created_at: '2026-07-22 13:30:00', conduct_points: 70 },
      { id: 3, first_name: 'Christian',   last_name: 'Navarro',    lrn: '136123450005', points_change: -40, point_type: 'Demerit',            reason: 'Deduction for Brawling / Physical Assault infraction (INC-2026-0003)',   created_at: '2026-07-25 15:45:00', conduct_points: 60 },
      { id: 4, first_name: 'Maria Clara', last_name: 'Gonzales',   lrn: '136123450002', points_change:  +5, point_type: 'Merit',              reason: 'Commendation for exemplary conduct during High School Foundation Day 2026', created_at: '2026-07-24 09:00:00', conduct_points: 95 },
      { id: 5, first_name: 'Juan',        last_name: 'Dela Cruz', lrn: '136123450001', points_change:  -5, point_type: 'Demerit',            reason: 'Deduction for Improper Uniform infraction (INC-2026-0004)',               created_at: '2026-07-28 07:45:00', conduct_points: 80 },
      { id: 6, first_name: 'Mark Anthony', last_name: 'Bautista',  lrn: '136123450003', points_change:  -5, point_type: 'Demerit',            reason: 'Deduction for Unauthorized Mobile Phone use (INC-2026-0005)',             created_at: '2026-07-30 09:20:00', conduct_points: 65 },
      { id: 7, first_name: 'Sophia',      last_name: 'Mendoza',    lrn: '136123450004', points_change:  +5, point_type: 'Merit',              reason: 'Outstanding academic performance – honor roll recognition Q1 2026',        created_at: '2026-07-15 08:00:00', conduct_points: 100 },
      { id: 8, first_name: 'Maria Clara', last_name: 'Gonzales',   lrn: '136123450002', points_change:  +3, point_type: 'Reformation Reward', reason: 'Completed 3 hours of voluntary campus clean-up program',                   created_at: '2026-07-29 14:30:00', conduct_points: 98 }
    ];
    students = [
      { id: 1, first_name: 'Juan',        last_name: 'Dela Cruz', lrn: '136123450001', grade_level: 'Grade 10', section: 'St. Thomas',     conduct_points: 80 },
      { id: 2, first_name: 'Maria Clara', last_name: 'Gonzales',  lrn: '136123450002', grade_level: 'Grade 11', section: 'St. Bernadette', conduct_points: 98 },
      { id: 3, first_name: 'Mark Anthony',last_name: 'Bautista',  lrn: '136123450003', grade_level: 'Grade 9',  section: 'St. Lorenzo',    conduct_points: 65 },
      { id: 4, first_name: 'Sophia',      last_name: 'Mendoza',   lrn: '136123450004', grade_level: 'Grade 12', section: 'St. Catherine',  conduct_points: 100 },
      { id: 5, first_name: 'Christian',   last_name: 'Navarro',   lrn: '136123450005', grade_level: 'Grade 8',  section: 'St. Francis',    conduct_points: 60 }
    ];
  }

  const totalMerits   = history.filter(h => h.points_change > 0).reduce((s, h) => s + h.points_change, 0);
  const totalDemerits = history.filter(h => h.points_change < 0).reduce((s, h) => s + h.points_change, 0);
  const avgPoints     = students.length ? Math.round(students.reduce((s, st) => s + (st.conduct_points || 0), 0) / students.length) : 0;

  container.innerHTML = `
    <!-- Page Header -->
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:25px;">
      <div>
        <h2 style="font-size:1.6rem; font-weight:800; color:var(--text-light); margin-bottom:4px;">
          <i class="fas fa-star" style="color:var(--accent); margin-right:10px;"></i>Behavior Points Ledger
        </h2>
        <p style="font-size:0.85rem; color:var(--text-muted);">
          Track conduct point merits and demerit deductions. Award points for good behavior or issue deductions for infractions.
        </p>
      </div>
      <button class="btn btn-primary" onclick="openAwardPointsModal()">
        <i class="fas fa-plus-circle"></i> Award / Deduct Points
      </button>
    </div>

    <!-- KPI Cards -->
    <div class="card-grid" style="margin-bottom:25px;">
      <div class="card metric-card">
        <div class="metric-info">
          <h3>${history.length}</h3>
          <p>Total Transactions</p>
        </div>
        <div class="metric-icon"><i class="fas fa-exchange-alt"></i></div>
      </div>
      <div class="card metric-card">
        <div class="metric-info">
          <h3 style="color:var(--success);">+${totalMerits}</h3>
          <p>Total Merits Awarded</p>
        </div>
        <div class="metric-icon" style="background:rgba(16,185,129,0.15); color:var(--success);">
          <i class="fas fa-thumbs-up"></i>
        </div>
      </div>
      <div class="card metric-card">
        <div class="metric-info">
          <h3 style="color:var(--danger);">${totalDemerits}</h3>
          <p>Total Demerits Issued</p>
        </div>
        <div class="metric-icon" style="background:rgba(239,68,68,0.15); color:var(--danger);">
          <i class="fas fa-thumbs-down"></i>
        </div>
      </div>
      <div class="card metric-card">
        <div class="metric-info">
          <h3 style="color:var(--accent);">${avgPoints}<span style="font-size:1rem; font-weight:500;">/100</span></h3>
          <p>Avg. Conduct Score</p>
        </div>
        <div class="metric-icon" style="background:rgba(255,95,162,0.15); color:var(--accent);">
          <i class="fas fa-chart-line"></i>
        </div>
      </div>
    </div>

    <!-- Student Standing Quick View -->
    <div style="margin-bottom:25px;">
      <h3 style="font-size:1rem; font-weight:700; color:var(--text-light); margin-bottom:14px;">
        <i class="fas fa-users" style="color:var(--accent);"></i> Student Conduct Standing
      </h3>
      <div style="display:flex; gap:12px; flex-wrap:wrap;">
        ${students.map(s => {
          const pts   = s.conduct_points || 0;
          const color = pts >= 90 ? 'var(--success)' : (pts >= 75 ? 'var(--warning)' : 'var(--danger)');
          const label = pts >= 90 ? 'Low Risk' : (pts >= 75 ? 'Mod. Risk' : 'High Risk');
          const pct   = Math.min(100, pts);
          return `
          <div class="card card-dark" style="flex:1; min-width:160px; padding:16px; border-top:3px solid ${color};">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
              <strong style="font-size:0.83rem;">${s.first_name} ${s.last_name}</strong>
              <span class="badge" style="background:${color}20; color:${color}; border:1px solid ${color}40; font-size:0.68rem;">${label}</span>
            </div>
            <p style="font-size:0.72rem; color:var(--text-muted); margin-bottom:8px;">${s.grade_level} • ${s.lrn}</p>
            <div style="background:rgba(255,255,255,0.08); height:6px; border-radius:3px; overflow:hidden; margin-bottom:6px;">
              <div style="width:${pct}%; height:100%; background:${color}; border-radius:3px; transition:width 0.8s ease;"></div>
            </div>
            <div style="font-size:0.8rem; font-weight:800; color:${color}; text-align:right;">${pts}/100 pts</div>
          </div>`;
        }).join('')}
      </div>
    </div>

    <!-- Points Transaction History -->
    <div class="table-container">
      <div class="table-header">
        <div>
          <h3><i class="fas fa-calculator" style="color:var(--accent);"></i> Points Transaction History</h3>
          <p style="font-size:0.78rem; color:var(--text-muted); margin-top:2px;">${history.length} transaction(s) recorded</p>
        </div>
        <div style="display:flex; gap:10px;">
          <select id="pointsTypeFilter" onchange="filterPointsTable()" style="padding:7px 12px; border-radius:var(--radius-sm); border:1px solid var(--input-border); background:var(--input-bg); color:var(--text-light); font-size:0.82rem; outline:none;">
            <option value="">All Types</option>
            <option value="Merit">Merit</option>
            <option value="Demerit">Demerit</option>
            <option value="Reformation Reward">Reformation Reward</option>
          </select>
          <button class="btn btn-secondary btn-sm" onclick="exportPointsCSV()">
            <i class="fas fa-file-csv" style="color:var(--success);"></i> Export
          </button>
        </div>
      </div>
      <table>
        <thead>
          <tr>
            <th>Tx ID</th>
            <th>Student</th>
            <th>LRN</th>
            <th>Type</th>
            <th>Points Change</th>
            <th>Reason / Reference</th>
            <th>Conduct Score</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody id="pointsTableBody">
          ${history.map(h => `
            <tr data-type="${h.point_type}">
              <td><code style="color:var(--accent); font-size:0.78rem;">#BP-${String(h.id).padStart(3,'0')}</code></td>
              <td>
                <div style="display:flex; align-items:center; gap:8px;">
                  <div style="width:30px; height:30px; border-radius:50%; background:linear-gradient(135deg,var(--primary),#2D1424); border:1.5px solid var(--accent); display:flex; align-items:center; justify-content:center; font-size:0.65rem; font-weight:800; color:#fff;">
                    ${(h.first_name[0] + h.last_name[0]).toUpperCase()}
                  </div>
                  <strong style="font-size:0.85rem;">${h.first_name} ${h.last_name}</strong>
                </div>
              </td>
              <td><code style="font-size:0.78rem;">${h.lrn}</code></td>
              <td>
                <span class="badge ${h.point_type === 'Demerit' ? 'badge-danger' : (h.point_type === 'Merit' ? 'badge-success' : 'badge-primary')}">
                  <i class="fas ${h.point_type === 'Demerit' ? 'fa-minus-circle' : (h.point_type === 'Merit' ? 'fa-plus-circle' : 'fa-star')}" style="margin-right:3px;"></i>${h.point_type}
                </span>
              </td>
              <td>
                <strong style="font-size:1rem; color:${h.points_change < 0 ? 'var(--danger)' : 'var(--success)'};">
                  ${h.points_change > 0 ? '+' : ''}${h.points_change} pts
                </strong>
              </td>
              <td style="max-width:260px; font-size:0.8rem; color:var(--text-muted);">${h.reason}</td>
              <td>
                <div>
                  <strong style="font-size:0.88rem;">${h.conduct_points} / 100</strong>
                  <div style="background:rgba(255,255,255,0.08); height:4px; border-radius:2px; margin-top:4px; overflow:hidden; width:80px;">
                    <div style="width:${Math.min(100,h.conduct_points)}%; height:100%; background:${h.conduct_points >= 90 ? 'var(--success)' : (h.conduct_points >= 75 ? 'var(--warning)' : 'var(--danger)')}; border-radius:2px;"></div>
                  </div>
                </div>
              </td>
              <td style="font-size:0.8rem; color:var(--text-muted);">${h.created_at}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>

    <!-- Award / Deduct Points Modal -->
    <div class="modal-overlay" id="awardPointsModal">
      <div class="modal-content" style="max-width:560px;">
        <div class="modal-header">
          <h3 id="awardModalTitle"><i class="fas fa-star" style="color:var(--accent);"></i> Award / Deduct Conduct Points</h3>
          <button style="background:none; border:none; font-size:1.4rem; color:var(--text-light); cursor:pointer;" onclick="closeAwardPointsModal()">&times;</button>
        </div>
        <form id="awardPointsForm" onsubmit="handleAwardPointsSubmit(event)">

          <div class="form-group">
            <label>Select Student <span style="color:var(--danger);">*</span></label>
            <select id="pts_student_id" required onchange="updateStudentPreview()">
              <option value="">-- Choose Student --</option>
              ${students.map(s => `<option value="${s.id}" data-points="${s.conduct_points}" data-lrn="${s.lrn}">${s.first_name} ${s.last_name} (${s.lrn} — ${s.grade_level})</option>`).join('')}
            </select>
          </div>

          <!-- Student preview -->
          <div id="studentPreview" style="display:none; background:rgba(255,95,162,0.06); border:1px solid rgba(255,95,162,0.2); border-radius:var(--radius-sm); padding:12px 14px; margin-bottom:16px; font-size:0.82rem;">
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <span style="color:var(--text-muted);">Current Conduct Score</span>
              <strong id="previewCurrentPoints" style="color:var(--accent); font-size:1.1rem;">— / 100 pts</strong>
            </div>
            <div id="previewBar" style="background:rgba(255,255,255,0.1); height:6px; border-radius:3px; margin-top:8px; overflow:hidden;">
              <div id="previewBarFill" style="height:100%; border-radius:3px; width:0%; background:var(--accent); transition:width 0.5s;"></div>
            </div>
          </div>

          <div class="form-group">
            <label>Transaction Type <span style="color:var(--danger);">*</span></label>
            <select id="pts_type" required onchange="updatePointsSign()">
              <option value="Merit">Merit — Award Points (+)</option>
              <option value="Demerit">Demerit — Deduct Points (−)</option>
              <option value="Reformation Reward">Reformation Reward (+)</option>
            </select>
          </div>

          <div class="form-group">
            <label>Points Amount <span style="color:var(--danger);">*</span></label>
            <div style="position:relative;">
              <span id="pointsSignLabel" style="position:absolute; left:12px; top:50%; transform:translateY(-50%); font-weight:800; color:var(--success); font-size:1.1rem;">+</span>
              <input type="number" id="pts_amount" min="1" max="50" placeholder="e.g. 5" required
                style="padding-left:28px;" oninput="updatePointsPreview()" />
            </div>
          </div>

          <!-- Preview result -->
          <div id="pointsResultPreview" style="display:none; background:rgba(16,185,129,0.06); border:1px solid rgba(16,185,129,0.2); border-radius:var(--radius-sm); padding:12px 14px; margin-bottom:16px; font-size:0.82rem; text-align:center;">
            <span style="color:var(--text-muted);">New conduct score will be: </span>
            <strong id="newScorePreview" style="font-size:1.15rem; color:var(--success);">—</strong>
          </div>

          <div class="form-group">
            <label>Incident / Offense Reference (Optional)</label>
            <input type="text" id="pts_incident_ref" placeholder="e.g. INC-2026-0001 or 'Honor Roll Q1'" />
          </div>

          <div class="form-group">
            <label>Reason / Justification <span style="color:var(--danger);">*</span></label>
            <textarea id="pts_reason" rows="3" placeholder="Provide a clear justification for this point transaction..." required></textarea>
          </div>

          <div style="display:flex; justify-content:flex-end; gap:10px; border-top:1px solid var(--border-color); padding-top:16px;">
            <button type="button" class="btn btn-secondary" onclick="closeAwardPointsModal()">Cancel</button>
            <button type="submit" class="btn btn-primary" id="savePointsBtn">
              <i class="fas fa-save"></i> Confirm Transaction
            </button>
          </div>
        </form>
      </div>
    </div>
  `;

  // Filter table by type
  window.filterPointsTable = () => {
    const type = document.getElementById('pointsTypeFilter')?.value || '';
    document.querySelectorAll('#pointsTableBody tr').forEach(row => {
      row.style.display = (!type || row.getAttribute('data-type') === type) ? '' : 'none';
    });
  };

  // Modal helpers
  window.openAwardPointsModal = () => {
    document.getElementById('awardPointsForm').reset();
    document.getElementById('studentPreview').style.display = 'none';
    document.getElementById('pointsResultPreview').style.display = 'none';
    document.getElementById('awardPointsModal').classList.add('active');
  };

  window.closeAwardPointsModal = () => {
    document.getElementById('awardPointsModal').classList.remove('active');
  };

  window.updateStudentPreview = () => {
    const sel = document.getElementById('pts_student_id');
    const opt = sel.options[sel.selectedIndex];
    const pts = parseInt(opt.getAttribute('data-points') || '0');
    const preview = document.getElementById('studentPreview');
    const scoreEl = document.getElementById('previewCurrentPoints');
    const barEl   = document.getElementById('previewBarFill');
    if (sel.value) {
      preview.style.display = 'block';
      scoreEl.textContent = `${pts} / 100 pts`;
      barEl.style.width = Math.min(100, pts) + '%';
      barEl.style.background = pts >= 90 ? 'var(--success)' : (pts >= 75 ? 'var(--warning)' : 'var(--danger)');
    } else {
      preview.style.display = 'none';
    }
    updatePointsPreview();
  };

  window.updatePointsSign = () => {
    const type = document.getElementById('pts_type').value;
    const sign = document.getElementById('pointsSignLabel');
    if (sign) {
      if (type === 'Demerit') { sign.textContent = '−'; sign.style.color = 'var(--danger)'; }
      else { sign.textContent = '+'; sign.style.color = 'var(--success)'; }
    }
    updatePointsPreview();
  };

  window.updatePointsPreview = () => {
    const sel    = document.getElementById('pts_student_id');
    const opt    = sel.options[sel.selectedIndex];
    const curPts = parseInt(opt?.getAttribute('data-points') || '0');
    const type   = document.getElementById('pts_type').value;
    const amt    = parseInt(document.getElementById('pts_amount').value) || 0;
    const result = document.getElementById('pointsResultPreview');
    const newEl  = document.getElementById('newScorePreview');

    if (sel.value && amt > 0) {
      const isDemerit = type === 'Demerit';
      const newScore  = Math.max(0, Math.min(100, isDemerit ? curPts - amt : curPts + amt));
      result.style.display = 'block';
      result.style.background = isDemerit ? 'rgba(239,68,68,0.06)' : 'rgba(16,185,129,0.06)';
      result.style.borderColor = isDemerit ? 'rgba(239,68,68,0.2)' : 'rgba(16,185,129,0.2)';
      newEl.textContent = `${newScore} / 100 pts`;
      newEl.style.color = newScore >= 90 ? 'var(--success)' : (newScore >= 75 ? 'var(--warning)' : 'var(--danger)');
    } else {
      result.style.display = 'none';
    }
  };

  window.handleAwardPointsSubmit = async (e) => {
    e.preventDefault();
    const btn = document.getElementById('savePointsBtn');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> Processing...';

    const type = document.getElementById('pts_type').value;
    const amt  = parseInt(document.getElementById('pts_amount').value);
    const payload = {
      student_id:   document.getElementById('pts_student_id').value,
      point_type:   type,
      points_change: type === 'Demerit' ? -amt : amt,
      reason:        document.getElementById('pts_reason').value +
                    (document.getElementById('pts_incident_ref').value ? ` (${document.getElementById('pts_incident_ref').value})` : '')
    };

    try {
      await ApiClient.post('proceedings', 'points', payload);
      alert(`Points transaction recorded successfully!\n${type}: ${type === 'Demerit' ? '-' : '+'}${amt} pts`);
      closeAwardPointsModal();
      window.renderPointsModule(container);
    } catch (err) {
      // Demo fallback
      alert(`Points transaction saved (demo mode).\n${type}: ${type === 'Demerit' ? '-' : '+'}${amt} pts\nReason: ${payload.reason}`);
      closeAwardPointsModal();
      window.renderPointsModule(container);
    }
  };

  // CSV Export
  window.exportPointsCSV = () => {
    const headers = ['Tx ID','Student','LRN','Type','Points Change','Reason','Conduct Score','Date'];
    const rows = [...document.querySelectorAll('#pointsTableBody tr')]
      .filter(r => r.style.display !== 'none')
      .map(r => {
        const cells = r.querySelectorAll('td');
        return [
          cells[0]?.innerText.trim(),
          cells[1]?.innerText.trim(),
          cells[2]?.innerText.trim(),
          cells[3]?.innerText.trim(),
          cells[4]?.innerText.trim(),
          '"' + (cells[5]?.innerText.trim().replace(/"/g,'""') || '') + '"',
          cells[6]?.innerText.trim(),
          cells[7]?.innerText.trim()
        ].join(',');
      });
    const csv = [headers.join(','), ...rows].join('\n');
    const link = document.createElement('a');
    link.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
    link.download = 'St_Agnes_BehaviorPoints_' + new Date().toISOString().slice(0,10) + '.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
};
