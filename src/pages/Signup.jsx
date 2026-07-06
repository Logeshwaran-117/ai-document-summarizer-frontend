import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api";

function Signup({ setIsAuthenticated }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSignup = async () => {
    try {
      await api.post("/auth/signup", { email, password });
      setIsAuthenticated(true);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Signup failed");
    }
  };

  return (
    <div className="flex justify-center items-center h-screen bg-gray-100 dark:bg-gray-950 transition-colors duration-300">
      <div className="bg-white dark:bg-gray-900 p-8 rounded-lg shadow-md w-96 transition-colors duration-300">
        <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Sign Up</h2>
        {error && <p className="text-red-500 mb-3">{error}</p>}
        <input type="email" placeholder="Email" value={email}
          onChange={e => setEmail(e.target.value)}
          className="w-full p-2 border border-gray-300 dark:border-gray-700 mb-3 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500" />
        <input type="password" placeholder="Password" value={password}
          onChange={e => setPassword(e.target.value)}
          className="w-full p-2 border border-gray-300 dark:border-gray-700 mb-4 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500" />
        <button onClick={handleSignup}
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition">
          Create Account
        </button>
        <p className="text-center mt-4 text-sm text-gray-600 dark:text-gray-400">
          Already have an account? <Link to="/login" className="text-blue-600 dark:text-blue-400 font-semibold">Login</Link>
        </p>
      </div>
    </div>
  );
}

export default Signup;
