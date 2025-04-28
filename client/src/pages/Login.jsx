import { useState } from "react";
import { useNavigate } from "react-router-dom";

function Login() {
  return (
    <div>
      <h2>Login</h2>
      <form>
        <input type="email" placeholder="Email" />
        <input type="password" placeholder="Password" />
        <button type="submit">Login</button>
      </form>
    </div>
  );
}

export default Login;