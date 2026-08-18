/**
 * Clearance Hold Module
 * Prefect Disciplinary Action System — St. Agnes Academy
 */

window.renderClearanceModule = async function(container) {
  let holds = [];
  let selectedStudent = null;
  let searchTimeout = null;

  try {
    const res = await ApiClient.get('proceedings', 'clearance');
    holds = res.data || [];
  } catch (e) {
    console.error('Error fetching clearance holds:', e);
    holds = [];
  }

  container.innerHTML = `
    <div class="table-container">
      <div class="table-header">
        <div>
          <h3><i class="fas fa-user-lock" style="color: var(--primary);"></i> Clearance Hold Flagging</h3>
          <p style="font-size: 0.8rem; color: var(--text-muted); margin-top:2px;">Lock student clearance for enrollment, graduation, or credentials until disciplinary cases are resolved.</p>
        </div>
        <button class="btn btn-primary" onclick="openClearanceModal()">
          <i class="fas fa-flag"></i> Flag Clearance Hold
        </button>
      </div>
      <table>
        <thead>
          <tr>
            <th>Student Name</th>
            <th>LRN</th>
            <th>Grade & Section</th>
            <th>Hold Reason & Offense</th>
            <th>Flagged By</th>
            <th>Flag Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody id="clearanceTableBody">
          ${holds.length === 0 ? `
            <tr>
              <td colspan="7" style="text-align:center; color:var(--text-muted); padding:35px;">
                <i class="fas fa-shield-alt fa-2x" style="margin-bottom:10px; opacity:0.4; display:block;"></i>
                No active clearance holds recorded.<br>
                All students currently have normal clearance status.
              </td>
            </tr>
          ` : holds.map(h => {
            const isActive = h.is_active == 1 || h.is_active === true;
            return `
              <tr>
                <td><strong>${h.first_name} ${h.last_name}</strong></td>
                <td><code>${h.lrn}</code></td>
                <td>${h.grade_level} - ${h.section}</td>
                <td style="max-width:280px; font-size:0.85rem;">${h.hold_reason}</td>
                <td style="font-size:0.8rem;">${h.flagged_by_name || 'Prefect Office'}</td>
                <td>
                  <span class="badge ${isActive ? 'badge-danger' : 'badge-success'}">
                    <i class="fas ${isActive ? 'fa-lock' : 'fa-check'}" style="margin-right:3px;"></i>${isActive ? 'CLEARANCE BLOCKED' : 'RELEASED'}
                  </span>
                </td>
                <td>
                  ${isActive ? `
                    <button class="btn btn-secondary btn-sm" style="color:var(--success);" title="Lift / Release Clearance Hold" onclick="toggleHold(${h.student_id}, false, '${h.first_name} ${h.last_name}')">
                      <i class="fas fa-check-circle"></i> Release Hold
                    </button>
                  ` : `<span style="font-size:0.8rem; color:var(--text-muted);">Cleared</span>`}
                </td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    </div>

    <!-- Modal for Clearance Hold -->
    <div class="modal-overlay" id="clearanceModal">
      <div class="modal-content" style="max-width:620px;">
        <div class="modal-header">
          <h3><i class="fas fa-lock" style="color:var(--danger);"></i> Flag Student Clearance Hold</h3>
          <button style="background:none; border:none; font-size:1.4rem; color:var(--text-light); cursor:pointer;" onclick="closeClearanceModal()">&times;</button>
        </div>
        <form id="clearanceForm" onsubmit="handleClearanceSubmit(event)">
          
          <!-- Student Search & Selection -->
          <div class="form-group">
            <label>Select Student to Hold <span style="color:var(--danger);">*</span></label>
            <input type="hidden" id="c_student_id" value="" />

            <div id="clearance_student_search_container">
              <div class="student-lookup-box">
                <div class="student-search-input-wrap">
                  <i class="fas fa-search"></i>
                  <input type="text" id="clearance_student_search_query" placeholder="Search Student ID (e.g. 001), LRN, or Name..." oninput="handleClearanceStudentSearch(this.value)" autocomplete="off" />
                </div>
                <button type="button" class="btn btn-secondary" onclick="triggerClearanceStudentSearch()">Search</button>
              </div>
              <div id="clearance_student_search_status" style="margin-top: 6px;"></div>
            </div>

            <!-- Selected Student Card -->
            <div id="clearance_selected_student_display" style="display: none;" class="selected-student-card">
              <div class="selected-student-header">
                <h4><i class="fas fa-user-check"></i> Selected Student</h4>
                <button type="button" class="btn btn-secondary btn-sm" onclick="clearClearanceStudent()">Change</button>
              </div>
              <div class="selected-student-grid">
                <div class="selected-student-field">
                  <span class="label">ID / LRN</span>
                  <span class="value" id="c_sel_lrn">-</span>
                </div>
                <div class="selected-student-field">
                  <span class="label">Name</span>
                  <span class="value" id="c_sel_name">-</span>
                </div>
                <div class="selected-student-field">
                  <span class="label">Grade & Section</span>
                  <span class="value" id="c_sel_grade">-</span>
                </div>
                <div class="selected-student-field">
                  <span class="label">Conduct Score</span>
                  <span class="value" id="c_sel_pts">-</span>
                </div>
              </div>
            </div>
          </div>

          <div class="form-group">
            <label>Hold Reason & Requirements for Resolution <span style="color:var(--danger);">*</span></label>
            <textarea id="c_reason" rows="3" placeholder="State reasons for blocking clearance (e.g. Unserved sanction, missing parent acknowledgment slip)..." required></textarea>
          </div>

          <div style="display:flex; justify-content:flex-end; gap:10px; margin-top:20px; border-top:1px solid var(--border-color); padding-top:15px;">
            <button type="button" class="btn btn-secondary" onclick="closeClearanceModal()">Cancel</button>
            <button type="submit" class="btn btn-primary" id="saveClearanceBtn">
              <i class="fas fa-lock"></i> Apply Clearance Hold
            </button>
          </div>
        </form>
      </div>
    </div>
  `;

  // Student Search Handling
  window.handleClearanceStudentSearch = (query) => {
    if (searchTimeout) clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => performClearanceStudentSearch(query), 300);
  };

  window.triggerClearanceStudentSearch = () => {
    const q = document.getElementById('clearance_student_search_query').value;
    performClearanceStudentSearch(q);
  };

  window.performClearanceStudentSearch = async (query) => {
    const area = document.getElementById('clearance_student_search_status');
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
                   onclick='selectClearanceStudent(${JSON.stringify(s).replace(/'/g, "&apos;")})'>
                <div><strong>${s.first_name} ${s.last_name}</strong> <span style="font-size:0.75rem; color:var(--text-muted);">(${s.lrn} — ${s.grade_level})</span></div>
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

  window.selectClearanceStudent = (student) => {
    selectedStudent = student;
    document.getElementById('c_student_id').value = student.id;
    document.getElementById('c_sel_lrn').textContent = student.lrn;
    document.getElementById('c_sel_name').textContent = `${student.first_name} ${student.last_name}`;
    document.getElementById('c_sel_grade').textContent = `${student.grade_level} - ${student.section}`;
    document.getElementById('c_sel_pts').textContent = `${student.conduct_points || 100} pts`;

    document.getElementById('clearance_student_search_container').style.display = 'none';
    document.getElementById('clearance_selected_student_display').style.display = 'block';
  };

  window.clearClearanceStudent = () => {
    selectedStudent = null;
    document.getElementById('c_student_id').value = '';
    document.getElementById('clearance_student_search_container').style.display = 'block';
    document.getElementById('clearance_selected_student_display').style.display = 'none';
    document.getElementById('clearance_student_search_query').value = '';
    document.getElementById('clearance_student_search_status').innerHTML = '';
  };

  window.openClearanceModal = () => {
    clearClearanceStudent();
    document.getElementById('clearanceForm').reset();
    document.getElementById('clearanceModal').classList.add('active');
    performClearanceStudentSearch('');
  };

  window.closeClearanceModal = () => document.getElementById('clearanceModal').classList.remove('active');

  window.toggleHold = async (studentId, holdStatus, studentName) => {
    try {
      await ApiClient.post('proceedings', 'clearance', { student_id: studentId, hold: holdStatus });
      alert(`Clearance hold ${holdStatus ? 'applied to' : 'released for'} ${studentName || 'student'}.`);
      window.renderClearanceModule(container);
    } catch (err) {
      alert('Error updating clearance: ' + (err.message || 'Server error'));
    }
  };

  window.handleClearanceSubmit = async (e) => {
    e.preventDefault();
    const studentId = document.getElementById('c_student_id').value;
    if (!studentId) {
      alert('Please search and select a student.');
      return;
    }

    const payload = {
      student_id: parseInt(studentId, 10),
      hold: true,
      reason: document.getElementById('c_reason').value
    };

    try {
      await ApiClient.post('proceedings', 'clearance', payload);
      alert('Clearance hold successfully applied!');
      closeClearanceModal();
      window.renderClearanceModule(container);
    } catch (err) {
      alert('Error applying clearance hold: ' + (err.message || 'Server error'));
    }
  };
};
