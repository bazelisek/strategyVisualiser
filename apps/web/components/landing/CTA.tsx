"use client";

import ArrowOutwardRoundedIcon from "@mui/icons-material/ArrowOutwardRounded";
import Box from "@mui/joy/Box";
import Button from "@mui/joy/Button";
import Sheet from "@mui/joy/Sheet";
import Stack from "@mui/joy/Stack";
import Typography from "@mui/joy/Typography";
import { motion } from "framer-motion";
import NextLink from "next/link";
import { cardReveal } from "./animations";

export default function CTA() {
  return (
    <Box
      component="section"
      sx={{
        px: { xs: 2, sm: 3, md: 5 },
        pt: { xs: 4, md: 5 },
        pb: { xs: 8, md: 10 },
      }}
    >
      <Box sx={{ width: "100%", maxWidth: "1240px", mx: "auto" }}>
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={cardReveal}
        >
          <Sheet
            variant="soft"
            sx={{
              position: "relative",
              overflow: "hidden",
              borderRadius: "32px",
              px: { xs: 2.5, md: 4.5 },
              py: { xs: 4, md: 5 },
              border: "1px solid rgba(45, 212, 191, 0.16)",
              background:
                "linear-gradient(135deg, rgba(10, 20, 31, 0.98), rgba(4, 13, 22, 0.92))",
              boxShadow: "0 28px 64px rgba(2, 8, 23, 0.38)",
            }}
          >
            <Box
              aria-hidden="true"
              sx={{
                position: "absolute",
                inset: 0,
                background:
                  "radial-gradient(circle at 22% 20%, rgba(45, 212, 191, 0.12), transparent 28%), radial-gradient(circle at 78% 78%, rgba(96, 165, 250, 0.12), transparent 30%)",
              }}
            />
            <Stack
              spacing={2}
              sx={{
                position: "relative",
                zIndex: 1,
                textAlign: { xs: "left", md: "center" },
                alignItems: { xs: "flex-start", md: "center" },
              }}
            >
              <Typography level="h2" sx={{ fontSize: { xs: "2.2rem", md: "3.2rem" } }}>
                Stop guessing. Start testing.
              </Typography>
              <Typography
                level="body-lg"
                sx={{
                  maxWidth: "56ch",
                  color: "rgba(226, 232, 240, 0.72)",
                  lineHeight: 1.8,
                }}
              >
                Bring strategy code, run it in a sandbox, inspect the trade
                markers, and decide with evidence instead of intuition.
              </Typography>
              <Button
                component={NextLink}
                href="/login"
                size="lg"
                endDecorator={<ArrowOutwardRoundedIcon />}
                sx={{
                  px: 2.6,
                  py: 1.2,
                  bgcolor: "#2dd4bf",
                  color: "#051218",
                  "&:hover": {
                    bgcolor: "#5eead4",
                  },
                }}
              >
                Create your first strategy
              </Button>
            </Stack>
          </Sheet>
        </motion.div>
      </Box>
    </Box>
  );
}
