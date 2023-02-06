import React from "react";

type ErrorBoundaryProps = {
  children?: React.ReactNode;
}

type ErrorBoundayState = {
  error?: string;
};

class ErrorBounday extends React.Component<ErrorBoundaryProps, ErrorBoundayState> {
  state: ErrorBoundayState = {};
  props: ErrorBoundaryProps= {};

  constructor(props: any) {
    super(props);
    this.props = props;
    this.state = { error: undefined };
  }

  componentDidCatch(error: Error) {
    console.error("error within boundary:", error);
  }

  static getDerivedStateFromError(error: Error): ErrorBoundayState {
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
