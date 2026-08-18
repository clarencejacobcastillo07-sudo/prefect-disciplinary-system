/**
 * Student Records Module (Development & Testing Source)
 * Prefect Disciplinary Action System — St. Agnes Academy
 * 
 * Allows authorized users to:
 * - View test students
 * - Search students by ID, LRN, Name, Grade, Section
 * - Add new test students
 * - Edit test student profiles & guardian contacts
 * - View comprehensive student standing & disciplinary summary
 * - Delete test student records
 */

window.renderStudentsModule = async function(container) {
  let students = [];
  let currentSearch = '';
  let currentGrade = '';

  try {
    const res = await ApiClient.get('students', 'list');
    students = res.data || [];
  } catch (e) {
    console.error('Error fetching students:', e);
    students = [];
  }

  const renderTable = (list) => {
    if (list.length === 0) {
      return `
        <tr>
          <td colspan="8" style="text-align:center; color:var(--text-muted); padding:35px;">
            <i class="fas fa-user-graduate fa-2x" style="margin-bottom:10px; opacity:0.4; display:block;"></i>
            No student records found matching your criteria.<br>
            Click <strong>"Add Test Student"</strong> to create a new test record.
          </td>
        </tr>
      `;
    }

    return list.map(s => {
      const pts = s.conduct_points !== undefined ? s.conduct_points : 100;
      const ptsColor = pts >= 90 ? 'var(--success)' : (pts >= 75 ? 'var(--warning)' : 'var(--danger)');
      const isCleared = s.clearance_status === 'Cleared';

      return `
        <tr>
          <td><code style="font-weight:700; color:var(--accent);">#${s.id}</code></td>
          <td><code>${s.lrn}</code></td>
          <td>
            <div style="display:flex; align-items:center; gap:10px;">
              <div style="width:32px; height:32px; border-radius:50%; background:linear-gradient(135deg,var(--primary),#2D1424); border:1.5px solid var(--accent); display:flex; align-items:center; justify-content:center; font-size:0.7rem; font-weight:800; color:#fff;">
                ${(s.first_name[0] + s.last_name[0]).toUpperCase()}
              </div>
              <div>
                <strong>${s.first_name} ${s.middle_name ? s.middle_name + ' ' : ''}${s.last_name}</strong>
                <div style="font-size:0.72rem; color:var(--text-muted);">${s.gender || 'Student'} • ${s.track_strand || 'General'}</div>
              </div>
            </div>
          </td>
          <td><strong>${s.grade_level}</strong> - ${s.section}</td>
          <td>
            <div>
              <strong style="color:${ptsColor}; font-size:0.95rem;">${pts} / 100</strong>
              <div style="background:rgba(255,255,255,0.08); height:5px; border-radius:3px; margin-top:3px; overflow:hidden; width:80px;">
                <div style="width:${Math.max(0, Math.min(100, pts))}%; height:100%; background:${ptsColor};"></div>
              </div>
            </div>
          </td>
          <td>
            <span class="badge ${pts >= 90 ? 'badge-success' : (pts >= 75 ? 'badge-warning' : 'badge-danger')}">
              ${s.status || 'Good Standing'}
            </span>
          </td>
          <td>
            <span class="badge ${isCleared ? 'badge-success' : 'badge-danger'}">
              <i class="fas ${isCleared ? 'fa-check' : 'fa-lock'}" style="margin-right:3px;"></i>${s.clearance_status || 'Cleared'}
            </span>
          </td>
          <td>
            <div style="display:flex; gap:6px;">
              <button class="btn btn-secondary btn-sm" title="View Profile & Disciplinary History" onclick='viewStudentDetails(${JSON.stringify(s).replace(/'/g, "&apos;")})'>
                <i class="fas fa-eye"></i>
              </button>
              <button class="btn btn-secondary btn-sm" title="Edit Student" onclick='openEditStudentModal(${JSON.stringify(s).replace(/'/g, "&apos;")})'>
                <i class="fas fa-edit"></i>
              </button>
              <button class="btn btn-secondary btn-sm" style="color:var(--danger);" title="Delete Student" onclick="deleteStudentRecord(${s.id}, '${s.first_name} ${s.last_name}')">
                <i class="fas fa-trash-alt"></i>
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  };

  container.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; flex-wrap:wrap; gap:12px;">
      <div>
        <h2 style="font-size:1.6rem; font-weight:800; color:var(--text-light); margin-bottom:4px;">
          <i class="fas fa-user-graduate" style="color:var(--accent); margin-right:8px;"></i>Student Records Management
        </h2>
        <p style="font-size:0.85rem; color:var(--text-muted);">
          Manage student test profiles, conduct standings, and guardian contact details for disciplinary proceedings.
        </p>
      </div>
      <div style="display:flex; gap:10px;">
        <button class="btn btn-primary" onclick="openAddStudentModal()">
          <i class="fas fa-user-plus"></i> Add Test Student
        </button>
      </div>
    </div>

    <!-- Filters & Search Toolbar -->
    <div style="background:var(--card-bg); border:1px solid var(--border-color); border-radius:var(--radius-md); padding:14px 18px; margin-bottom:20px; display:flex; gap:14px; align-items:center; flex-wrap:wrap;">
      <div style="flex:1; min-width:240px; position:relative;">
        <i class="fas fa-search" style="position:absolute; left:12px; top:50%; transform:translateY(-50%); color:var(--text-muted);"></i>
        <input type="text" id="student_list_search" placeholder="Search by LRN, Student ID, Name, Section..." 
          style="width:100%; padding-left:36px;" oninput="handleStudentListFilter()" />
      </div>
      <div style="width:180px;">
        <select id="student_grade_filter" onchange="handleStudentListFilter()">
          <option value="">All Grade Levels</option>
          <option value="Grade 7">Grade 7</option>
          <option value="Grade 8">Grade 8</option>
          <option value="Grade 9">Grade 9</option>
          <option value="Grade 10">Grade 10</option>
          <option value="Grade 11">Grade 11</option>
          <option value="Grade 12">Grade 12</option>
        </select>
      </div>
      <div style="width:180px;">
        <select id="student_clearance_filter" onchange="handleStudentListFilter()">
          <option value="">All Clearance Status</option>
          <option value="Cleared">Cleared</option>
          <option value="Hold">On Hold</option>
        </select>
      </div>
      <button class="btn btn-secondary" onclick="resetStudentFilters()">
        <i class="fas fa-undo"></i> Reset
      </button>
    </div>

    <!-- Student Table -->
    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th>DB ID</th>
            <th>LRN / Student ID</th>
            <th>Student Name</th>
            <th>Grade & Section</th>
            <th>Conduct Score</th>
            <th>Standing</th>
            <th>Clearance</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody id="studentRecordsTableBody">
          ${renderTable(students)}
        </tbody>
      </table>
    </div>

    <!-- Add / Edit Student Modal -->
    <div class="modal-overlay" id="studentFormModal">
      <div class="modal-content" style="max-width: 680px;">
        <div class="modal-header">
          <h3 id="studentFormModalTitle"><i class="fas fa-user-plus" style="color: var(--accent);"></i> Add Test Student Record</h3>
          <button style="background:none; border:none; font-size:1.4rem; color:var(--text-light); cursor:pointer;" onclick="closeStudentModal()">&times;</button>
        </div>
        <form id="studentRecordForm" onsubmit="handleStudentFormSubmit(event)">
          <input type="hidden" id="stu_edit_id" value="" />

          <div style="background:rgba(255,95,162,0.06); border:1px solid rgba(255,95,162,0.2); border-radius:var(--radius-sm); padding:10px 14px; margin-bottom:15px; font-size:0.82rem; color:var(--text-light);">
            <i class="fas fa-info-circle" style="color:var(--accent); margin-right:5px;"></i>
            <strong>Fictional Test Data:</strong> Use clearly fictional information only (e.g. 001, 002, 003). Do not enter real personal data.
          </div>

          <div style="display:grid; grid-template-columns: 1fr 1fr; gap:14px;">
            <div class="form-group">
              <label>Student ID / LRN <span style="color:var(--danger);">*</span></label>
              <input type="text" id="stu_lrn" placeholder="e.g. 001, 002, 003" required />
            </div>
            <div class="form-group">
              <label>Track / Strand</label>
              <input type="text" id="stu_strand" placeholder="e.g. Junior High, STEM, ABM, HUMSS" value="Junior High" />
            </div>
          </div>

          <div style="display:grid; grid-template-columns: 1fr 1fr 1fr; gap:14px;">
            <div class="form-group">
              <label>First Name <span style="color:var(--danger);">*</span></label>
              <input type="text" id="stu_first_name" placeholder="e.g. Johnmark" required />
            </div>
            <div class="form-group">
              <label>Middle Name</label>
              <input type="text" id="stu_middle_name" placeholder="e.g. Santos" />
            </div>
            <div class="form-group">
              <label>Last Name <span style="color:var(--danger);">*</span></label>
              <input type="text" id="stu_last_name" placeholder="e.g. Dela Cruz" required />
            </div>
          </div>

          <div style="display:grid; grid-template-columns: 1fr 1fr 1fr; gap:14px;">
            <div class="form-group">
              <label>Grade Level <span style="color:var(--danger);">*</span></label>
              <select id="stu_grade_level" required>
                <option value="Grade 7">Grade 7</option>
                <option value="Grade 8">Grade 8</option>
                <option value="Grade 9">Grade 9</option>
                <option value="Grade 10" selected>Grade 10</option>
                <option value="Grade 11">Grade 11</option>
                <option value="Grade 12">Grade 12</option>
              </select>
            </div>
            <div class="form-group">
              <label>Section <span style="color:var(--danger);">*</span></label>
              <input type="text" id="stu_section" placeholder="e.g. Section A" required />
            </div>
            <div class="form-group">
              <label>Gender</label>
              <select id="stu_gender">
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div style="margin-top:10px; border-top:1px solid var(--border-color); padding-top:14px;">
            <h4 style="font-size:0.95rem; font-weight:700; color:var(--text-light); margin-bottom:12px;">
              <i class="fas fa-user-shield" style="color:var(--accent);"></i> Parent / Guardian Contact Details
            </h4>
            
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:14px;">
              <div class="form-group">
                <label>Guardian Full Name</label>
                <input type="text" id="stu_guardian_name" placeholder="e.g. Mr. Eduardo Santos" />
              </div>
              <div class="form-group">
                <label>Relationship</label>
                <select id="stu_relationship">
                  <option value="Father">Father</option>
                  <option value="Mother">Mother</option>
                  <option value="Guardian">Guardian</option>
                  <option value="Relative">Relative</option>
                </select>
              </div>
            </div>

            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:14px;">
              <div class="form-group">
                <label>Contact Number (for SMS Alerts)</label>
                <input type="text" id="stu_guardian_phone" placeholder="e.g. 09170000001" />
              </div>
              <div class="form-group">
                <label>Email Address</label>
                <input type="email" id="stu_guardian_email" placeholder="e.g. guardian@test.com" />
              </div>
            </div>

            <div class="form-group">
              <label>Home Address</label>
              <input type="text" id="stu_guardian_address" placeholder="e.g. 123 Sampaguita St, Caloocan City" />
            </div>
          </div>

          <div style="display:flex; justify-content:flex-end; gap:10px; margin-top:20px; border-top:1px solid var(--border-color); padding-top:15px;">
            <button type="button" class="btn btn-secondary" onclick="closeStudentModal()">Cancel</button>
            <button type="submit" class="btn btn-primary" id="saveStudentBtn">
              <i class="fas fa-save"></i> Save Student Record
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Student Details Modal -->
    <div class="modal-overlay" id="studentDetailsModal">
      <div class="modal-content" style="max-width: 640px;">
        <div class="modal-header">
          <h3><i class="fas fa-id-card" style="color:var(--accent);"></i> Student Profile & Standing</h3>
          <button style="background:none; border:none; font-size:1.4rem; color:var(--text-light); cursor:pointer;" onclick="closeStudentDetailsModal()">&times;</button>
        </div>
        <div id="studentDetailsContent" style="padding-top:10px;">
          <!-- Dynamically populated -->
        </div>
        <div style="display:flex; justify-content:flex-end; margin-top:20px; border-top:1px solid var(--border-color); padding-top:15px;">
          <button type="button" class="btn btn-secondary" onclick="closeStudentDetailsModal()">Close</button>
        </div>
      </div>
    </div>
  `;

  // Student Filter Handler
  window.handleStudentListFilter = async () => {
    const q = document.getElementById('student_list_search')?.value || '';
    const grade = document.getElementById('student_grade_filter')?.value || '';
    const clearance = document.getElementById('student_clearance_filter')?.value || '';

    try {
      const res = await ApiClient.get('students', 'list', null, { search: q, grade_level: grade, clearance_status: clearance });
      const tableBody = document.getElementById('studentRecordsTableBody');
      if (tableBody) tableBody.innerHTML = renderTable(res.data || []);
    } catch (e) {
      console.error('Filter error:', e);
    }
  };

  window.resetStudentFilters = () => {
    const sInput = document.getElementById('student_list_search');
    const gFilter = document.getElementById('student_grade_filter');
    const cFilter = document.getElementById('student_clearance_filter');
    if (sInput) sInput.value = '';
    if (gFilter) gFilter.value = '';
    if (cFilter) cFilter.value = '';
    handleStudentListFilter();
  };

  // Modal Handlers
  window.openAddStudentModal = () => {
    document.getElementById('stu_edit_id').value = '';
    document.getElementById('studentFormModalTitle').innerHTML = `<i class="fas fa-user-plus" style="color:var(--accent);"></i> Add Test Student Record`;
    document.getElementById('studentRecordForm').reset();
    document.getElementById('studentFormModal').classList.add('active');
  };

  window.openEditStudentModal = (student) => {
    document.getElementById('stu_edit_id').value = student.id;
    document.getElementById('studentFormModalTitle').innerHTML = `<i class="fas fa-user-edit" style="color:var(--accent);"></i> Edit Student: ${student.first_name} ${student.last_name}`;
    
    document.getElementById('stu_lrn').value = student.lrn || '';
    document.getElementById('stu_strand').value = student.track_strand || 'Junior High';
    document.getElementById('stu_first_name').value = student.first_name || '';
    document.getElementById('stu_middle_name').value = student.middle_name || '';
    document.getElementById('stu_last_name').value = student.last_name || '';
    document.getElementById('stu_grade_level').value = student.grade_level || 'Grade 10';
    document.getElementById('stu_section').value = student.section || '';
    document.getElementById('stu_gender').value = student.gender || 'Male';

    document.getElementById('stu_guardian_name').value = student.guardian_name || '';
    document.getElementById('stu_relationship').value = student.relationship || 'Father';
    document.getElementById('stu_guardian_phone').value = student.guardian_phone || '';
    document.getElementById('stu_guardian_email').value = student.guardian_email || '';
    document.getElementById('stu_guardian_address').value = student.guardian_address || '';

    document.getElementById('studentFormModal').classList.add('active');
  };

  window.closeStudentModal = () => {
    const modal = document.getElementById('studentFormModal');
    if (modal) modal.classList.remove('active');
  };

  window.closeStudentDetailsModal = () => {
    const modal = document.getElementById('studentDetailsModal');
    if (modal) modal.classList.remove('active');
  };

  window.viewStudentDetails = (student) => {
    const content = document.getElementById('studentDetailsContent');
    if (!content) return;

    const pts = student.conduct_points !== undefined ? student.conduct_points : 100;
    const ptsColor = pts >= 90 ? 'var(--success)' : (pts >= 75 ? 'var(--warning)' : 'var(--danger)');

    content.innerHTML = `
      <div style="display:flex; align-items:center; gap:16px; margin-bottom:18px; background:rgba(255,255,255,0.03); padding:14px; border-radius:var(--radius-sm); border:1px solid var(--border-color);">
        <div style="width:52px; height:52px; border-radius:50%; background:linear-gradient(135deg,var(--primary),#2D1424); border:2px solid var(--accent); display:flex; align-items:center; justify-content:center; font-size:1.1rem; font-weight:800; color:#fff;">
          ${(student.first_name[0] + student.last_name[0]).toUpperCase()}
        </div>
        <div style="flex:1;">
          <h3 style="font-size:1.2rem; font-weight:800; margin-bottom:2px;">${student.first_name} ${student.middle_name ? student.middle_name + ' ' : ''}${student.last_name}</h3>
          <p style="font-size:0.85rem; color:var(--text-muted);">${student.grade_level} — ${student.section} • LRN / Student ID: <code>${student.lrn}</code></p>
        </div>
        <div style="text-align:right;">
          <strong style="font-size:1.3rem; color:${ptsColor};">${pts} pts</strong>
          <div style="font-size:0.75rem; color:var(--text-muted);">${student.status || 'Good Standing'}</div>
        </div>
      </div>

      <div style="display:grid; grid-template-columns: 1fr 1fr; gap:14px; font-size:0.85rem; margin-bottom:16px;">
        <div style="background:var(--input-bg); padding:10px 14px; border-radius:var(--radius-sm);">
          <span style="color:var(--text-muted); display:block; font-size:0.75rem;">Clearance Status</span>
          <strong style="color:${student.clearance_status === 'Cleared' ? 'var(--success)' : 'var(--danger)'};">
            ${student.clearance_status || 'Cleared'}
          </strong>
        </div>
        <div style="background:var(--input-bg); padding:10px 14px; border-radius:var(--radius-sm);">
          <span style="color:var(--text-muted); display:block; font-size:0.75rem;">Track & Strand</span>
          <strong>${student.track_strand || 'Junior High'}</strong>
        </div>
      </div>

      <div style="background:var(--input-bg); padding:14px; border-radius:var(--radius-sm); font-size:0.85rem; margin-bottom:18px;">
        <h4 style="font-size:0.88rem; font-weight:700; color:var(--text-light); margin-bottom:8px;">
          <i class="fas fa-phone-alt" style="color:var(--accent);"></i> Parent / Guardian Information
        </h4>
        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:8px;">
          <div><span style="color:var(--text-muted);">Guardian:</span> <strong>${student.guardian_name || 'Not Listed'}</strong> (${student.relationship || 'Parent'})</div>
          <div><span style="color:var(--text-muted);">Phone:</span> <code>${student.guardian_phone || 'None'}</code></div>
          <div><span style="color:var(--text-muted);">Email:</span> ${student.guardian_email || 'None'}</div>
          <div><span style="color:var(--text-muted);">Address:</span> ${student.guardian_address || 'None'}</div>
        </div>
      </div>

      <div style="background:rgba(255,95,162,0.05); border:1px solid rgba(255,95,162,0.15); border-radius:var(--radius-sm); padding:12px 14px;">
        <h4 style="font-size:0.85rem; font-weight:700; color:var(--accent); margin-bottom:8px;">
          <i class="fas fa-bolt"></i> Quick Disciplinary Actions for this Student
        </h4>
        <div style="display:flex; flex-wrap:wrap; gap:8px;">
          <button class="btn btn-primary btn-sm" onclick="closeStudentDetailsModal(); Router.navigate('infractions');">
            <i class="fas fa-edit"></i> Log Infraction
          </button>
          <button class="btn btn-secondary btn-sm" onclick="closeStudentDetailsModal(); Router.navigate('points');">
            <i class="fas fa-star"></i> Behavior Points
          </button>
          <button class="btn btn-secondary btn-sm" onclick="closeStudentDetailsModal(); Router.navigate('clearance');">
            <i class="fas fa-lock"></i> Clearance Hold
          </button>
          <button class="btn btn-secondary btn-sm" onclick="closeStudentDetailsModal(); Router.navigate('notifications');">
            <i class="fas fa-sms"></i> Send SMS Notice
          </button>
        </div>
      </div>
    `;

    document.getElementById('studentDetailsModal').classList.add('active');
  };

  // Submit Handler (Add / Edit)
  window.handleStudentFormSubmit = async (e) => {
    e.preventDefault();
    const btn = document.getElementById('saveStudentBtn');
    if (btn) btn.disabled = true;

    const editId = document.getElementById('stu_edit_id').value;
    const payload = {
      lrn: document.getElementById('stu_lrn').value.trim(),
      track_strand: document.getElementById('stu_strand').value.trim(),
      first_name: document.getElementById('stu_first_name').value.trim(),
      middle_name: document.getElementById('stu_middle_name').value.trim(),
      last_name: document.getElementById('stu_last_name').value.trim(),
      grade_level: document.getElementById('stu_grade_level').value,
      section: document.getElementById('stu_section').value.trim(),
      gender: document.getElementById('stu_gender').value,
      guardian_name: document.getElementById('stu_guardian_name').value.trim(),
      relationship: document.getElementById('stu_relationship').value,
      contact_number: document.getElementById('stu_guardian_phone').value.trim(),
      email: document.getElementById('stu_guardian_email').value.trim(),
      address: document.getElementById('stu_guardian_address').value.trim()
    };

    try {
      if (editId) {
        await ApiClient.post('students', 'update', payload, { id: editId });
        alert('Student profile updated successfully!');
      } else {
        await ApiClient.post('students', 'create', payload);
        alert('New test student record created successfully!');
      }
      closeStudentModal();
      window.renderStudentsModule(container);
    } catch (err) {
      alert('Unable to save student record: ' + (err.message || 'Server error'));
      if (btn) btn.disabled = false;
    }
  };

  // Delete Handler
  window.deleteStudentRecord = async (id, name) => {
    if (!confirm(`Are you sure you want to delete test student record "${name}" (ID: ${id})?\n\nThis will also remove any related test records.`)) {
      return;
    }

    try {
      await ApiClient.post('students', 'delete', {}, { id: id });
      alert(`Student record "${name}" deleted.`);
      window.renderStudentsModule(container);
    } catch (err) {
      alert('Unable to delete student record: ' + (err.message || 'Server error'));
    }
  };
};
