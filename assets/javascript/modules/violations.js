window.renderViolationsModule = async function(container) {
  let violations = [];
  try {
    const res = await ApiClient.get('incidents', 'violations');
    violations = res.data || [];
  } catch (e) {
    violations = [
      { id: 1, code: 'V-MIN-001', title: 'Tardiness', category: 'Minor', demerit_points: 3, recommended_sanction: 'Verbal Warning' },
      { id: 2, code: 'V-MIN-002', title: 'Improper Uniform', category: 'Minor', demerit_points: 5, recommended_sanction: 'Written Warning' },
      { id: 3, code: 'V-MAJ-001', title: 'Cutting Classes / Truancy', category: 'Major', demerit_points: 15, recommended_sanction: '1-Day In-School Suspension' },
      { id: 4, code: 'V-MAJ-003', title: 'Bullying / Harassment', category: 'Major', demerit_points: 25, recommended_sanction: 'Formal Hearing' },
      { id: 5, code: 'V-SEV-002', title: 'Brawling / Physical Assault', category: 'Severe', demerit_points: 40, recommended_sanction: 'Indefinite Suspension & Hearing Board' }
    ];
  }

  container.innerHTML = `
    <div class="table-container">
      <div class="table-header">
        <div>
          <h3><i class="fas fa-gavel" style="color: var(--primary);"></i> Violation Offense Setup & Point Thresholds</h3>
          <p style="font-size: 0.8rem; color: var(--text-muted); margin-top:2px;">Define offense classification taxonomy and standard demerit point penalties.</p>
        </div>
        <button class="btn btn-primary" onclick="openViolationModal()">
          <i class="fas fa-plus-circle"></i> Add Offense Category
        </button>
      </div>
      <table>
        <thead>
          <tr>
            <th>Code</th>
            <th>Title</th>
            <th>Category</th>
            <th>Demerit Penalty</th>
            <th>Recommended Sanction</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${violations.map(v => `
            <tr>
              <td><code><strong>${v.code}</strong></code></td>
              <td>${v.title}</td>
              <td><span class="badge ${v.category === 'Severe' ? 'badge-danger' : (v.category === 'Major' ? 'badge-warning' : 'badge-primary')}">${v.category}</span></td>
              <td><strong style="color: var(--primary);">-${v.demerit_points} pts</strong></td>
              <td>${v.recommended_sanction}</td>
              <td>
                <button class="btn btn-secondary btn-sm" onclick="alert('Editing violation ${v.code}')"><i class="fas fa-edit"></i></button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>

    <!-- Modal for Adding Violation -->
    <div class="modal-overlay" id="violationModal">
      <div class="modal-content">
        <div class="modal-header">
          <h3>Create Violation Offense Category</h3>
          <button style="background:none; border:none; font-size:1.2rem; cursor:pointer;" onclick="closeViolationModal()">&times;</button>
        </div>
        <form id="violationForm" onsubmit="handleViolationSubmit(event)">
          <div class="form-group">
            <label>Offense Code</label>
            <input type="text" id="v_code" placeholder="e.g. V-MAJ-004" required />
          </div>
          <div class="form-group">
            <label>Offense Title</label>
            <input type="text" id="v_title" placeholder="e.g. Smoking / Vaping inside campus" required />
          </div>
          <div class="form-group">
            <label>Severity Category</label>
            <select id="v_category" required>
              <option value="Minor">Minor Offense</option>
              <option value="Major">Major Offense</option>
              <option value="Severe">Severe Offense</option>
            </select>
          </div>
          <div class="form-group">
            <label>Demerit Point Value</label>
            <input type="number" id="v_points" min="1" max="50" value="10" required />
          </div>
          <div class="form-group">
            <label>Recommended Sanction</label>
            <input type="text" id="v_sanction" placeholder="e.g. 2-Day Suspension & Parent Notice" required />
          </div>
          <div style="display:flex; justify-content:flex-end; gap:10px; margin-top:20px;">
            <button type="button" class="btn btn-secondary" onclick="closeViolationModal()">Cancel</button>
            <button type="submit" class="btn btn-primary">Save Category</button>
          </div>
        </form>
      </div>
    </div>
  `;

  window.openViolationModal = () => document.getElementById('violationModal').classList.add('active');
  window.closeViolationModal = () => document.getElementById('violationModal').classList.remove('active');

  window.handleViolationSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      code: document.getElementById('v_code').value,
      title: document.getElementById('v_title').value,
      category: document.getElementById('v_category').value,
      demerit_points: document.getElementById('v_points').value,
      recommended_sanction: document.getElementById('v_sanction').value
    };

    try {
      await ApiClient.post('incidents', 'violations', payload);
      alert('Violation category created!');
      closeViolationModal();
      Router.navigate('violations');
    } catch (err) {
      alert('Error creating violation: ' + err.message);
    }
  };
};
