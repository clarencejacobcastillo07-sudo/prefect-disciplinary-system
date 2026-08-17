/**
 * Global Header Search Implementation
 * System: Prefect Disciplinary Action System
 * Searches across Student Records Service and Incident Management Service
 */

const GlobalSearch = {
  debounceTimeout: null,

  init() {
    const input = document.getElementById('globalSearchInput');
    const container = document.getElementById('globalSearchContainer');
    const dropdown = document.getElementById('globalSearchResults');

    if (!input || !dropdown) return;

    // Typing listener with debouncing (300ms)
    input.addEventListener('input', (e) => {
      const query = e.target.value.trim();
      if (this.debounceTimeout) clearTimeout(this.debounceTimeout);

      if (query.length < 2) {
        this.close();
        return;
      }

      this.debounceTimeout = setTimeout(() => {
        this.performSearch(query);
      }, 300);
    });

    // Keyboard listener for Enter and Escape
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        const query = input.value.trim();
        if (query.length >= 2) {
          if (this.debounceTimeout) clearTimeout(this.debounceTimeout);
          this.performSearch(query);
        }
      } else if (e.key === 'Escape') {
        this.close();
        input.blur();
      }
    });

    // Close dropdown on click outside
    document.addEventListener('click', (e) => {
      if (container && !container.contains(e.target)) {
        this.close();
      }
    });
  },

  close() {
    const dropdown = document.getElementById('globalSearchResults');
    if (dropdown) {
      dropdown.style.display = 'none';
      dropdown.innerHTML = '';
    }
  },

  async performSearch(query) {
    const dropdown = document.getElementById('globalSearchResults');
    if (!dropdown) return;

    dropdown.style.display = 'block';
    dropdown.innerHTML = `
      <div style="padding: 16px; text-align: center; color: var(--text-muted); font-size: 0.85rem;">
        <i class="fas fa-circle-notch fa-spin" style="color: var(--accent);"></i> Searching...
      </div>
    `;

    // Execute both searches independently so one failure does not mask the other
    let students = null;
    let incidents = null;
    let studentError = null;
    let incidentError = null;

    const [studentsResult, incidentsResult] = await Promise.allSettled([
      ApiClient.get('students', 'list', null, { search: query }),
      ApiClient.get('incidents', '', null, { search: query })
    ]);

    if (studentsResult.status === 'fulfilled') {
      students = studentsResult.value?.data ?? [];
    } else {
      studentError = studentsResult.reason?.message || 'Request failed';
    }

    if (incidentsResult.status === 'fulfilled') {
      incidents = incidentsResult.value?.data ?? [];
    } else {
      incidentError = incidentsResult.reason?.message || 'Request failed';
    }

    // If both requests failed → show global error
    if (studentError !== null && incidentError !== null) {
      dropdown.innerHTML = `
        <div style="padding: 16px; text-align: center; color: var(--danger); font-size: 0.85rem;">
          <i class="fas fa-exclamation-circle"></i> Unable to complete search. Please try again.
        </div>
      `;
      return;
    }

    const hasStudents  = students !== null && students.length > 0;
    const hasIncidents = incidents !== null && incidents.length > 0;

    // Both succeeded but zero results → show "no results"
    if (!hasStudents && !hasIncidents && studentError === null && incidentError === null) {
      dropdown.innerHTML = `
        <div style="padding: 16px; text-align: center; color: var(--text-muted); font-size: 0.85rem;">
          <i class="fas fa-search" style="opacity: 0.5; margin-bottom: 6px; display: block; font-size: 1.2rem;"></i>
          No results found for "<strong>${this.escapeHtml(query)}</strong>".
        </div>
      `;
      return;
    }

    let html = '';

    // Render Student results (or student error section)
    if (studentError !== null) {
      html += `
        <div class="global-search-category">
          <div class="global-search-category-title">
            <i class="fas fa-user-graduate"></i> STUDENTS
          </div>
          <div style="padding: 10px 16px; font-size: 0.82rem; color: var(--danger);">
            <i class="fas fa-exclamation-circle"></i> Student search unavailable. Please try again.
          </div>
        </div>
      `;
    } else if (hasStudents) {
      html += `
        <div class="global-search-category">
          <div class="global-search-category-title">
            <i class="fas fa-user-graduate"></i> STUDENTS (${students.length})
          </div>
          ${students.slice(0, 5).map(s => `
            <div class="global-search-item" onclick="GlobalSearch.selectStudent(${s.id}, '${this.escapeHtml(s.first_name)} ${this.escapeHtml(s.last_name)}', '${s.lrn}')">
              <div class="global-search-icon student"><i class="fas fa-user"></i></div>
              <div class="global-search-info">
                <div class="title">${this.escapeHtml(s.first_name)} ${this.escapeHtml(s.last_name)}</div>
                <div class="sub">LRN: <code>${s.lrn}</code> &bull; ${this.escapeHtml(s.grade_level)} - ${this.escapeHtml(s.section)}</div>
              </div>
            </div>
          `).join('')}
        </div>
      `;
    }

    // Render Incident results (or incident error section)
    if (incidentError !== null) {
      html += `
        <div class="global-search-category">
          <div class="global-search-category-title">
            <i class="fas fa-exclamation-triangle"></i> INCIDENTS
          </div>
          <div style="padding: 10px 16px; font-size: 0.82rem; color: var(--danger);">
            <i class="fas fa-exclamation-circle"></i> Incident search unavailable. Please try again.
          </div>
        </div>
      `;
    } else if (hasIncidents) {
      html += `
        <div class="global-search-category">
          <div class="global-search-category-title">
            <i class="fas fa-exclamation-triangle"></i> INCIDENTS (${incidents.length})
          </div>
          ${incidents.slice(0, 5).map(i => `
            <div class="global-search-item" onclick="GlobalSearch.selectIncident(${i.id}, '${this.escapeHtml(i.incident_number)}')">
              <div class="global-search-icon incident"><i class="fas fa-file-alt"></i></div>
              <div class="global-search-info">
                <div class="title">${this.escapeHtml(i.incident_number)} &mdash; ${this.escapeHtml(i.violation_title || 'Offense')}</div>
                <div class="sub">Student: ${this.escapeHtml(i.first_name)} ${this.escapeHtml(i.last_name)} &bull; Status: <span class="badge badge-sm badge-warning">${this.escapeHtml(i.status || 'Pending')}</span></div>
              </div>
            </div>
          `).join('')}
        </div>
      `;
    }

    dropdown.innerHTML = html;
  },

  escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  },

  selectStudent(studentId, studentName, lrn) {
    this.close();
    // Navigate to Infraction Logging module
    if (typeof Router !== 'undefined') {
      Router.navigate('infractions');
    }
    // Open modal and pre-fill search in Infraction Logging
    setTimeout(() => {
      if (window.openLogIncidentModal) {
        window.openLogIncidentModal();
        if (window.performStudentSearch) {
          window.performStudentSearch(lrn || studentName);
        }
      }
    }, 200);
  },

  selectIncident(incidentId, incidentNumber) {
    this.close();
    // Navigate to Infraction Logging module
    if (typeof Router !== 'undefined') {
      Router.navigate('infractions');
    }
    setTimeout(() => {
      alert(`Incident Record Selected:\nIncident No: ${incidentNumber}\nID: ${incidentId}\nViewing incident record details.`);
    }, 200);
  }
};

window.GlobalSearch = GlobalSearch;
