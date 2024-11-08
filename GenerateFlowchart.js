import React, { useState, useEffect } from 'react';
import AceEditor from "react-ace";
import plantumlEncoder from "plantuml-encoder";
import styles from './GenerateFlowchart.module.css';
import "ace-builds/src-noconflict/theme-github";

function GenerateFlowchart() {
  const [umlCode, setUmlCode] = useState('');
  const [graphUrl, setGraphUrl] = useState("");
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [prompt, setPrompt] = useState('');

  useEffect(() => {
    if (umlCode) {
      const encodedMarkup = plantumlEncoder.encode(umlCode);
      const url = `https://www.plantuml.com/plantuml/svg/${encodedMarkup}`;
      setGraphUrl(url);
      console.log("Graph URL:", url);
    } else {
      setGraphUrl(""); 
    }
  }, [umlCode]);

  const saveAsPNG = async () => {
    if (graphUrl) {
      try {
        const response = await fetch(graphUrl);
        const svgText = await response.text();

        const img = new Image();
        const svgBlob = new Blob([svgText], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(svgBlob);

        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');

          canvas.width = img.width;
          canvas.height = img.height;

          ctx.drawImage(img, 0, 0);

          const link = document.createElement('a');
          link.href = canvas.toDataURL('image/png');
          link.download = 'flowchart.png';
          link.click();

          URL.revokeObjectURL(url);
        };

        img.src = url;
      } catch (error) {
        setError('Failed to download flowchart: ' + error.message);
      }
    }
  };

  const resetEditor = () => {
    setUmlCode('');
    setGraphUrl("");
    setError('');
    setPrompt('');
  };

  const handlePromptChange = (e) => {
    setPrompt(e.target.value);
  };

  const generateFlowchart = async (e) => {
    e.preventDefault();
    setError('');
    if (!prompt) {
      setError('Prompt cannot be empty.');
      return;
    }
    setLoading(true);

    try {
      const response = await fetch('http://localhost:8000/generate-flowchart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) {
        throw new Error('Server is temporarily unavailable. Please try again later.');
      }

      const data = await response.json();
      if (data.result) {
        const cleanedUmlCode = data.result.replace(/^```plantuml\s*|\s*```/g, '').trim();
        setUmlCode(cleanedUmlCode);
        console.log("UML Code:", cleanedUmlCode); 
      } else {
        setError('No result returned from the backend.');
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <header>
        <div className={styles.headerContent}>
          <h1 className={styles.header}>Flowchart Generator</h1>
        </div>
      </header>
      <div className={styles.flexContainer}>
        <div className={styles.leftPanel}>
          <textarea
            className={styles.inputbox}
            value={prompt}
            onChange={handlePromptChange}
            placeholder="Enter your prompt here..."
            rows={4}
            required
          />
          <button onClick={generateFlowchart} disabled={loading} className={styles.generateButton}>
            {loading ? 'Generating...' : 'Generate Flowchart'}
          </button>
          {error && <p className={styles.error}>{error}</p>}
          {graphUrl && (
            <div>
              <h3 className={styles.heading3}>Edit Flowchart</h3>
              <AceEditor className={styles.codeEditor}
                mode="text"
                theme="github"
                fontSize={12}
                onChange={setUmlCode}
                value={umlCode}
                name="plantuml-input"
                width="100%"
                height="250px"
                editorProps={{ $blockScrolling: true }}
              />
              <div className={styles.buttonContainer}>
                <button onClick={saveAsPNG} className={styles.saveButton}>
                  Save as PNG
                </button>
                <button onClick={resetEditor} className={styles.resetButton}>
                  Reset
                </button>
              </div>
            </div>
          )}
        </div>

        <div className={styles.rightPanel}>
          <h2 className={styles.flowchartHeader}>Rendered Flowchart</h2>
          {graphUrl && (
            <div className={styles.flowchartContainer}>
              <div className={styles.flowchart}>
                <img 
                  src={graphUrl} 
                  alt="PlantUML Diagram" 
                  className={styles.diagramImage} 
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default GenerateFlowchart;
