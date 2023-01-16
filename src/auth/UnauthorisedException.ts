import LoginInfo from "./LoginInfo";

class UnauthorisedError extends Error {
  private info: LoginInfo;

  constructor(info: LoginInfo) {
    super("Unauthorised");
    this.info = info;
  }

  public getInfo() {
    return this.info;
  }
}

export default UnauthorisedError;
