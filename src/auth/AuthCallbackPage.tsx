import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const AuthCallbackPage = () => {
  const navigate = useNavigate();
  const redirect = sessionStorage.getItem("auth-login-query");

  useEffect(() => {
    const hash = window.location.hash;
    if (hash?.includes("id_token")) {
      const idToken = hash.split("id_token=")[1].split("&")[0];
      sessionStorage.setItem("google-auth-id-token", idToken);
    }
    if (redirect) {
      navigate(redirect + window.location.hash);
    } else {
      navigate("/");
    }
  }, [navigate, redirect]);

  return <p>Redirecting soon...</p>;
};

export default AuthCallbackPage;
