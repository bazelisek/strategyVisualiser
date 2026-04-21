"use client";

import Box from "@mui/joy/Box";
import Sheet from "@mui/joy/Sheet";
import Stack from "@mui/joy/Stack";
import Typography from "@mui/joy/Typography";
import { motion } from "framer-motion";
import { cardReveal, sectionReveal, staggerChildren } from "./animations";
import {
  credibilityItems,
  credibilityNotes,
  infrastructurePoints,
} from "./data";

export default function Credibility() {
  return (
    <Box
      component="section"
      id="credibility"
      sx={{
        px: { xs: 2, sm: 3, md: 5 },
        py: { xs: 7, md: 9 },
      }}
    >
      <Box sx={{ width: "100%", maxWidth: "1240px", mx: "auto" }}>
        <Stack direction={{ xs: "column", xl: "row" }} spacing={3}>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={sectionReveal}
            style={{ flex: 0.95 }}
          >
            <Stack spacing={1.5} sx={{ maxWidth: "560px" }}>
              <Typography
                level="body-sm"
                sx={{ textTransform: "uppercase", letterSpacing: "0.22em", color: "#7dd3fc" }}
              >
                Technical credibility
              </Typography>
              <Typography level="h2" sx={{ fontSize: { xs: "2rem", md: "2.8rem" } }}>
                Built with tools that fit financial workflows and safe code execution.
              </Typography>
              <Typography level="body-lg" sx={{ color: "rgba(226, 232, 240, 0.72)", lineHeight: 1.8 }}>
                The platform is explicit about where strategy code runs and
                what it can access. There is no vague black box between the
                Java class you write and the chart you inspect.
              </Typography>

              <Stack spacing={1}>
                {credibilityNotes.map((note) => (
                  <Typography
                    key={note}
                    level="body-md"
                    sx={{ color: "rgba(226, 232, 240, 0.74)" }}
                  >
                    {note}
                  </Typography>
                ))}
              </Stack>
            </Stack>
          </motion.div>

          <Stack spacing={2} sx={{ flex: 1.15 }}>
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.15 }}
              variants={staggerChildren(0.08)}
            >
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "1fr",
                    md: "repeat(2, minmax(0, 1fr))",
                  },
                  gap: 2,
                }}
              >
                {credibilityItems.map((item) => (
                  <motion.div key={item.title} variants={cardReveal}>
                    <Sheet
                      variant="soft"
                      sx={{
                        height: "100%",
                        borderRadius: "24px",
                        p: 2.5,
                        border: "1px solid rgba(56, 189, 248, 0.14)",
                        background:
                          "linear-gradient(180deg, rgba(9, 18, 28, 0.92), rgba(7, 15, 25, 0.78))",
                      }}
                    >
                      <Typography level="title-lg" sx={{ mb: 0.75 }}>
                        {item.title}
                      </Typography>
                      <Typography
                        level="body-md"
                        sx={{ color: "rgba(226, 232, 240, 0.72)", lineHeight: 1.75 }}
                      >
                        {item.description}
                      </Typography>
                    </Sheet>
                  </motion.div>
                ))}
              </Box>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
              variants={cardReveal}
            >
              <Sheet
                variant="soft"
                sx={{
                  borderRadius: "28px",
                  p: 2.5,
                  border: "1px solid rgba(45, 212, 191, 0.18)",
                  background:
                    "linear-gradient(180deg, rgba(6, 14, 23, 0.98), rgba(4, 11, 19, 0.9))",
                }}
              >
                <Stack spacing={2}>
                  <Typography level="title-lg">Execution profile</Typography>
                  <Box
                    component="pre"
                    sx={{
                      m: 0,
                      p: 2,
                      borderRadius: "18px",
                      border: "1px solid rgba(148, 163, 184, 0.12)",
                      bgcolor: "rgba(9, 16, 24, 0.68)",
                      color: "#dbeafe",
                      fontFamily: "var(--font-mono)",
                      fontSize: "0.95rem",
                      overflowX: "auto",
                    }}
                  >
                    {`network_access = disabled
container_memory = capped
container_cpu = pinned
filesystem = isolated`}
                  </Box>
                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: {
                        xs: "1fr",
                        md: "repeat(3, minmax(0, 1fr))",
                      },
                      gap: 1.5,
                    }}
                  >
                    {infrastructurePoints.map((point) => {
                      const PointIcon = point.icon;

                      return (
                        <Sheet
                          key={point.label}
                          variant="outlined"
                          sx={{
                            borderRadius: "20px",
                            p: 1.5,
                            borderColor: "rgba(148, 163, 184, 0.14)",
                            bgcolor: "rgba(8, 16, 24, 0.45)",
                          }}
                        >
                          <Stack direction="row" spacing={1.25} alignItems="center">
                            <Box
                              sx={{
                                width: 38,
                                height: 38,
                                display: "grid",
                                placeItems: "center",
                                borderRadius: "12px",
                                bgcolor: "rgba(45, 212, 191, 0.1)",
                                color: "#67e8f9",
                              }}
                            >
                              <PointIcon fontSize="small" />
                            </Box>
                            <Box>
                              <Typography level="body-xs" sx={{ color: "rgba(148, 163, 184, 0.8)" }}>
                                {point.label}
                              </Typography>
                              <Typography level="title-sm">{point.value}</Typography>
                            </Box>
                          </Stack>
                        </Sheet>
                      );
                    })}
                  </Box>
                </Stack>
              </Sheet>
            </motion.div>
          </Stack>
        </Stack>
      </Box>
    </Box>
  );
}
