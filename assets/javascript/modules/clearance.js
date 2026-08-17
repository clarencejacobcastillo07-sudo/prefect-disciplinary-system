window.renderClearanceModule = async function(container) {
  let holds = [];
  try {
    const res = await ApiClient.get('proceedings', 'clearance');
    holds = res.data || [];
  } catch (e) {
    holds = [
      { id: 1, student_id: 1, first_name: 'Juan', last_name: 'Dela Cruz', lrn: '136123450001', grade_level: 'Grade 10', section: 'St. Thomas', hold_reason: 'Pending submission of signed Parent Conference Acknowledgment Slip', is_active: true },
      { id: 2, student_id: 3, first_name: 'Mark Anthony', last_name: 'Bautista', lrn: '136123450003', grade_level: 'Grade 9', section: 'St. Lorenzo', hold_reason: 'Active disciplinary investigation and scheduled hearing on August 5, 2026', is_active: true }
    ];
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
            <th>Hold Reason</th>
            <th>Flag Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${holds.map(h => `
            <tr>
              <td><strong>${h.first_name} ${h.last_name}</strong></td>
              <td><code>${h.lrn}</code></td>
              <td>${h.grade_level} - ${h.section}</td>
              <td style="max-width:300px;">${h.hold_reason}</td>
              <td><span class="badge ${h.is_active ? 'badge-danger' : 'badge-success'}">${h.is_active ? 'CLEARANCE BLOCKED' : 'RELEASED'}</span></td>
              <td>
                ${h.is_active ? `
                  <button class="btn btn-secondary btn-sm" style="color:var(--success);" onclick="toggleHold(${h.student_id}, false)">
                    <i class="fas fa-check-circle"></i> Release Hold
                  </button>
                ` : `<span style="font-size:0.8rem; color:var(--text-muted);">Cleared</span>`}
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>

    <!-- Modal for Clearance Hold -->
    <div class="modal-overlay" id="clearanceModal">
      <div class="modal-content">
        <div class="modal-header">
          <h3>Flag Student Clearance Hold</h3>
          <button style="background:none; border:none; font-size:1.2rem; cursor:pointer;" onclick="closeClearanceModal()">&times;</button>
        </div>
        <form id="clearanceForm" onsubmit="handleClearanceSubmit(event)">
          <div class="form-group">
            <label>Student ID</label>
            <input type="number" id="c_student_id" placeholder="e.g. 1" required />
          </div>
          <div class="form-group">
            <label>Hold Reason & Instructions</label>
            <textarea id="c_reason" rows="3" placeholder="State reason for blocking clearance..." required></textarea>
          </div>
          <div style="display:flex; justify-content:flex-end; gap:10px; margin-top:20px;">
            <button type="button" class="btn btn-secondary" onclick="closeClearanceModal()">Cancel</button>
            <button type="submit" class="btn btn-primary"><i class="fas fa-lock"></i> Apply Clearance Hold</button>
          </div>
        </form>
      </div>
    </div>
  `;

  window.openClearanceModal = () => document.getElementById('clearanceModal').classList.add('active');
  window.closeClearanceModal = () => document.getElementById('clearanceModal').classList.remove('active');

  window.toggleHold = async (studentId, holdStatus) => {
    try {
      await ApiClient.post('proceedings', 'clearance', { student_id: studentId, hold: holdStatus });
      alert('Clearance status updated!');
      Router.navigate('clearance');
    } catch (err) {
      alert('Error updating clearance: ' + err.message);
    }
  };

  window.handleClearanceSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      student_id: document.getElementById('c_student_id').value,
      hold: true,
      reason: document.getElementById('c_reason').value
    };

    try {
      await ApiClient.post('proceedings', 'clearance', payload);
      alert('Clearance hold applied!');
      closeClearanceModal();
      Router.navigate('clearance');
    } catch (err) {
      alert('Error applying hold: ' + err.message);
    }
  };
};
