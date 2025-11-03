import { useState } from 'react';

const TableEditor = ({ noteId }) => {
  const [rows, setRows] = useState(3);
  const [cols, setCols] = useState(3);
  const [tableData, setTableData] = useState([]);

  const initializeTable = () => {
    const newData = [];
    for (let i = 0; i < rows; i++) {
      const row = [];
      for (let j = 0; j < cols; j++) {
        row.push('');
      }
      newData.push(row);
    }
    setTableData(newData);
  };

  const handleCellChange = (rowIndex, colIndex, value) => {
    const newData = [...tableData];
    newData[rowIndex][colIndex] = value;
    setTableData(newData);
  };

  const addRow = () => {
    const newRow = new Array(cols).fill('');
    setTableData([...tableData, newRow]);
    setRows(rows + 1);
  };

  const addCol = () => {
    const newData = tableData.map((row) => [...row, '']);
    setTableData(newData);
    setCols(cols + 1);
  };

  const exportToMarkdown = () => {
    let markdown = '|';
    for (let j = 0; j < cols; j++) {
      markdown += ' Header ' + (j + 1) + ' |';
    }
    markdown += '\n|';
    for (let j = 0; j < cols; j++) {
      markdown += ' --- |';
    }
    markdown += '\n';

    tableData.forEach((row) => {
      markdown += '|';
      row.forEach((cell) => {
        markdown += ' ' + (cell || ' ') + ' |';
      });
      markdown += '\n';
    });

    return markdown;
  };

  if (tableData.length === 0) {
    return (
      <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
        <h4 className="font-semibold mb-4">Table Editor</h4>
        <div className="flex space-x-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Rows
            </label>
            <input
              type="number"
              min="1"
              value={rows}
              onChange={(e) => setRows(parseInt(e.target.value) || 1)}
              className="w-20 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Columns
            </label>
            <input
              type="number"
              min="1"
              value={cols}
              onChange={(e) => setCols(parseInt(e.target.value) || 1)}
              className="w-20 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={initializeTable}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              Create Table
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
      <div className="flex justify-between items-center mb-4">
        <h4 className="font-semibold">Table Editor</h4>
        <div className="flex space-x-2">
          <button
            onClick={addRow}
            className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
          >
            + Row
          </button>
          <button
            onClick={addCol}
            className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
          >
            + Col
          </button>
        </div>
      </div>
      <div className="overflow-x-auto mb-4">
        <table className="min-w-full border border-gray-300 bg-white">
          <thead>
            <tr>
              {Array.from({ length: cols }).map((_, colIndex) => (
                <th
                  key={colIndex}
                  className="border border-gray-300 px-2 py-1 bg-gray-100"
                >
                  Header {colIndex + 1}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tableData.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {row.map((cell, colIndex) => (
                  <td key={colIndex} className="border border-gray-300 p-0">
                    <input
                      type="text"
                      value={cell}
                      onChange={(e) =>
                        handleCellChange(rowIndex, colIndex, e.target.value)
                      }
                      className="w-full px-2 py-1 border-none focus:outline-none focus:bg-blue-50"
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button
        onClick={() => {
          const markdown = exportToMarkdown();
          navigator.clipboard.writeText(markdown);
          alert('Table exported to markdown (copied to clipboard)');
        }}
        className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 text-sm"
      >
        Export to Markdown
      </button>
    </div>
  );
};

export default TableEditor;
