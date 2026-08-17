window.renderReformationModule = async function(container) {
  let programs = [];
  try {
    const res = await ApiClient.get('proceedings', 'reformation');
    programs = res.data || [];
  } catch (e) {
    programs = [
      { id: 1, first_name: 'Juan', last_name: 'Dela Cruz', lrn: '136123450001', grade_level: 'Grade 10', section: 'St. Thomas', program_title: 'Campus Eco-Cleanliness & Reflection', total_hours: 10, completed_hours: 6, status: 'In Progress', supervisor_name: 'Ms. Maria Teresa Cruz' },
      { id: 2, first_name: 'Mark Anthony', last_name: 'Bautista', lrn: '136123450003', grade_level: 'Grade 9', section: 'St. Lorenzo', program_title: 'Peer Sensitivity & Behavior Coaching', total_hours: 8, completed_hours: 2, status: 'In Progress', supervisor_name: 'Ms. Maria Teresa Cruz' }
    ];
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
            <th>Program Title</th>
            <th>Assigned Supervisor</th>
            <th>Progress (Hours)</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${programs.map(p => {
            const pct = Math.round((p.completed_hours / p.total_hours) * 100);
            return `
              <tr>
                <td><strong>${p.first_name} ${p.last_name}</strong></td>
                <td><code>${p.lrn}</code></td>
                <td>${p.program_title}</td>
                <td>${p.supervisor_name || 'Guidance Office'}</td>
                <td style="width:200px;">
                  <div style="font-size:0.78rem; margin-bottom:4px; font-weight:700;">${p.completed_hours} / ${p.total_hours} hrs (${pct}%)</div>
                  <div style="background:#E2E8F0; height:8px; border-radius:4px; overflow:hidden;">
                    <div style="background:var(--primary); width:${pct}%; height:100%;"></div>
                  </div>
                </td>
                <td><span class="badge badge-warning">${p.status}</span></td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    </div>

    <!-- Modal for Reformation -->
    <div class="modal-overlay" id="reformationModal">
      <div class="modal-content">
        <div class="modal-header">
          <h3>Assign Reformation Program</h3>
          <button style="background:none; border:none; font-size:1.2rem; cursor:pointer;" onclick="closeReformationModal()">&times;</button>
        </div>
        <form id="reformationForm" onsubmit="handleReformationSubmit(event)">
          <div class="form-group">
            <label>Student ID</label>
            <input type="number" id="r_student_id" placeholder="e.g. 1" required />
          </div>
          <div class="form-group">
            <label>Program Title</label>
            <input type="text" id="r_title" placeholder="e.g. Campus Library Community Service" required />
          </div>
          <div class="form-group">
            <label>Required Service / Counseling Hours</label>
            <input type="number" id="r_hours" min="1" max="100" value="10" required />
          </div>
          <div class="form-group">
            <label>Program Description & Objectives</label>
            <textarea id="r_description" rows="3" placeholder="Outline activities and reflection requirements..."></textarea>
          </div>
          <div style="display:flex; justify-content:flex-end; gap:10px; margin-top:20px;">
            <button type="button" class="btn btn-secondary" onclick="closeReformationModal()">Cancel</button>
            <button type="submit" class="btn btn-primary">Assign Program</button>
          </div>
        </form>
      </div>
    </div>
  `;

  window.openReformationModal = () => document.getElementById('reformationModal').classList.add('active');
  window.closeReformationModal = () => document.getElementById('reformationModal').classList.remove('active');

  window.handleReformationSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      student_id: document.getElementById('r_student_id').value,
      program_title: document.getElementById('r_title').value,
      total_hours: document.getElementById('r_hours').value,
      description: document.getElementById('r_description').value
    };

    try {
      await ApiClient.post('proceedings', 'reformation', payload);
      alert('Reformation program assigned!');
      closeReformationModal();
      Router.navigate('reformation');
    } catch (err) {
      alert('Error assigning program: ' + err.message);
    }
  };
};
