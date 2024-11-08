import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import GenerateFlowchart from './GenerateFlowchart';
import './App.css';


function App() {
  return (
    <Router>
        <Routes>
          <Route path="/" element={<GenerateFlowchart />} />
          <Route path="/generate-flowchart" element={<GenerateFlowchart />} />
        </Routes>
    </Router>
  );
}

export default App;
