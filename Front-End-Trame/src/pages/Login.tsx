import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../Contexts/AuthContext.jsx'; // Fixed capital 'C' in Contexts
import {api} from '../public/api/api';
import LoadingAnimation from '../components/LoadingAnimation';
function Login() {
  const location = useLocation();
  const navigate = useNavigate();
  const { login, isAuthenticated, loading } = useAuth();

  const [isLoading, setIsLoading] = useState(false);

  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    Email: '',
    FirstName: '',
    LastName: '',
    Password: '',
    ConfirmPassword: '',
    RememberMe: true
  });
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };  

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true); // Set loading state at the beginning

    if (isLogin) {
      try {
        if (typeof login !== 'function') {
          throw new Error('Authentication service is not available');
        }
        await login(formData.Email, formData.Password, formData.RememberMe);
        // Navigate after successful state update
        const navigateTo = location.state?.from?.pathname || '/dashboard';
        navigate(navigateTo);
      } catch (err) {
        setError(err.message || 'Login failed');
      } finally {
        setIsLoading(false);
      }
    } else {
      // Handle signup logic
      if (formData.Password !== formData.ConfirmPassword) {
        setError('Passwords do not match');
        setIsLoading(false);
        return;
      }
      const payload = {
        Email: formData.Email,
        FirstName: formData.FirstName,
        LastName: formData.LastName,
        Password: formData.Password
      }
      try {
        const response = await api.post('/auth/signup', payload);
        
        if (typeof login !== 'function') {
          throw new Error('Authentication service is not available');
        }
        await login(formData.Email, formData.Password, true);

        console.log('Inscription réussie', response);
      } catch (err) {
        console.error('Erreur lors de l\'inscription', err);
        setError('Erreur lors de l\'inscription: ' + (err.message || ''));
      } finally {
        setIsLoading(false);
      }
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setError('');
  };

  if (loading) {
    return <LoadingAnimation texte={"Connexion en cours..."} colors={["#999999"]} percentage={undefined} />;
  }
  else if (isAuthenticated) {
    navigate('/');
  }

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">
          {isLogin ? 'Se connecter' : 's\'inscrire'}
        </h2>

        {error && (
          <div className="bg-red-100 text-red-700 p-3 rounded mb-4 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className='text-left'>
          <div className="mb-4">
            <label htmlFor="Email" className="block text-gray-700 font-medium mb-2">
              Email
            </label>
            <input
              type="email"
              id="Email"
              name="Email"
              value={formData.Email}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {!isLogin && (
            <>
              <div className="mb-4">
                <label htmlFor="FirstName" className="block text-gray-700 font-medium mb-2">
                  Prénom
                </label>
                <input
                  type="text"
                  id="FirstName"
                  name="FirstName"
                  value={formData.FirstName}
                  onChange={handleChange}
                  required={!isLogin}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="mb-4">
                <label htmlFor="LastName" className="block text-gray-700 font-medium mb-2">
                  Nom
                </label>
                <input
                  type="text"
                  id="LastName"
                  name="LastName"
                  value={formData.LastName}
                  onChange={handleChange}
                  required={!isLogin}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </>
          )}

          <div className="mb-4">
            <label htmlFor="Password" className="block text-gray-700 font-medium mb-2">
              Mot de passe
            </label>
            <input
              type="password"
              id="Password"
              name="Password"
              value={formData.Password}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {!isLogin && (
            <div className="mb-4">
              <label htmlFor="ConfirmPassword" className="block text-gray-700 font-medium mb-2">
                Confirmer le mot de passe
              </label>
              <input
                type="password"
                id="ConfirmPassword"
                name="ConfirmPassword"
                value={formData.ConfirmPassword}
                onChange={handleChange}
                required={!isLogin}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-4 rounded-md transition duration-200 mt-4"
          >
            {isLogin ? 'Login' : 'Sign Up'}
          </button>
        </form>

        <div className="text-center mt-4">
          <p className="text-gray-600">
            {isLogin ? "Vous n'avez pas de compte? " : "Vous avez déja un compte? "}
            <button
              type="button"
              onClick={toggleMode}
              className="text-blue-500 font-semibold hover:underline focus:outline-none"
            >
              {isLogin ? 'S\'inscrire' : 'Se connecter'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login