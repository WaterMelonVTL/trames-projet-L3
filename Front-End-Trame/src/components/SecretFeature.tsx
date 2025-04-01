import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { ThemeContext } from './ThemeContext';

const SecretFeature: React.FC = () => {
  const [secretVisible, setSecretVisible] = useState(false);
  const [password, setPassword] = useState("");
  const { setTheme } = useContext(ThemeContext);
  const navigate = useNavigate();

  const handleSecretSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === "louis") {
      // Redirect to a temporary page featuring just a video
      navigate("/secret-video");
    } else if (password === "caca") {
      // Load the 'caca' theme
      setTheme("caca");
    } else {
      alert("Incorrect password");
    }
    setPassword("");
  };

  return (
    <div className="p-4">
      <button
        onClick={() => setSecretVisible(!secretVisible)}
        className="p-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
      >
        {secretVisible ? "Hide Secret" : "Secret"}
      </button>

      {secretVisible && (
        <form onSubmit={handleSecretSubmit} className="mt-2 flex items-center">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter secret password"
            className="border p-1 rounded"
          />
          <button
            type="submit"
            className="ml-2 p-1 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
          >
            Submit
          </button>
        </form>
      )}
    </div>
  );
};

export default SecretFeature;
