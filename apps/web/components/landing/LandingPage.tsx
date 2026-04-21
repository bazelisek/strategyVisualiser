import Box from "@mui/joy/Box";
import CTA from "./CTA";
import Credibility from "./Credibility";
import Features from "./Features";
import Hero from "./Hero";
import HowItWorks from "./HowItWorks";
import Preview from "./Preview";

export default function LandingPage() {
  return (
    <Box
      component="main"
      sx={{
        position: "relative",
        overflow: "hidden",
        background:
          "linear-gradient(180deg, #07131d 0%, #08111a 26%, #050c13 100%)",
      }}
    >
      <Box
        aria-hidden="true"
        sx={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "linear-gradient(rgba(148, 163, 184, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(148, 163, 184, 0.05) 1px, transparent 1px)",
          backgroundSize: "72px 72px",
          maskImage:
            "linear-gradient(180deg, rgba(0, 0, 0, 0.9), rgba(0, 0, 0, 0.16) 55%, transparent 100%)",
          pointerEvents: "none",
        }}
      />
      <Box sx={{ position: "relative", zIndex: 1 }}>
        <Hero />
        <HowItWorks />
        <Features />
        <Preview />
        <Credibility />
        <CTA />
      </Box>
    </Box>
  );
}
