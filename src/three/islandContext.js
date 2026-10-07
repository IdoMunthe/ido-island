import { createContext } from "react";

// { hovered, setHovered, selected, select(id), isTouch, openPhoto(i), bus, tier }
// `bus` is a plain object things share at runtime without prop drilling
// (the figure publishes its position on it; the workshop door watches it).
export const IslandContext = createContext(null);
