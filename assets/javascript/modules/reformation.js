/**
 * Reformation Program Assignment Module
 * Prefect Disciplinary Action System — St. Agnes Academy
 */

window.renderReformationModule = async function(container) {
  let programs = [];
  let incidents = [];
  let selectedStudent = null;
  let searchTimeout = null;

  try {
    const [rRes, iRes] = await Promise.all([
      ApiClient.get('proceedings', 'reformation'),
      ApiClient.get('incidents')
    ]);
    programs = rRes.data || [];
    incidents = iRes.data || [];
  } catch (e) {
    console.error('Error fetching reformation programs:', e);
    programs = [];
    incidents = [];
  }

  container.innerHTML = `
    <div class="table-container">
      <div class="table-header">
        <div>
          <h3><i class="fas fa-hands-helping" style="color: var(--primary);"></i> Reformation Program Assignment</h3>
          <p style="font-size: 0.8rem; color: var(--text-muted); margin-top:2px;">Assign counseling, community service, and rehabilitation modules for student growth.</p>
        </div>
        <button class="btn btn-primary" onclick="openReformationModal()">
          <i class="fas fa-plus-circle"></i> Assign Reformation Program
        </button>
      </div>
      <table>
        <thead>
          <tr>
            <th>Student Name</th>
            <th>LRN</th>
            <th>Grade & Section</th>
            <th>Program Title</th>
            <th>Assigned Supervisor</th>
            <th>Progress (Hours)</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody id="reformationTableBody">
          ${programs.length === 0 ? `
            <tr>
              <td colspan="8" style="text-align:center; color:var(--text-muted); padding:35px;">
                <i class="fas fa-hands-helping fa-2x" style="margin-bottom:10px; opacity:0.4; display:block;"></i>
                No reformation programs assigned yet.<br>
                Click <strong>"Assign Reformation Program"</strong> to assign counseling or community service to a student.
              </td>
            </tr>
          ` : programs.map(p => {
            const pct = Math.min(100, Math.round((p.completed_hours / (p.total_hours || 1)) * 100));
            return `
              <tr>
                <td><strong>${p.first_name} ${p.last_name}</strong></td>
                <td><code>${p.lrn || '-'}</code></td>
                <td>${p.grade_level} - ${p.section}</td>
                <td><strong>${p.program_title}</strong></td>
                <td style="font-size:0.8rem;">${p.supervisor_name || 'Guidance Office'}</td>
                <td style="width:200px;">
                  <div style="font-size:0.78rem; margin-bottom:4px; font-weight:700;">${p.completed_hours} / ${p.total_hours} hrs (${pct}%)</div>
                  <div style="background:rgba(255,255,255,0.08); height:6px; border-radius:3px; overflow:hidden;">
                    <div style="background:${pct >= 100 ? 'var(--success)' : 'var(--accent)'}; width:${pct}%; height:100%;"></div>
                  </div>
                </td>
                <td>
                  <span class="badge ${p.status === 'Completed' ? 'badge-success' : (p.status === 'In Progress' ? 'badge-warning' : 'badge-primary')}">
                    ${p.status}
                  </span>
                </td>
                <td>
                  <button class="btn btn-secondary btn-sm" title="Update Hours / Status" onclick='openUpdateReformationModal(${JSON.stringify(p).replace(/'/g, "&apos;")})'>
                    <i class="fas fa-edit"></i>
                  </button>
                </td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    </div>

    <!-- Modal for Assigning Reformation -->
    <div class="modal-overlay" id="reformationModal">
      <div class="modal-content" style="max-width:680px;">
        <div class="modal-header">
          <h3><i class="fas fa-hands-helping" style="color:var(--accent);"></i> Assign Reformation Program</h3>
          <button style="background:none; border:none; font-size:1.4rem; color:var(--text-light); cursor:pointer;" onclick="closeReformationModal()">&times;</button>
        </div>
        <form id="reformationForm" onsubmit="handleReformationSubmit(event)">
          
          <!-- Student Search & Selection -->
          <div class="form-group">
            <label>Select Student <span style="color:var(--danger);">*</span></label>
            <input type="hidden" id="r_student_id" value="" />

            <div id="reformation_student_search_container">
              <div class="student-lookup-box">
                <div class="student-search-input-wrap">
                  <i class="fas fa-search"></i>
                  <input type="text" id="reformation_student_search_query" placeholder="Search Student ID (e.g. 001), LRN, or Name..." oninput="handleReformationStudentSearch(this.value)" autocomplete="off" />
                </div>
                <button type="button" class="btn btn-secondary" onclick="triggerReformationStudentSearch()">Search</button>
              </div>
              <div id="reformation_student_search_status" style="margin-top: 6px;"></div>
            </div>

            <!-- Selected Student Card -->
            <div id="reformation_selected_student_display" style="display: none;" class="selected-student-card">
              <div class="selected-student-header">
                <h4><i class="fas fa-user-check"></i> Selected Student</h4>
                <button type="button" class="btn btn-secondary btn-sm" onclick="clearReformationStudent()">Change</button>
              </div>
              <div class="selected-student-grid">
                <div class="selected-student-field">
                  <span class="label">ID / LRN</span>
                  <span class="value" id="r_sel_lrn">-</span>
                </div>
                <div class="selected-student-field">
                  <span class="label">Name</span>
                  <span class="value" id="r_sel_name">-</span>
                </div>
                <div class="selected-student-field">
                  <span class="label">Grade & Section</span>
                  <span class="value" id="r_sel_grade">-</span>
                </div>
                <div class="selected-student-field">
                  <span class="label">Guardian</span>
                  <span class="value" id="r_sel_guardian">-</span>
                </div>
              </div>
            </div>
          </div>

          <div class="form-group">
            <label>Program Title <span style="color:var(--danger);">*</span></label>
            <input type="text" id="r_title" placeholder="e.g. Campus Library Community Service & Reflection" required />
          </div>

          <div class="form-group">
            <label>Required Service / Counseling Hours <span style="color:var(--danger);">*</span></label>
            <input type="number" id="r_hours" min="1" max="100" value="10" required />
          </div>

          <div class="form-group">
            <label>Program Description & Objectives</label>
            <textarea id="r_description" rows="3" placeholder="Outline corrective tasks, counseling schedule, and reflection requirements..."></textarea>
          </div>

          <div style="display:flex; justify-content:flex-end; gap:10px; margin-top:20px; border-top:1px solid var(--border-color); padding-top:15px;">
            <button type="button" class="btn btn-secondary" onclick="closeReformationModal()">Cancel</button>
            <button type="submit" class="btn btn-primary" id="saveReformationBtn">
              <i class="fas fa-check"></i> Assign Program
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal for Updating Reformation Progress -->
    <div class="modal-overlay" id="updateReformationModal">
      <div class="modal-content" style="max-width:500px;">
        <div class="modal-header">
          <h3><i class="fas fa-edit" style="color:var(--accent);"></i> Update Reformation Progress</h3>
          <button style="background:none; border:none; font-size:1.4rem; color:var(--text-light); cursor:pointer;" onclick="closeUpdateReformationModal()">&times;</button>
        </div>
        <form id="updateReformationForm" onsubmit="handleUpdateReformationSubmit(event)">
          <input type="hidden" id="edit_reformation_id" value="" />
          <div class="form-group">
            <label>Completed Hours</label>
            <input type="number" id="edit_ref_completed_hours" min="0" required />
          </div>
          <div class="form-group">
            <label>Status</label>
            <select id="edit_ref_status" required>
              <option value="Assigned">Assigned</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
              <option value="Incomplete">Incomplete</option>
            </select>
          </div>
          <div class="form-group">
            <label>Completion Date (if completed)</label>
            <input type="date" id="edit_ref_completion_date" />
          </div>
          <div style="display:flex; justify-content:flex-end; gap:10px; margin-top:20px; border-top:1px solid var(--border-color); padding-top:15px;">
            <button type="button" class="btn btn-secondary" onclick="closeUpdateReformationModal()">Cancel</button>
            <button type="submit" class="btn btn-primary">Save Progress</button>
          </div>
        </form>
      </div>
    </div>
  `;

  // Student Search Handling
  window.handleReformationStudentSearch = (query) => {
    if (searchTimeout) clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => performReformationStudentSearch(query), 300);
  };

  window.triggerReformationStudentSearch = () => {
    const q = document.getElementById('reformation_student_search_query').value;
    performReformationStudentSearch(q);
  };

  window.performReformationStudentSearch = async (query) => {
    const area = document.getElementById('reformation_student_search_status');
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
                   onclick='selectReformationStudent(${JSON.stringify(s).replace(/'/g, "&apos;")})'>
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

  window.selectReformationStudent = (student) => {
    selectedStudent = student;
    document.getElementById('r_student_id').value = student.id;
    document.getElementById('r_sel_lrn').textContent = student.lrn;
    document.getElementById('r_sel_name').textContent = `${student.first_name} ${student.last_name}`;
    document.getElementById('r_sel_grade').textContent = `${student.grade_level} - ${student.section}`;
    document.getElementById('r_sel_guardian').textContent = student.guardian_name ? `${student.guardian_name} (${student.guardian_phone || 'No phone'})` : 'None';

    document.getElementById('reformation_student_search_container').style.display = 'none';
    document.getElementById('reformation_selected_student_display').style.display = 'block';
  };

  window.clearReformationStudent = () => {
    selectedStudent = null;
    document.getElementById('r_student_id').value = '';
    document.getElementById('reformation_student_search_container').style.display = 'block';
    document.getElementById('reformation_selected_student_display').style.display = 'none';
    document.getElementById('reformation_student_search_query').value = '';
    document.getElementById('reformation_student_search_status').innerHTML = '';
  };

  window.openReformationModal = () => {
    clearReformationStudent();
    document.getElementById('reformationForm').reset();
    document.getElementById('reformationModal').classList.add('active');
    performReformationStudentSearch('');
  };

  window.closeReformationModal = () => document.getElementById('reformationModal').classList.remove('active');

  window.openUpdateReformationModal = (p) => {
    document.getElementById('edit_reformation_id').value = p.id;
    document.getElementById('edit_ref_completed_hours').value = p.completed_hours || 0;
    document.getElementById('edit_ref_status').value = p.status || 'In Progress';
    document.getElementById('edit_ref_completion_date').value = p.completion_date || '';
    document.getElementById('updateReformationModal').classList.add('active');
  };

  window.closeUpdateReformationModal = () => document.getElementById('updateReformationModal').classList.remove('active');

  window.handleReformationSubmit = async (e) => {
    e.preventDefault();
    const studentId = document.getElementById('r_student_id').value;
    if (!studentId) {
      alert('Please search and select a student.');
      return;
    }

    const payload = {
      student_id: parseInt(studentId, 10),
      program_title: document.getElementById('r_title').value.trim(),
      total_hours: parseInt(document.getElementById('r_hours').value, 10),
      description: document.getElementById('r_description').value.trim()
    };

    try {
      await ApiClient.post('proceedings', 'reformation', payload);
      alert('Reformation program assigned successfully!');
      closeReformationModal();
      window.renderReformationModule(container);
    } catch (err) {
      alert('Error assigning program: ' + (err.message || 'Server error'));
    }
  };

  window.handleUpdateReformationSubmit = async (e) => {
    e.preventDefault();
    const id = document.getElementById('edit_reformation_id').value;
    const payload = {
      completed_hours: parseInt(document.getElementById('edit_ref_completed_hours').value, 10),
      status: document.getElementById('edit_ref_status').value,
      completion_date: document.getElementById('edit_ref_completion_date').value || null
    };

    try {
      await ApiClient.post('proceedings', 'reformation', payload, { id: id });
      alert('Reformation progress updated!');
      closeUpdateReformationModal();
      window.renderReformationModule(container);
    } catch (err) {
      alert('Error updating program: ' + (err.message || 'Server error'));
    }
  };
};
