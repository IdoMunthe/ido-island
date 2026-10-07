import { forwardRef } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { content } from "../content.js";
import { Header } from "./Header.jsx";
import { Profile } from "./Profile.jsx";
import { Personal } from "./Personal.jsx";
import { Family } from "./Family.jsx";
import { Values } from "./Values.jsx";
import { Experience } from "./Experience.jsx";
import { Hobbies } from "./Hobbies.jsx";
import { Photos } from "./Photos.jsx";
import { Heading } from "./Heading.jsx";
import { Spec } from "./Spec.jsx";
import { BenchNote } from "./BenchNote.jsx";
import { Closing } from "./Closing.jsx";
import { PrintButton } from "./Buttons.jsx";

// The CV as a document: everything on the island, in reading order. It
// ends with the honest paragraph and then how to get in touch.
export const Document = forwardRef(function Document(_, ref) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      ref={ref}
      className="doc-wrap relative z-20 mx-auto w-full max-w-[56rem] px-4 pb-16 sm:px-6"
      initial={reduce ? false : { y: 24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 70, damping: 16, mass: 1 }}
    >
      <main id="cv" className="paper doc relative rounded-[3px] px-5 py-10 sm:px-10 sm:py-14 md:px-16 md:py-16">
        <div className="paper-grain pointer-events-none absolute inset-0 rounded-[3px]" aria-hidden="true" />
        <div className="relative">
          <Header />
          <div className="doc-sections">
            <Profile />
            <Personal />
            <Family />
            <Values />
            <Experience />
            <Hobbies />
            <Photos />
            <Heading />
            <Spec />
            <BenchNote />
            <Closing />
          </div>
          {content.print.footer ? <p className="print-only hidden mt-8 border-t border-rule pt-2 font-mono text-[10px] text-ink-mute">{content.print.footer}</p> : null}
        </div>
      </main>
      <footer className="no-print mt-12 flex justify-center">
        <PrintButton />
      </footer>
    </motion.div>
  );
});
