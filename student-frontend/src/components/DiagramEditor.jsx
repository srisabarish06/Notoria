import { useState } from 'react';

const DiagramEditor = ({ noteId }) => {
  const [diagramType, setDiagramType] = useState('flowchart');
  const [diagramData, setDiagramData] = useState('');

  const diagramTemplates = {
    flowchart: `graph TD
    A[Start] --> B{Decision}
    B -->|Yes| C[Action 1]
    B -->|No| D[Action 2]
    C --> E[End]
    D --> E`,
    sequence: `sequenceDiagram
    Alice->>Bob: Hello Bob
    Bob-->>Alice: Hello Alice
    Alice->>Bob: How are you?`,
    er: `erDiagram
    USER ||--o{ NOTE : creates
    USER {
        string username
        string email
    }
    NOTE {
        string title
        string content
    }`,
  };

  const handleTemplateChange = (type) => {
    setDiagramType(type);
    setDiagramData(diagramTemplates[type]);
  };

  return (
    <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
      <h4 className="font-semibold mb-4">Diagram Editor</h4>
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Diagram Type
        </label>
        <select
          value={diagramType}
          onChange={(e) => handleTemplateChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
        >
          <option value="flowchart">Flowchart</option>
          <option value="sequence">Sequence Diagram</option>
          <option value="er">ER Diagram</option>
        </select>
      </div>
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Diagram Code (Mermaid syntax)
        </label>
        <textarea
          value={diagramData}
          onChange={(e) => setDiagramData(e.target.value)}
          rows={8}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 font-mono text-sm"
          placeholder="Enter diagram code..."
        />
      </div>
      <div className="bg-white border border-gray-200 rounded-lg p-4 min-h-48 flex items-center justify-center">
        <p className="text-gray-500 text-sm">
          Diagram Preview: Integrate with Mermaid.js library to render diagrams
        </p>
      </div>
      <p className="text-xs text-gray-500 mt-2">
        Note: Full diagram rendering requires Mermaid.js library integration
      </p>
    </div>
  );
};

export default DiagramEditor;
