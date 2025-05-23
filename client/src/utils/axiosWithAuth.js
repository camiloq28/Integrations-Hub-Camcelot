// /client/src/utils/axiosWithAuth.js
import axios from 'axios';

const axiosWithAuth = () => {
  const storedUser = JSON.parse(localStorage.getItem('user'));
  const token = storedUser?.token;
  const expiry = storedUser?.tokenExpiry;

  // If token is expired or missing, redirect to login
  if (!token || (expiry && Date.now() > expiry)) {
    localStorage.clear();
    window.location.href = '/login';
    return axios.create();
  }

  return axios.create({
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
};

export default axiosWithAuth;