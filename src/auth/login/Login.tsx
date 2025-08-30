import type { LoginInfo } from "../models/LoginInfo";

import "./Login.css";

import LoginGoogle from "./LoginGoogle";
import { lazy } from "react";

const LoginMsal = lazy(() => import("./LoginMsal"));

type LoginProps = {
  info?: LoginInfo;
};

const Login = (props: LoginProps) => {
  const { info } = props;

  if (!info) {
    return <p>Loading login info. Please wait...</p>;
  }

  if (info.authProvider === "MSAL") {
    return <LoginMsal info={info} />;
  } else if (info.authProvider === "GOOGLE") {
    return <LoginGoogle info={info} />;
  } else {
    return <p>Unsupported auth provider: {info.authProvider}</p>;
  }
};

export default Login;
