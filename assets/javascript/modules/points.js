/**
 * Behavior Points Module
 * Prefect Disciplinary Action System — St. Agnes Academy
 */

window.renderPointsModule = async function(container) {
  let history = [];
  let students = [];
  let selectedStudent = null;
  let searchTimeout = null;

  try {
    const [ptRes, stRes] = await Promise.all([
      ApiClient.get('proceedings', 'points'),
      ApiClient.get('students', 'list')
    ]);
    history  = ptRes.data || [];
    students = stRes.data || [];
  } catch (e) {
    console.error('Error loading behavior points:', e);
    history  = [];
    students = [];
  }

  const totalMerits   = history.filter(h => h.points_change > 0).reduce((s, h) => s + h.points_change, 0);
  const totalDemerits = history.filter(h => h.points_change < 0).reduce((s, h) => s + h.points_change, 0);
  const avgPoints     = students.length ? Math.round(students.reduce((s, st) => s + (st.conduct_points || 0), 0) / students.length) : 100;

  container.innerHTML = `
    <!-- Page Header -->
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:25px; flex-wrap:wrap; gap:12px;">
      <div>
        <h2 style="font-size:1.6rem; font-weight:800; color:var(--text-light); margin-bottom:4px;">
          <i class="fas fa-star" style="color:var(--accent); margin-right:8px;"></i>Behavior Points Ledger
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
        <i class="fas fa-users" style="color:var(--accent);"></i> Student Conduct Standing Overview
      </h3>
      <div style="display:flex; gap:12px; flex-wrap:wrap;">
        ${students.length === 0 ? `<p style="color:var(--text-muted); font-size:0.85rem;">No student records found.</p>` : students.map(s => {
          const pts   = s.conduct_points !== undefined ? s.conduct_points : 100;
          const color = pts >= 90 ? 'var(--success)' : (pts >= 75 ? 'var(--warning)' : 'var(--danger)');
          const label = pts >= 90 ? 'Low Risk' : (pts >= 75 ? 'Mod. Risk' : 'High Risk');

          return `
            <div style="background:var(--card-bg); border:1px solid var(--border-color); border-radius:var(--radius-sm); padding:12px 16px; min-width:180px; flex:1; border-left:3px solid ${color};">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
                <strong style="font-size:0.88rem;">${s.first_name} ${s.last_name}</strong>
                <span class="badge" style="background:${color}; color:#fff; font-size:0.7rem;">${label}</span>
              </div>
              <div style="font-size:0.75rem; color:var(--text-muted); margin-bottom:6px;">${s.grade_level} - ${s.section}</div>
              <div style="display:flex; justify-content:space-between; align-items:center;">
                <span style="font-size:0.75rem; color:var(--text-muted);">Conduct Score:</span>
                <strong style="font-size:0.95rem; color:${color};">${pts} pts</strong>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>

    <!-- Transaction Ledger Table -->
    <div class="table-container">
      <div class="table-header">
        <div>
          <h3><i class="fas fa-history" style="color:var(--accent);"></i> Points Transaction History</h3>
          <p style="font-size: 0.8rem; color: var(--text-muted); margin-top:2px;">Audited log of merits, demerits, and reformation reward points.</p>
        </div>
      </div>
      <table>
        <thead>
          <tr>
            <th>Log Ref</th>
            <th>Student</th>
            <th>LRN</th>
            <th>Type</th>
            <th>Points Change</th>
            <th>Reason / Justification</th>
            <th>Recorded By</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody id="pointsTableBody">
          ${history.length === 0 ? `
            <tr>
              <td colspan="8" style="text-align:center; color:var(--text-muted); padding:35px;">
                <i class="fas fa-star fa-2x" style="margin-bottom:10px; opacity:0.4; display:block;"></i>
                No behavior point transactions recorded yet.<br>
                Click <strong>"Award / Deduct Points"</strong> or log an infraction to adjust conduct scores.
              </td>
            </tr>
          ` : history.map(h => `
            <tr>
              <td><code>#BP-${String(h.id).padStart(3,'0')}</code></td>
              <td><strong>${h.first_name} ${h.last_name}</strong></td>
              <td><code>${h.lrn || '-'}</code></td>
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
              <td style="max-width:280px; font-size:0.82rem;">${h.reason}</td>
              <td style="font-size:0.8rem;">${h.created_by_name || 'Officer'}</td>
              <td style="font-size:0.8rem; color:var(--text-muted);">${h.created_at}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>

    <!-- Award / Deduct Points Modal -->
    <div class="modal-overlay" id="awardPointsModal">
      <div class="modal-content" style="max-width:620px;">
        <div class="modal-header">
          <h3><i class="fas fa-star" style="color:var(--accent);"></i> Award / Deduct Conduct Points</h3>
          <button style="background:none; border:none; font-size:1.4rem; color:var(--text-light); cursor:pointer;" onclick="closeAwardPointsModal()">&times;</button>
        </div>
        <form id="awardPointsForm" onsubmit="handleAwardPointsSubmit(event)">
          
          <!-- Student Search & Selection -->
          <div class="form-group">
            <label>Select Student <span style="color:var(--danger);">*</span></label>
            <input type="hidden" id="pts_student_id" value="" />

            <div id="pts_student_search_container">
              <div class="student-lookup-box">
                <div class="student-search-input-wrap">
                  <i class="fas fa-search"></i>
                  <input type="text" id="pts_student_search_query" placeholder="Search Student ID (e.g. 001), LRN, or Name..." oninput="handlePtsStudentSearch(this.value)" autocomplete="off" />
                </div>
                <button type="button" class="btn btn-secondary" onclick="triggerPtsStudentSearch()">Search</button>
              </div>
              <div id="pts_student_search_status" style="margin-top: 6px;"></div>
            </div>

            <!-- Selected Student Card -->
            <div id="pts_selected_student_display" style="display: none;" class="selected-student-card">
              <div class="selected-student-header">
                <h4><i class="fas fa-user-check"></i> Selected Student</h4>
                <button type="button" class="btn btn-secondary btn-sm" onclick="clearPtsStudent()">Change</button>
              </div>
              <div class="selected-student-grid">
                <div class="selected-student-field">
                  <span class="label">ID / LRN</span>
                  <span class="value" id="pts_sel_lrn">-</span>
                </div>
                <div class="selected-student-field">
                  <span class="label">Name</span>
                  <span class="value" id="pts_sel_name">-</span>
                </div>
                <div class="selected-student-field">
                  <span class="label">Grade & Section</span>
                  <span class="value" id="pts_sel_grade">-</span>
                </div>
                <div class="selected-student-field">
                  <span class="label">Current Score</span>
                  <span class="value" id="pts_sel_score" style="color:var(--accent); font-weight:700;">-</span>
                </div>
              </div>
            </div>
          </div>

          <div style="display:grid; grid-template-columns: 1fr 1fr; gap:14px;">
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
                <input type="number" id="pts_amount" min="1" max="100" value="5" required style="padding-left:28px;" oninput="updatePointsPreview()" />
              </div>
            </div>
          </div>

          <!-- Preview result -->
          <div id="pointsResultPreview" style="background:rgba(255,255,255,0.04); border:1px solid var(--border-color); border-radius:var(--radius-sm); padding:10px 14px; margin-bottom:16px; font-size:0.82rem;">
            <span style="color:var(--text-muted);">Estimated New Conduct Score: </span>
            <strong id="newScorePreview" style="font-size:1.1rem; color:var(--accent);">—</strong>
          </div>

          <div class="form-group">
            <label>Reason / Justification <span style="color:var(--danger);">*</span></label>
            <textarea id="pts_reason" rows="3" placeholder="Provide a clear justification (e.g. Campus cleanup completion, exemplary conduct, honor roll)..." required></textarea>
          </div>

          <div style="display:flex; justify-content:flex-end; gap:10px; border-top:1px solid var(--border-color); padding-top:15px; margin-top:20px;">
            <button type="button" class="btn btn-secondary" onclick="closeAwardPointsModal()">Cancel</button>
            <button type="submit" class="btn btn-primary" id="savePointsBtn"><i class="fas fa-save"></i> Save Transaction</button>
          </div>
        </form>
      </div>
    </div>
  `;

  // Student Search Handling
  window.handlePtsStudentSearch = (query) => {
    if (searchTimeout) clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => performPtsStudentSearch(query), 300);
  };

  window.triggerPtsStudentSearch = () => {
    const q = document.getElementById('pts_student_search_query').value;
    performPtsStudentSearch(q);
  };

  window.performPtsStudentSearch = async (query) => {
    const area = document.getElementById('pts_student_search_status');
    if (!area) return;
    area.innerHTML = `<div style="padding:8px; font-size:0.8rem; color:var(--text-muted);"><i class="fas fa-spinner fa-spin"></i> Searching...</div>`;

    try {
      const res = await ApiClient.get('students', 'list', null, { search: query.trim() });
      const found = res.data || [];
      if (found.length === 0) {
        area.innerHTML = `<div style="padding:6px; font-size:0.8rem; color:var(--warning);">No matching student found.</div>`;
      } else {
        area.innerHTML = `
          <div style="max-height:160px; overflow-y:auto; border:1px solid var(--border-color); border-radius:var(--radius-sm); margin-top:4px;">
            ${found.map(s => `
              <div style="padding:8px 12px; border-bottom:1px solid var(--border-color); display:flex; justify-content:space-between; align-items:center; cursor:pointer;" 
                   onmouseover="this.style.background='rgba(255,255,255,0.05)'" onmouseout="this.style.background='transparent'"
                   onclick='selectPtsStudent(${JSON.stringify(s).replace(/'/g, "&apos;")})'>
                <div><strong>${s.first_name} ${s.last_name}</strong> <span style="font-size:0.75rem; color:var(--text-muted);">(${s.lrn} — ${s.conduct_points || 100} pts)</span></div>
                <button type="button" class="btn btn-primary btn-sm">Select</button>
              </div>
            `).join('')}
          </div>
        `;
      }
    } catch (e) {
      area.innerHTML = `<div style="padding:6px; font-size:0.8rem; color:var(--danger);">Error searching students.</div>`;
    }
  };

  window.selectPtsStudent = (student) => {
    selectedStudent = student;
    document.getElementById('pts_student_id').value = student.id;
    document.getElementById('pts_sel_lrn').textContent = student.lrn;
    document.getElementById('pts_sel_name').textContent = `${student.first_name} ${student.last_name}`;
    document.getElementById('pts_sel_grade').textContent = `${student.grade_level} - ${student.section}`;
    document.getElementById('pts_sel_score').textContent = `${student.conduct_points || 100} pts`;

    document.getElementById('pts_student_search_container').style.display = 'none';
    document.getElementById('pts_selected_student_display').style.display = 'block';

    updatePointsPreview();
  };

  window.clearPtsStudent = () => {
    selectedStudent = null;
    document.getElementById('pts_student_id').value = '';
    document.getElementById('pts_student_search_container').style.display = 'block';
    document.getElementById('pts_selected_student_display').style.display = 'none';
    document.getElementById('pts_student_search_query').value = '';
    document.getElementById('pts_student_search_status').innerHTML = '';
    updatePointsPreview();
  };

  window.updatePointsSign = () => {
    const type = document.getElementById('pts_type').value;
    const signLabel = document.getElementById('pointsSignLabel');
    if (type === 'Demerit') {
      signLabel.textContent = '−';
      signLabel.style.color = 'var(--danger)';
    } else {
      signLabel.textContent = '+';
      signLabel.style.color = 'var(--success)';
    }
    updatePointsPreview();
  };

  window.updatePointsPreview = () => {
    const preview = document.getElementById('newScorePreview');
    if (!preview) return;

    if (!selectedStudent) {
      preview.textContent = 'Please select a student';
      return;
    }

    const current = selectedStudent.conduct_points !== undefined ? selectedStudent.conduct_points : 100;
    const type = document.getElementById('pts_type').value;
    const amt = parseInt(document.getElementById('pts_amount').value || 0, 10);
    const delta = type === 'Demerit' ? -amt : amt;
    const newScore = Math.max(0, current + delta);

    preview.innerHTML = `<strong>${current}</strong> ${delta >= 0 ? '+' : ''}${delta} = <span style="color:${newScore >= 90 ? 'var(--success)' : (newScore >= 75 ? 'var(--warning)' : 'var(--danger)')}; font-weight:800;">${newScore} / 100 pts</span>`;
  };

  window.openAwardPointsModal = () => {
    clearPtsStudent();
    document.getElementById('awardPointsForm').reset();
    updatePointsSign();
    document.getElementById('awardPointsModal').classList.add('active');
    performPtsStudentSearch('');
  };

  window.closeAwardPointsModal = () => document.getElementById('awardPointsModal').classList.remove('active');

  window.handleAwardPointsSubmit = async (e) => {
    e.preventDefault();
    const studentId = document.getElementById('pts_student_id').value;
    if (!studentId) {
      alert('Please select a student.');
      return;
    }

    const type = document.getElementById('pts_type').value;
    const rawAmt = parseInt(document.getElementById('pts_amount').value, 10);
    const pointsDelta = type === 'Demerit' ? -Math.abs(rawAmt) : Math.abs(rawAmt);

    const payload = {
      student_id: parseInt(studentId, 10),
      point_type: type,
      points_change: pointsDelta,
      reason: document.getElementById('pts_reason').value
    };

    try {
      await ApiClient.post('proceedings', 'points', payload);
      alert('Conduct points transaction saved successfully!');
      closeAwardPointsModal();
      window.renderPointsModule(container);
    } catch (err) {
      alert('Error recording points: ' + (err.message || 'Server error'));
    }
  };
};
