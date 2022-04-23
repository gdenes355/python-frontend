import React from "react";

type ErrorBoundayState = {
  error?: string;
};

class ErrorBounday extends React.Component<ErrorBoundayState> {
  state: ErrorBoundayState = {};

  componentDidCatch(error: Error) {
    console.error("error within boundary:", error);
  }

  public static getDerivedStateFromError(error: Error): ErrorBoundayState {
    return { error: error.message };
  }

  render() {
    if (this.state.error || this.state.error === "") {
      return <p>{this.state.error}</p>;
    } else {
      return this.props.children;
    }
  }
}
export default ErrorBounday;
