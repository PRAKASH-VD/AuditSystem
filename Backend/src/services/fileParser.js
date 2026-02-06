const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');
const { parse } = require('csv-parse');

async function parseFile(filePath, originalName, maxRows) {
  let ext = path.extname(filePath).toLowerCase();
  if (!ext && originalName) {
    ext = path.extname(originalName).toLowerCase();
  }
  if (ext === '.xlsx' || ext === '.xls') {
    const workbook = xlsx.readFile(filePath);
    const firstSheet = workbook.SheetNames[0];
    const sheet = workbook.Sheets[firstSheet];
    const json = xlsx.utils.sheet_to_json(sheet, { defval: '' });
    if (maxRows && json.length > maxRows) {
      throw new Error(`Row limit exceeded: ${json.length} > ${maxRows}`);
    }
    return json;
  }
  if (ext === '.csv') {
    const content = fs.readFileSync(filePath, 'utf-8');
    return new Promise((resolve, reject) => {
      parse(content, { columns: true, skip_empty_lines: true }, (err, records) => {
        if (err) return reject(err);
        if (maxRows && records.length > maxRows) {
          return reject(new Error(`Row limit exceeded: ${records.length} > ${maxRows}`));
        }
        resolve(records);
      });
    });
  }
  throw new Error('Unsupported file type');
}

async function parseFilePreview(filePath, limit = 20, originalName, maxRows) {
  const records = await parseFile(filePath, originalName, maxRows);
  const rows = records.slice(0, limit);
  const headers = rows.length > 0 ? Object.keys(rows[0]) : [];
  return { headers, rows };
}

module.exports = { parseFile, parseFilePreview };
