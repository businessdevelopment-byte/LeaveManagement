import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Lock, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/authStore';
import botivateLogoB from '../Assets/logo.png';
import Footer from '../components/Footer';

const Login = () => {
  const [id, setId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const login = useAuthStore((state) => state.login);
  const navigate = useNavigate();

  const [cachedData, setCachedData] = useState(null);
  const fetchPromise = React.useRef(null);

  // PRE-FETCH optimization: Load login data as soon as the page opens
  React.useEffect(() => {
    const scriptUrl = import.meta.env.VITE_GOOGLE_APPS_SCRIPT;
    const sheetName = import.meta.env.VITE_LOGIN_SHEET;
    if (scriptUrl && sheetName) {
      fetchPromise.current = fetch(`${scriptUrl}?sheet=${sheetName}`)
        .then(res => res.json())
        .then(json => {
          if (json.success) setCachedData(json.data);
          return json;
        });
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (!id || !password) {
        toast.error('Invalid credentials');
        setSubmitting(false);
        return;
      }

      let data = cachedData;

      // If data isn't pre-fetched yet, wait for the pending promise or fetch it now
      if (!data) {
        if (fetchPromise.current) {
          const json = await fetchPromise.current;
          if (json.success) data = json.data;
        } else {
          const scriptUrl = import.meta.env.VITE_GOOGLE_APPS_SCRIPT;
          const sheetName = import.meta.env.VITE_LOGIN_SHEET;
          const res = await fetch(`${scriptUrl}?sheet=${sheetName}`);
          const json = await res.json();
          if (json.success) data = json.data;
        }
      }

      if (!data) {
        throw new Error('Failed to load login data. Please check your connection.');
      }

      let matchedUser = null;

      // Skip header row (i = 1)
      for (let i = 1; i < data.length; i++) {
        const row = data[i];
        const rowName = String(row[2] || '').trim(); // C — Name
        const rowMobile = String(row[3] || '').trim(); // D — Mobile
        const rowGmail = String(row[4] || '').trim(); // E — Gmail
        const rowDesignation = String(row[5] || '').trim(); // F — Designation
        let rowLoginId = String(row[6] || '').trim(); // G — Login ID
        let rowPass = String(row[7] || '').trim(); // H — Password

        // Strip leading quote if present
        if (rowLoginId.startsWith("'")) rowLoginId = rowLoginId.slice(1);
        if (rowPass.startsWith("'")) rowPass = rowPass.slice(1);

        const rowRole = String(row[8] || '').trim(); // I — Role

        // Match: Login ID = Column G, Password = Column H
        if (id === rowLoginId && password === rowPass) {
          matchedUser = {
            name: rowName,
            username: rowLoginId,     // shown as ID in header
            employeeCode: rowLoginId,     // used for leave request filtering
            mobile: rowMobile,      // pre-fill form
            gmail: rowGmail,
            designation: rowDesignation, // pre-fill form
            pass: rowPass,
            role: rowRole.toUpperCase(),
          };
          break;
        }
      }

      if (!matchedUser) {
        toast.error('Invalid credentials');
        setSubmitting(false);
        return;
      }

      toast.success('Login successful!');
      login(matchedUser);
      navigate("/", { replace: true });
    } catch (err) {
      console.error(err);
      toast.error('Login error: ' + (err.message || 'Server error'));
    } finally {
      setSubmitting(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  // Demo credentials removed

  return (
    <div className="h-[100dvh] overflow-hidden w-full flex flex-col bg-gradient-to-br from-sky-50 to-sky-100">
      {/* Center Content */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8 space-y-6">

          <div className="flex flex-col items-center space-y-2">
            <div className="text-center space-y-2">
              <h1 className="text-4xl font-semibold text-gray-900">Leave</h1>
              <p className="text-gray-600 text-base font-medium">Management System</p>
            </div>
          </div>

          {/* Form */}
          <form className="space-y-4" onSubmit={handleSubmit}>
            {/* User ID Input */}
            <div className="space-y-2">
              <label htmlFor="id" className="text-sm font-medium text-gray-700">
                User ID
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="id"
                  name="id"
                  type="text"
                  required
                  value={id}
                  onChange={(e) => setId(e.target.value)}
                  className="block w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white transition-all"
                  placeholder="Enter user ID"
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white transition-all"
                  placeholder="Enter password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  onClick={togglePasswordVisibility}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={submitting}
              className={`w-full py-3 px-4 text-base font-semibold bg-sky-600 text-white rounded-lg hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-600 transition-all ${submitting ? 'opacity-70 cursor-not-allowed' : ''
                }`}
            >
              {submitting ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Signing in...</span>
                </div>
              ) : (
                'Sign In'
              )}
            </button>
          </form>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Login;

