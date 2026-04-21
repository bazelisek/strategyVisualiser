"use client";

import Box from "@mui/joy/Box";
import Sheet from "@mui/joy/Sheet";
import Stack from "@mui/joy/Stack";
import Typography from "@mui/joy/Typography";
import { motion } from "framer-motion";
import { cardReveal, sectionReveal, staggerChildren } from "./animations";
import { landingFeatures } from "./data";

export default function Features() {
  return (
    <Box
      component="section"
      id="features"
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
              Feature highlights
            </Typography>
            <Typography level="h2" sx={{ fontSize: { xs: "2rem", md: "2.8rem" } }}>
              Built for reading strategy behavior, not just calculating a number.
            </Typography>
            <Typography level="body-lg" sx={{ color: "rgba(226, 232, 240, 0.72)", lineHeight: 1.8 }}>
              Each run focuses on what developers and traders need next:
              markers on the chart, clear metrics, and safe execution of custom
              code.
            </Typography>
          </Stack>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.12 }}
          variants={staggerChildren(0.08)}
        >
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(2, minmax(0, 1fr))",
                xl: "repeat(3, minmax(0, 1fr))",
              },
              gap: 2,
            }}
          >
            {landingFeatures.map((feature) => {
              const FeatureIcon = feature.icon;

              return (
                <motion.div
                  key={feature.title}
                  variants={cardReveal}
                  whileHover={{
                    scale: 1.02,
                    y: -6,
                  }}
                  transition={{ duration: 0.22 }}
                >
                  <Sheet
                    variant="soft"
                    sx={{
                      height: "100%",
                      borderRadius: "24px",
                      p: 2.5,
                      border: "1px solid rgba(56, 189, 248, 0.14)",
                      background:
                        "linear-gradient(180deg, rgba(9, 18, 28, 0.92), rgba(7, 15, 25, 0.78))",
                      boxShadow:
                        "0 18px 40px rgba(2, 8, 23, 0.24), inset 0 1px 0 rgba(255, 255, 255, 0.03)",
                      transition: "box-shadow 0.22s ease, border-color 0.22s ease",
                      "&:hover": {
                        borderColor: "rgba(45, 212, 191, 0.35)",
                        boxShadow:
                          "0 24px 54px rgba(0, 0, 0, 0.32), 0 0 0 1px rgba(45, 212, 191, 0.12)",
                      },
                    }}
                  >
                    <Stack spacing={2}>
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
                        <FeatureIcon />
                      </Box>
                      <Box>
                        <Typography level="title-lg" sx={{ mb: 0.75 }}>
                          {feature.title}
                        </Typography>
                        <Typography
                          level="body-md"
                          sx={{ color: "rgba(226, 232, 240, 0.72)", lineHeight: 1.75 }}
                        >
                          {feature.description}
                        </Typography>
                      </Box>
                    </Stack>
                  </Sheet>
                </motion.div>
              );
            })}
          </Box>
        </motion.div>
      </Box>
    </Box>
  );
}
