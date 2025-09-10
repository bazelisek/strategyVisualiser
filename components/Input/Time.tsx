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
  children,
}) => {
  const fromDate = valueFrom ? new Date(valueFrom) : null;
  const toDate = valueTo ? new Date(valueTo) : null;

  // helper: normalize to 13:30 if only date is picked
  const normalizeToMidnight = (date: Date) => {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    if (hours === 0 && minutes === 0) {
      date.setHours(0, 0, 0, 0);
    }
    return date;
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
                  const fixed = normalizeToMidnight(newValue);
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
              }}
            />

            <DateTimePicker
              label="To"
              value={toDate}
              onChange={(newValue) => {
                if (newValue) {
                  const fixed = normalizeToMidnight(newValue);
                  const newDate = new Date(
                    fixed.getTime() + (23 * 60 + 59) * 60 * 1000
                  ); // set to end of day
                  onChange({
                    target: {
                      name: "period2",
                      value: format(newDate, "yyyy-MM-dd'T'HH:mm"),
                    },
                  } as React.ChangeEvent<HTMLInputElement>);
                }
              }}
              format="dd.MM.yyyy HH:mm"
              minDateTime={fromDate || undefined} // ensures To > From
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
