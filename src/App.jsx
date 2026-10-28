import React, { useState } from 'react';
import './App.css';
import Login from './components/Login';
import Register from './components/Register';
import ForgotPassword from './components/ForgotPassword';

function App() {
  const [currentPage, setCurrentPage] = useState('login');

  return (
    <div className="app-container">
      {currentPage === 'login' && (
        <Login onSwitch={(page) => setCurrentPage(page)} />
      )}

      {currentPage === 'register' && (
        <Register onSwitch={(page) => setCurrentPage(page)} />
      )}

      {currentPage === 'forgot' && (
        <ForgotPassword onSwitch={(page) => setCurrentPage(page)} />
      )}
    </div>
  );
}

export default App;
