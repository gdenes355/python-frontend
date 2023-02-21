import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const AuthCallbackPage = () => {
  const navigate = useNavigate();
  const redirect = sessionStorage.getItem("msal-login-query");

  useEffect(() => {
    if (redirect) {
      navigate(redirect + window.location.hash);
    } else {
      navigate("/");
    }
  }, [navigate, redirect]);

  return <p>Redirecting soon...</p>;
};

export default AuthCallbackPage;
