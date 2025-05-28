document.addEventListener('DOMContentLoaded', function () {
  loadMMRBTableData();

  const resetCell = document.querySelector('#mmrb-table .reset-cell');
  if (resetCell) {
    resetCell.addEventListener('click', resetMMRBTable);
  }
});

function loadMMRBTableData() {
  fetch('./mmrb_leaderboard.json')
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      const tbody = document.querySelector('#mmrb-table tbody');
      const scores = prepareScoresForStylingMMRB(data.leaderboardData);

      data.leaderboardData.forEach((row, index) => {
        const tr = document.createElement('tr');
        tr.classList.add(row.info.type || 'unknown');

        const apply = (val, rank) => {
          if (val === undefined || val === null || val === '-') return '-';
          const v = parseFloat(val).toFixed(2);
          if (rank === 0) return `<b>${v}</b>`;
          if (rank === 1) return `<u>${v}</u>`;
          return v;
        };

        tr.innerHTML = `
          <td><b>${row.info.name}</b></td>
          <td>${apply(row.scores.answer, scores.answer[index])}</td>
          <td>${apply(row.scores.answer_cot, scores.answer_cot[index])}</td>
          <td>${apply(row.scores.process, scores.process[index])}</td>
          <td>${apply(row.scores.relevance, scores.relevance[index])}</td>
          <td>${apply(row.scores.efficacy, scores.efficacy[index])}</td>
        `;
        tbody.appendChild(tr);
      });

      initializeMMRBSorting();
    })
    .catch(error => {
      console.error('Error loading MMRB table data:', error);
      document.querySelector('#mmrb-table tbody').innerHTML = `
        <tr>
          <td colspan="6">
            Error loading data: ${error.message}<br>
            Please ensure you're accessing this page through a web server.
          </td>
        </tr>
      `;
    });
}

function prepareScoresForStylingMMRB(data) {
  const fields = ['answer', 'answer_cot', 'process', 'relevance', 'efficacy'];
  const scores = {};

  fields.forEach(field => {
    const values = data
      .map(row => row.scores && row.scores[field])
      .filter(value => value !== undefined && value !== '-' && value !== null)
      .map(parseFloat);

    const sorted = [...new Set(values)].sort((a, b) => b - a); // 降序

    scores[field] = data.map(row => {
      const value = row.scores && row.scores[field];
      if (value === '-' || value === undefined || value === null) return -1;
      return sorted.indexOf(parseFloat(value));
    });
  });

  return scores;
}

function initializeMMRBSorting() {
  const headers = document.querySelectorAll('#mmrb-table thead tr:last-child th.sortable');
  headers.forEach(header => {
    header.addEventListener('click', () => sortMMRBTable(header));
  });
}

function sortMMRBTable(header) {
  const table = document.getElementById('mmrb-table');
  const tbody = table.querySelector('tbody');
  const rows = Array.from(tbody.querySelectorAll('tr'));
  const headers = Array.from(header.parentNode.children);
  const columnIndex = headers.indexOf(header);
  const sortType = header.dataset.sort;

  const isDescending = !header.classList.contains('desc');

  rows.sort((a, b) => {
    let aValue = getCellText(a, columnIndex);
    let bValue = getCellText(b, columnIndex);

    if (aValue === '-' && bValue !== '-') return isDescending ? 1 : -1;
    if (bValue === '-' && aValue !== '-') return isDescending ? -1 : 1;

    if (sortType === 'number') {
      return isDescending
        ? parseFloat(bValue) - parseFloat(aValue)
        : parseFloat(aValue) - parseFloat(bValue);
    } else {
      return isDescending
        ? bValue.localeCompare(aValue)
        : aValue.localeCompare(bValue);
    }
  });

  headers.forEach(h => h.classList.remove('asc', 'desc'));
  header.classList.add(isDescending ? 'desc' : 'asc');

  rows.forEach(row => tbody.appendChild(row));
}

function getCellText(row, index) {
  const cell = row.children[index];
  if (!cell) return '';
  return cell.textContent.trim().replace('*', '');
}

function resetMMRBTable() {
  const tbody = document.querySelector('#mmrb-table tbody');
  tbody.innerHTML = ''; // 清空表格
  document.querySelectorAll('#mmrb-table th').forEach(th => th.classList.remove('asc', 'desc'));
  loadMMRBTableData();  // 重新加载原始顺序
}
