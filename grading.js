
    (() => {
      // Cached DOM elements
      const schoolInput = document.getElementById('schoolName');
      const classInput = document.getElementById('className');
      const addSubjectBtn = document.getElementById('addSubjectBtn');
      const addStudentBtn = document.getElementById('addStudentBtn');
      const calculateBtn = document.getElementById('calculateBtn');
      const marksTable = document.getElementById('marksTable');
      const theadRow = marksTable.querySelector('thead tr');
      const tbody = marksTable.querySelector('tbody');
      const outputDiv = document.getElementById('output');

      // Modal elements
      const subjectModal = document.getElementById('subjectModalBackdrop');
      const subjectNameInput = document.getElementById('subjectNameInput');
      const subjectError = document.getElementById('subjectError');
      const subjectAddBtn = document.getElementById('subjectAddBtn');
      const subjectCancelBtn = document.getElementById('subjectCancelBtn');

      const studentModal = document.getElementById('studentModalBackdrop');
      const studentNameInput = document.getElementById('studentNameInput');
      const studentError = document.getElementById('studentError');
      const studentAddBtn = document.getElementById('studentAddBtn');
      const studentCancelBtn = document.getElementById('studentCancelBtn');

      // State variables
      let subjects = []; // Array of subject names
      let students = []; // Array of student objects: {name, marks: []}

      // Utility to sanitize text input for table display
      function sanitizeText(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
      }

      // Helper: Create input cell for student row
      function createMarkInputCell(subjectIndex, initialValue = '') {
        const td = document.createElement('td');
        const input = document.createElement('input');
        input.type = 'number';
        input.min = 0;
        input.max = 100;
        input.step = 1;
        input.placeholder = '0-100';
        input.value = initialValue;
        input.setAttribute('aria-label', `Mark for ${subjects[subjectIndex]}`);
        input.addEventListener('input', () => {
          // Clamp values 0-100
          if (input.value === '') return; // allow blank for now
          let val = Number(input.value);
          if (val < 0) input.value = 0;
          else if (val > 100) input.value = 100;
        });
        td.appendChild(input);
        return td;
      }

      // Helper: Create name input cell for student row
      function createNameInputCell(initialValue = '') {
        const td = document.createElement('td');
        const input = document.createElement('input');
        input.type = 'text';
        input.placeholder = 'Student Name';
        input.value = initialValue;
        input.setAttribute('aria-label', 'Student Name');
        td.appendChild(input);
        return td;
      }

      // Rebuild the main input table headers & body based on current state
      function rebuildMarksTable() {
        // Clear header except first cell
        while (theadRow.cells.length > 1) {
          theadRow.removeChild(theadRow.lastChild);
        }
        // Append subject headers
        subjects.forEach(subj => {
          const th = document.createElement('th');
          th.textContent = subj;
          theadRow.appendChild(th);
        });

        // Clear tbody rows
        tbody.innerHTML = '';

        // Create rows for students
        students.forEach(student => {
          const row = document.createElement('tr');
          // Name cell
          const nameCell = createNameInputCell(student.name);
          row.appendChild(nameCell);

          // Marks cells
          subjects.forEach((_, subjIndex) => {
            const markValue = student.marks[subjIndex] !== undefined ? student.marks[subjIndex] : '';
            const markCell = createMarkInputCell(subjIndex, markValue);
            row.appendChild(markCell);
          });

          tbody.appendChild(row);
        });
      }

      // Validate new subject name (not empty, unique)
      function validateSubjectName(name) {
        if (!name.trim()) return 'Subject name cannot be empty.';
        if (subjects.includes(name.trim())) return 'Subject already exists.';
        return null;
      }
      // Validate new student name (not empty, unique)
      function validateStudentName(name) {
        if (!name.trim()) return 'Student name cannot be empty.';
        if (students.some(s => s.name.toLowerCase() === name.trim().toLowerCase())) return 'Student already exists.';
        return null;
      }

      // Show modal helper
      function showModal(modal) {
        modal.classList.add('active');
        modal.setAttribute('aria-hidden', 'false');
        // Focus first input inside modal
        const firstInput = modal.querySelector('input');
        if (firstInput) {
          setTimeout(() => firstInput.focus(), 100);
        }
      }
      // Hide modal helper
      function hideModal(modal) {
        modal.classList.remove('active');
        modal.setAttribute('aria-hidden', 'true');
      }

      // Add Subject Modal Logic
      addSubjectBtn.addEventListener('click', () => {
        subjectNameInput.value = '';
        subjectError.textContent = '';
        showModal(subjectModal);
      });
      subjectCancelBtn.addEventListener('click', () => {
        hideModal(subjectModal);
      });
      subjectAddBtn.addEventListener('click', () => {
        const name = subjectNameInput.value.trim();
        const error = validateSubjectName(name);
        if (error) {
          subjectError.textContent = error;
          subjectNameInput.focus();
          return;
        }
        subjects.push(name);
        // Add default marks (empty) for new subject to all students
        students.forEach(s => s.marks.push(''));
        rebuildMarksTable();
        hideModal(subjectModal);
      });
      subjectNameInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') subjectAddBtn.click();
        if (e.key === 'Escape') hideModal(subjectModal);
      });

      // Add Student Modal Logic
      addStudentBtn.addEventListener('click', () => {
        studentNameInput.value = '';
        studentError.textContent = '';
        showModal(studentModal);
      });
      studentCancelBtn.addEventListener('click', () => {
        hideModal(studentModal);
      });
      studentAddBtn.addEventListener('click', () => {
        const name = studentNameInput.value.trim();
        const error = validateStudentName(name);
        if (error) {
          studentError.textContent = error;
          studentNameInput.focus();
          return;
        }
        // Add student with empty marks for each subject
        students.push({ name, marks: Array(subjects.length).fill('') });
        rebuildMarksTable();
        hideModal(studentModal);
      });
      studentNameInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') studentAddBtn.click();
        if (e.key === 'Escape') hideModal(studentModal);
      });

      // Extract and update student & marks from input table before calculation
      function syncInputTableToData() {
        students = [];
        const rows = tbody.querySelectorAll('tr');
        rows.forEach(row => {
          const cells = row.querySelectorAll('td');
          const nameInput = cells[0].querySelector('input');
          const studentName = nameInput.value.trim();
          if (!studentName) return; // skip empty rows

          // Validate student name uniqueness within inputs
          if (students.some(s => s.name.toLowerCase() === studentName.toLowerCase())) {
            // Skip duplicates to avoid confusion
            return;
          }

          const marks = [];
          for (let i = 1; i < cells.length; i++) {
            const markInput = cells[i].querySelector('input');
            let val = markInput.value.trim();
            if (val === '') {
              marks.push(null);
            } else {
              const n = Number(val);
              marks.push(isNaN(n) || n < 0 ? null : (n > 100 ? 100 : n));
            }
          }
          students.push({ name: studentName, marks });
        });
      }

      // Grade calculation helper
      function getGrade(average) {
        if (average === null || isNaN(average)) return '-';
        if (average >= 90) return 'A';
        if (average >= 80) return 'B';
        if (average >= 70) return 'C';
        if (average >= 60) return 'D';
        return 'F';
      }

      // Calculate results and display output table
      function calculateResults() {
        syncInputTableToData();

        // Basic checks
        if (students.length === 0) {
          outputDiv.innerHTML = '<p style="color:#d9534f;font-weight:bold;">Add at least one student.</p>';
          return;
        }
        if (subjects.length === 0) {
          outputDiv.innerHTML = '<p style="color:#d9534f;font-weight:bold;">Add at least one subject.</p>';
          return;
        }

        // Create results table
        const resultsTable = document.createElement('table');
        resultsTable.setAttribute('aria-label', 'Calculated results table');
        resultsTable.classList.add('results-table');
        resultsTable.style.borderCollapse = 'collapse';
        resultsTable.style.width = '100%';
        resultsTable.style.marginTop = '1rem';

        // Build thead
        const thead = document.createElement('thead');
        const headRow = document.createElement('tr');
        headRow.appendChild(createTH('Student Name', false));

        subjects.forEach(subject => {
          headRow.appendChild(createTH(subject, true));
        });
        headRow.appendChild(createTH('Total', true));
        headRow.appendChild(createTH('Average', true));
        headRow.appendChild(createTH('Grade', false));
        thead.appendChild(headRow);
        resultsTable.appendChild(thead);

        // Build tbody
        const tbodyResults = document.createElement('tbody');
        students.forEach(student => {
          const row = document.createElement('tr');
          row.appendChild(createTD(student.name, false));

          let total = 0;
          let validCount = 0;
          subjects.forEach((_, subjIndex) => {
            const mark = student.marks[subjIndex];
            const displayMark = (mark === null || mark === '' || mark === undefined) ? '-' : mark;
            row.appendChild(createTD(displayMark, true));

            if (typeof mark === 'number') {
              total += mark;
              validCount++;
            }
          });
          const average = validCount ? (total / validCount) : null;

          row.appendChild(createTD(total || '-', true));
          row.appendChild(createTD(average !== null ? average.toFixed(2) : '-', true));
          row.appendChild(createTD(getGrade(average), false));

          tbodyResults.appendChild(row);
        });
        resultsTable.appendChild(tbodyResults);

        // Build tfoot with subject means
        const tfoot = document.createElement('tfoot');
        const footerRow = document.createElement('tr');
        footerRow.appendChild(createTD('Subject Mean', false));
        subjects.forEach((_, subjIndex) => {
          let sum = 0, count = 0;
          students.forEach(s => {
            const val = s.marks[subjIndex];
            if (typeof val === 'number') {
              sum += val;
              count++;
            }
          });
          const mean = count ? (sum / count) : null;
          footerRow.appendChild(createTD(mean !== null ? mean.toFixed(2) : '-', true));
        });
        footerRow.appendChild(createTD('-', true)); // Total col blank
        footerRow.appendChild(createTD('-', true)); // Average col blank
        footerRow.appendChild(createTD('-', false)); // Grade col blank
        tfoot.appendChild(footerRow);
        resultsTable.appendChild(tfoot);

        // Clear previous output and append new
        outputDiv.innerHTML = '';
        outputDiv.appendChild(resultsTable);

        // Enable sorting on results table
        makeResultsSortable(resultsTable);
      }

      // Create TH helper with sorting cursor
      function createTH(text, sortable) {
        const th = document.createElement('th');
        th.textContent = text;
        if (sortable) {
          th.style.cursor = 'pointer';
          th.title = 'Click to sort';
          th.setAttribute('aria-sort', 'none');
        }
        return th;
      }

      // Create TD helper
      function createTD(text, numeric) {
        const td = document.createElement('td');
        td.textContent = text;
        td.style.textAlign = numeric ? 'center' : 'left';
        return td;
      }

      // Sorting function for results table
      function makeResultsSortable(table) {
        const headers = table.querySelectorAll('thead th');
        let sortDirection = {};

        headers.forEach((header, index) => {
          if (!header.style.cursor) return; // Skip non-sortable

          header.addEventListener('click', () => {
            const tbody = table.querySelector('tbody');
            const rows = Array.from(tbody.rows);
            const isNumeric = index > 0 && index < headers.length - 1; // ignore first col & last col (grade)

            // Toggle direction
            if (!sortDirection[index]) sortDirection[index] = 'asc';
            else sortDirection[index] = sortDirection[index] === 'asc' ? 'desc' : 'asc';

            // Reset aria-sort attributes
            headers.forEach((h, i) => h.setAttribute('aria-sort', 'none'));
            header.setAttribute('aria-sort', sortDirection[index] === 'asc' ? 'ascending' : 'descending');

            rows.sort((a, b) => {
              let valA = a.cells[index].textContent.trim();
              let valB = b.cells[index].textContent.trim();

              if (isNumeric) {
                valA = valA === '-' ? -Infinity : parseFloat(valA);
                valB = valB === '-' ? -Infinity : parseFloat(valB);
                if (isNaN(valA)) valA = -Infinity;
                if (isNaN(valB)) valB = -Infinity;
              }

              if (valA < valB) return sortDirection[index] === 'asc' ? -1 : 1;
              if (valA > valB) return sortDirection[index] === 'asc' ? 1 : -1;
              return 0;
            });

            // Reattach rows in sorted order
            rows.forEach(row => tbody.appendChild(row));
          });
        });
      }

      // Initialization
      rebuildMarksTable();

      // Hook up calculate button
      calculateBtn.addEventListener('click', calculateResults);

      // Focus input accessibility
      addSubjectBtn.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') addSubjectBtn.click();
      });
      addStudentBtn.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') addStudentBtn.click();
      });
    })();