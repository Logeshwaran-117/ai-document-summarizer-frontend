import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api";
import googleLogo from "../assets/google.png";

function Auth({ setIsAuthenticated }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      await api.post("/auth/login", { email, password });
      setIsAuthenticated(true);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    }
  };

  const handleLogout = async () => {
  await api.post('/auth/logout');         // clear server session
  setIsAuthenticated(false);

  // This forces Google to show account picker next time
  window.open(
    'https://accounts.google.com/logout',
    '_blank'
   );

  navigate('/login');
};

  return (
    <div className="flex justify-center items-center h-screen bg-gray-100 dark:bg-gray-950 transition-colors duration-300">
      <div className="bg-white dark:bg-gray-900 p-8 rounded-lg shadow-md w-96 transition-colors duration-300">
        <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Login</h2>
        {error && <p className="text-red-500 mb-3">{error}</p>}
        <input type="email" placeholder="Email" value={email}
          onChange={e => setEmail(e.target.value)}
          className="w-full p-2 border border-gray-300 dark:border-gray-700 mb-3 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500" />
        <input type="password" placeholder="Password" value={password}
          onChange={e => setPassword(e.target.value)}
          className="w-full p-2 border border-gray-300 dark:border-gray-700 mb-4 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500" />
        <button onClick={handleLogin}
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition">Login</button>
        <div className="my-4 text-center text-gray-500 dark:text-gray-400">OR</div>
        <button onClick={() => window.location.href = "http://localhost:5000/auth/google"}
          className="w-full border border-gray-300 dark:border-gray-700 py-2 rounded hover:bg-gray-50 dark:hover:bg-gray-800 flex justify-center items-center gap-2 text-gray-900 dark:text-white transition">
          <img src={googleLogo} alt="Google" className="w-5" />
          Sign in with Google
        </button>
        <p className="text-center mt-4 text-sm text-gray-600 dark:text-gray-400">
          Don't have an account? <Link to="/signup" className="text-blue-600 dark:text-blue-400 font-semibold">Sign up</Link>
        </p>
      </div>
    </div>
  );
}

export default Auth;
