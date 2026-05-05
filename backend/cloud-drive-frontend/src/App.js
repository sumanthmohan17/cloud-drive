import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Home from "./Home";
import SharePage from "./SharePage";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/share/:id" element={<SharePage />} />
      </Routes>
    </Router>
  );
}

export default App;