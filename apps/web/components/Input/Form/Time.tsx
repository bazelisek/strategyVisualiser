import React, { ReactNode } from "react";
import AnimationWrapper from "./AnimationWrapper";

import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { format } from "date-fns";
import { ThemeProvider } from "@emotion/react";
import { createTheme } from "@mui/material/styles";

interface TimeProps {
  children?: ReactNode;
  valueFrom: string;
  valueTo: string;
  onChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => void;
  handleContinue: () => void;
  modalContainerRef?: React.RefObject<HTMLDivElement>;
}
const darkTheme = createTheme({
  palette: {
    mode: "dark", // this is key
  },
  components: {
    MuiTextField: {
      styleOverrides: {
        root: {
          // optional: tweak padding, colors, etc.
        },
      },
    },
  },
});
const Time: React.FC<TimeProps> = ({
  valueFrom,
  valueTo,
  onChange,
  handleContinue,
  modalContainerRef,
  children,
}) => {
  const fromDate = valueFrom ? new Date(valueFrom) : null;
  const toDate = valueTo ? new Date(valueTo) : null;

  // helper: normalize to 13:30 if only date is picked
  const adjustPickedDate = (date: Date, isToPicker = false) => {
    const now = new Date();

    // strip ms for comparisons
    const picked = new Date(date);
    picked.setSeconds(0, 0);

    const isToday =
      picked.getFullYear() === now.getFullYear() &&
      picked.getMonth() === now.getMonth() &&
      picked.getDate() === now.getDate();

    if (isToday) {
      if (isToPicker) {
        // "To" should not go past current time
        return now;
      } else {
        // "From" today gets current time instead of 00:00
        return now;
      }
    }

    // for non-today dates, you can keep midnight if you want
    return picked;
  };

  return (
    <AnimationWrapper handleContinue={handleContinue}>
      <div>
        <h2>Please select the time period you want to chart the graph for.</h2>
        <ThemeProvider theme={darkTheme}>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DateTimePicker
              label="From"
              value={fromDate}
              onChange={(newValue) => {
                if (newValue) {
                  const fixed = adjustPickedDate(newValue, false);
                  onChange({
                    target: {
                      name: "period1",
                      value: format(fixed, "yyyy-MM-dd'T'HH:mm"),
                    },
                  } as React.ChangeEvent<HTMLInputElement>);
                }
              }}
              format="dd.MM.yyyy HH:mm" // display format
              maxDateTime={toDate || new Date()} // ensures From < To
              slotProps={{
                textField: {
                  fullWidth: true,
                  margin: "normal" as const,
                  InputProps: {
                    sx: {
                      padding: "0.7rem 0.9rem",
                    },
                  },
                },
                popper: {
                  sx: { zIndex: 3002 },
                  // No longer need z-index, but we need to set the container
                  container: modalContainerRef?.current,
                },
              }}
            />

            <DateTimePicker
              label="To"
              value={toDate}
              onChange={(newValue) => {
                if (newValue) {
                  const fixed = adjustPickedDate(newValue, true);
                  onChange({
                    target: {
                      name: "period2",
                      value: format(fixed, "yyyy-MM-dd'T'HH:mm"),
                    },
                  } as React.ChangeEvent<HTMLInputElement>);
                }
              }}
              format="dd.MM.yyyy HH:mm"
              minDateTime={fromDate || undefined}
              maxDateTime={new Date()}
              slotProps={{
                textField: {
                  fullWidth: true,
                  margin: "normal" as const,
                  InputProps: {
                    sx: {
                      padding: "0.7rem 0.9rem",
                    },
                  },
                },
                popper: {
                  sx: { zIndex: 3002 },
                  // No longer need z-index, but we need to set the container
                  container: modalContainerRef?.current,
                },
              }}
            />
          </LocalizationProvider>
        </ThemeProvider>

        {children}
      </div>
    </AnimationWrapper>
  );
};

export default Time;
