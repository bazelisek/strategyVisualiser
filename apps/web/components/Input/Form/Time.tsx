import React, { ReactNode } from "react";
import AnimationWrapper from "./AnimationWrapper";

import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { format } from "date-fns";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { Requirements } from "./Form";

interface TimeProps {
  children?: ReactNode;
  valueFrom: string;
  valueTo: string;
  onChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => void;
  handleContinue: () => void;
  modalContainerRef?: React.RefObject<HTMLElement | null>;
  requirements?: Requirements;
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
  requirements,
}) => {
  let fromDate: Date | null = valueFrom ? new Date(valueFrom) : null;

  const minDate = requirements?.period?.min
    ? new Date(requirements.period.min * 1000)
    : null;

  if (fromDate && minDate && fromDate < minDate) {
    fromDate = minDate;
  }
  let toDate: Date | null = valueTo ? new Date(valueTo) : null;
  const maxDate = requirements?.period?.max
    ? new Date(requirements.period.max * 1000)
    : null;

  if (toDate && maxDate && toDate > maxDate) {
    toDate = maxDate;
  }

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
              maxDateTime={toDate || maxDate || new Date()} // ensures From < To
              minDateTime={minDate || undefined}
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
              minDateTime={fromDate || minDate || undefined}
              maxDateTime={maxDate || new Date()}
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
