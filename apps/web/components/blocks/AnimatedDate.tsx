import { motion, AnimatePresence } from "framer-motion";
import { useMemo, useRef } from "react";
import type { Time } from "lightweight-charts";

type Props = {
  dates: Date[]; // not used for direction anymore (too unreliable)
  date: Time;
};

// 🔥 robust conversion (handles all Time variants)
function timeToDate(time: Time): Date {
  if (typeof time === "number") {
    return new Date(time * 1000);
  }

  if (typeof time === "object") {
    if ("timestamp" in time && typeof (time as any).timestamp === "number") {
      return new Date((time as any).timestamp * 1000);
    }

    if ("year" in time) {
      return new Date(time.year, time.month - 1, time.day);
    }
  }

  return new Date();
}

function formatDate(date: Date) {
  const pad2 = (n: number) => n.toString().padStart(2, "0");

  return `${pad2(date.getDate())}.${pad2(
    date.getMonth() + 1
  )}.${date.getFullYear()} ${pad2(date.getHours())}:${pad2(
    date.getMinutes()
  )}`;
}

export default function AnimatedDate({ date }: Props) {
  const currentDate = useMemo(() => timeToDate(date), [date]);

  // 🔥 direction based on timestamp (reliable)
  const prevTime = useRef<number | null>(null);
  const currentTs = currentDate.getTime();

  const direction =
    prevTime.current === null
      ? 1
      : currentTs >= prevTime.current
      ? 1
      : -1;

  prevTime.current = currentTs;

  const formatted = formatDate(currentDate);
  const chars = formatted.split("");

  return (
    <div
      style={{
        display: "flex",
        fontFamily: "monospace",
        fontSize: 20,
        lineHeight: "1em",
      }}
    >
      {chars.map((char, i) => (
        <Digit key={i} char={char} direction={direction} />
      ))}
    </div>
  );
}

function Digit({
  char,
  direction,
}: {
  char: string;
  direction: number;
}) {
  // don't animate separators → looks cleaner
  if (!/[0-9]/.test(char)) {
    return <span style={{ width: "0.5em" }}>{char}</span>;
  }

  return (
    <div
      style={{
        position: "relative",
        overflow: "hidden",
        height: "1em",
        width: "0.65em", // 🔥 critical fix (prevents overlap/invisible text)
      }}
    >
      <AnimatePresence mode="popLayout">
        <motion.span
          key={char}
          initial={{
            y: direction > 0 ? "100%" : "-100%",
            opacity: 0,
          }}
          animate={{ y: "0%", opacity: 1 }}
          exit={{
            y: direction > 0 ? "-100%" : "100%",
            opacity: 0,
          }}
          transition={{
            type: "spring",
            stiffness: 300,
            damping: 25,
          }}
          style={{
            position: "absolute",
            left: 0,
          }}
        >
          {char}
        </motion.span>
      </AnimatePresence>
    </div>
  );
}