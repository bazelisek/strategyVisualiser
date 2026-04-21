"use client";

import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import Box from "@mui/joy/Box";
import Sheet from "@mui/joy/Sheet";
import Stack from "@mui/joy/Stack";
import Typography from "@mui/joy/Typography";
import { motion } from "framer-motion";
import { cardReveal, sectionReveal, staggerChildren } from "./animations";
import { landingSteps } from "./data";

export default function HowItWorks() {
  return (
    <Box
      component="section"
      id="how-it-works"
      sx={{
        px: { xs: 2, sm: 3, md: 5 },
        py: { xs: 7, md: 9 },
      }}
    >
      <Box sx={{ width: "100%", maxWidth: "1240px", mx: "auto" }}>
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={sectionReveal}
        >
          <Stack spacing={1.5} sx={{ maxWidth: "720px", mb: 4 }}>
            <Typography
              level="body-sm"
              sx={{ textTransform: "uppercase", letterSpacing: "0.22em", color: "#7dd3fc" }}
            >
              How it works
            </Typography>
            <Typography level="h2" sx={{ fontSize: { xs: "2rem", md: "2.8rem" } }}>
              A direct workflow from strategy code to trade-level evidence.
            </Typography>
            <Typography level="body-lg" sx={{ color: "rgba(226, 232, 240, 0.72)", lineHeight: 1.8 }}>
              The page stays focused on the four steps that matter: author the
              strategy, run it safely, inspect the markers, and evaluate the
              outcome.
            </Typography>
          </Stack>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.15 }}
          variants={staggerChildren(0.12)}
        >
          <Stack direction={{ xs: "column", xl: "row" }} spacing={2}>
            {landingSteps.map((step, index) => {
              const StepIcon = step.icon;
              const isLast = index === landingSteps.length - 1;

              return (
                <Stack
                  key={step.title}
                  direction={{ xs: "column", xl: "row" }}
                  spacing={2}
                  sx={{ flex: 1 }}
                >
                  <motion.div variants={cardReveal} style={{ flex: 1 }}>
                    <Sheet
                      variant="soft"
                      sx={{
                        height: "100%",
                        borderRadius: "24px",
                        p: 2.5,
                        border: "1px solid rgba(56, 189, 248, 0.14)",
                        background:
                          "linear-gradient(180deg, rgba(10, 18, 28, 0.92), rgba(7, 16, 25, 0.78))",
                        boxShadow: "0 22px 44px rgba(2, 8, 23, 0.32)",
                      }}
                    >
                      <Stack spacing={2}>
                        <Stack
                          direction="row"
                          justifyContent="space-between"
                          alignItems="center"
                        >
                          <Box
                            sx={{
                              width: 48,
                              height: 48,
                              borderRadius: "16px",
                              display: "grid",
                              placeItems: "center",
                              bgcolor: "rgba(45, 212, 191, 0.12)",
                              color: "#67e8f9",
                            }}
                          >
                            <StepIcon />
                          </Box>
                          <Typography
                            level="title-sm"
                            sx={{ color: "rgba(125, 211, 252, 0.7)", fontFamily: "var(--font-mono)" }}
                          >
                            0{index + 1}
                          </Typography>
                        </Stack>
                        <Box>
                          <Typography level="title-lg" sx={{ mb: 0.75 }}>
                            {step.title}
                          </Typography>
                          <Typography level="body-md" sx={{ color: "rgba(226, 232, 240, 0.72)", lineHeight: 1.75 }}>
                            {step.description}
                          </Typography>
                        </Box>
                        <Typography
                          level="body-sm"
                          sx={{ color: "#5eead4", fontFamily: "var(--font-mono)" }}
                        >
                          {step.detail}
                        </Typography>
                      </Stack>
                    </Sheet>
                  </motion.div>
                  {!isLast && (
                    <Box
                      sx={{
                        display: { xs: "none", xl: "grid" },
                        placeItems: "center",
                        color: "rgba(125, 211, 252, 0.48)",
                        minWidth: 28,
                      }}
                    >
                      <ArrowForwardRoundedIcon />
                    </Box>
                  )}
                </Stack>
              );
            })}
          </Stack>
        </motion.div>
      </Box>
    </Box>
  );
}
