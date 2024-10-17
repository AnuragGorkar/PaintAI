import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface GeneratedResult {
  expression: string;
  answer: string;
}

interface ResultPopupProps {
  results: GeneratedResult[];
  onClose: () => void;
}

const ResultPopup: React.FC<ResultPopupProps> = ({ results, onClose }) => {
  useEffect(() => {
    if (window.MathJax) {
      window.MathJax.Hub.Queue(["Typeset", window.MathJax.Hub]);
    }
  }, [results]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-black border-2 border-gray-600 rounded-lg p-6 w-11/12 max-w-2xl max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-white text-2xl font-bold text-left">Results</h2>
          <button onClick={onClose} className="text-white hover:text-gray-300">
            <X size={24} />
          </button>
        </div>
        <div className="space-y-4 text-left">
          {results.map((result, index) => (
            <div key={index} className="bg-gray-800 rounded p-4 text-left">
              <div className="text-white mb-2">Expression:</div>
              <div className="latex-content text-white mb-4">{result.expression}</div>
              <div className="text-white mb-2">Result:</div>
              <div className="latex-content text-white">{result.answer}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ResultPopup;