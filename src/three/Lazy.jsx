// Lazy entry into the 3D chunk. One dynamic import → one code-split chunk
// with three, react-three-fiber, drei and the island. If it fails to load
// or throws, the page switches to document mode and says why.
import { Component, Suspense, lazy } from "react";
import { useThreeMode } from "./context.jsx";
import { loadingFailed } from "./loading.js";

const Island = lazy(() =>
  import("./index.js")
    .then((m) => ({ default: m.Island }))
    .catch((err) => {
      console.error("[dating-cv] 3D chunk failed to load", err);
      loadingFailed(err?.message || "chunk failed to load");
      throw err;
    })
);

class Boundary extends Component {
  constructor(props) {
    super(props);
    this.state = { failed: false };
  }
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(err) {
    console.error("[dating-cv] 3D layer crashed, falling back to document mode", err);
    this.props.onFail?.(err);
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

export function LazyIsland({ fallback = null, ...props }) {
  const { fail } = useThreeMode();
  return (
    <Boundary onFail={fail}>
      <Suspense fallback={fallback}>
        <Island {...props} />
      </Suspense>
    </Boundary>
  );
}
