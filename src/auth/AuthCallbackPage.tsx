import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const AuthCallbackPage = () => {
  const navigate = useNavigate();
  const redirectQuery = sessionStorage.getItem("msal-login-query");

  useEffect(() => {
    if (redirectQuery) {
      navigate("/" + redirectQuery + window.location.hash);
    } else {
      navigate("/");
    }
  }, [navigate, redirectQuery]);

  return <p>Redirecting soon...</p>;
};

export default AuthCallbackPage;
