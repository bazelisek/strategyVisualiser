"use client";

import * as React from "react";
import {
  Box,
  Button,
  Sheet,
  Tabs,
  TabList,
  Tab,
  Dropdown,
  Menu,
  MenuButton,
  MenuItem,
  Typography,
} from "@mui/joy";
import Add from "@mui/icons-material/Add";
import { AnimatePresence, motion } from "framer-motion";

export type EditableTabItem = {
  id?: string; // optional but recommended for unique keys
  name: string;
  [key: string]: unknown;
};

export type EditableTabsProps<T extends EditableTabItem = EditableTabItem> = {
  availableTabs: T[];
  selectedTab: string | null;
  onTabChange: (tabName: string | null) => void;
  getTabLabel?: (tab: T) => React.ReactNode;
  preventDuplicates?: boolean;
  className?: string;
};

const fadeSlide = {
  initial: { opacity: 0, y: 8, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: 8, scale: 0.98 },
};

function haveSameTabNames<T extends EditableTabItem>(a: T[], b: T[]) {
  return (
    a.length === b.length &&
    a.every((tab, index) => tab.name === b[index]?.name)
  );
}

export function EditableTabs<T extends EditableTabItem = EditableTabItem>({
  availableTabs,
  selectedTab,
  onTabChange,
  getTabLabel,
  preventDuplicates = true,
  className,
}: EditableTabsProps<T>) {
  const [displayedTabs, setDisplayedTabs] = React.useState<T[]>(() => {
    if (!selectedTab) return availableTabs[0] ? [availableTabs[0]] : [];
    const selected = availableTabs.find((tab) => tab.name === selectedTab);
    return selected ? [selected] : [];
  });
  const [pickerOpen, setPickerOpen] = React.useState(false);

  // 🔒 Safe add (prevents duplicates always)
  const addUnique = React.useCallback(
    (prev: T[], tab: T) => {
      if (preventDuplicates && prev.some((t) => t.name === tab.name)) {
        return prev;
      }
      return [...prev, tab];
    },
    [preventDuplicates]
  );

  const addableTabs = React.useMemo(() => {
    if (!preventDuplicates) return availableTabs;
    const displayedNames = new Set(displayedTabs.map((t) => t.name));
    return availableTabs.filter((tab) => !displayedNames.has(tab.name));
  }, [availableTabs, displayedTabs, preventDuplicates]);

  React.useEffect(() => {
    setDisplayedTabs((prev) => {
      const availableByName = new Map(
        availableTabs.map((tab) => [tab.name, tab] as const)
      );
      const nextTabs = prev
        .filter((tab) => availableByName.has(tab.name))
        .map((tab) => availableByName.get(tab.name) ?? tab);

      const fallbackSelectedTab =
        selectedTab ?? nextTabs[0]?.name ?? availableTabs[0]?.name ?? null;
      if (fallbackSelectedTab) {
        const selected = availableByName.get(fallbackSelectedTab);
        if (
          selected &&
          !nextTabs.some((tab) => tab.name === fallbackSelectedTab)
        ) {
          nextTabs.unshift(selected);
        }
      }

      return haveSameTabNames(prev, nextTabs) ? prev : nextTabs;
    });
  }, [selectedTab, availableTabs]);

  React.useEffect(() => {
    if (selectedTab || displayedTabs.length === 0) return;
    onTabChange(displayedTabs[0].name);
  }, [displayedTabs, onTabChange, selectedTab]);

  const handleAddTab = (tab: T) => {
    setDisplayedTabs((prev) => addUnique(prev, tab));
    onTabChange(tab.name);
    setPickerOpen(false);
  };

  const handleRemoveTab = (tabName: string) => {
    setDisplayedTabs((prev) => {
      const nextTabs = prev.filter((tab) => tab.name !== tabName);

      if (selectedTab === tabName) {
        onTabChange(nextTabs[0]?.name ?? null);
      }

      return nextTabs;
    });
  };

  React.useEffect(() => {
    if (!selectedTab) return;

    const existsInAvailableTabs = availableTabs.some(
      (tab) => tab.name === selectedTab
    );

    if (!existsInAvailableTabs) {
      const fallbackTab = displayedTabs[0]?.name ?? availableTabs[0]?.name ?? null;
      if (fallbackTab !== selectedTab) {
        onTabChange(fallbackTab);
      }
    }
  }, [availableTabs, displayedTabs, selectedTab, onTabChange]);

  return (
    <Sheet
      variant="outlined"
      className={className}
      sx={{
        p: 1,
        borderRadius: "lg",
        display: "flex",
        alignItems: "center",
        gap: 1,
        overflow: "auto",
        width: "100%",
      }}
    >
      <Tabs
        value={selectedTab}
        onChange={(_, value) => onTabChange((value as string) ?? null)}
        sx={{ flex: 1, minWidth: 0 }}
      >
        <TabList
          variant="plain"
          sx={{
            gap: 0.75,
            flexWrap: "wrap",
            alignItems: "center",
            p: 0,
            m: 0,
            "--Tab-minHeight": "36px",
            "--Tab-gap": "6px",
            bgcolor: "transparent",
          }}
        >
          <AnimatePresence initial={false} mode="popLayout">
            {displayedTabs.map((tab, index) => (
              <motion.div
                key={tab.id ?? `${tab.name}-${index}`} // ✅ safe key
                layout
                initial="initial"
                animate="animate"
                exit="exit"
                variants={fadeSlide}
                transition={{ duration: 0.18, ease: "easeOut" }}
                style={{ display: "inline-flex" }}
              >
                <Tab
                  value={tab.name}
                  sx={{
                    borderRadius: "md",
                    px: 1.5,
                    py: 0.75,
                    whiteSpace: "nowrap",
                  }}
                  indicatorInset
                  component="div"
                >
                  <Box
                    sx={{ display: "inline-flex", alignItems: "center", gap: 1 }}
                  >
                    <Typography level="body-sm">
                      {getTabLabel ? getTabLabel(tab) : tab.name}
                    </Typography>
                    <Button
                      size="sm"
                      variant="plain"
                      color="neutral"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveTab(tab.name);
                      }}
                      sx={{
                        minHeight: 24,
                        minWidth: 24,
                        p: 0,
                        borderRadius: "50%",
                      }}
                    >
                      ×
                    </Button>
                  </Box>
                </Tab>
              </motion.div>
            ))}
          </AnimatePresence>
        </TabList>
      </Tabs>

      <Dropdown
        open={pickerOpen}
        onOpenChange={(_, open) => setPickerOpen(open)}
      >
        <MenuButton
          slots={{ root: Button }}
          slotProps={{
            root: {
              variant: "soft",
              color: "primary",
              startDecorator: <Add />,
              sx: { flexShrink: 0 },
            },
          }}
        >
          Add
        </MenuButton>

        <Menu sx={{ minWidth: 220 }}>
          {addableTabs.length === 0 ? (
            <MenuItem disabled>No tabs left to add</MenuItem>
          ) : (
            addableTabs.map((tab) => (
              <MenuItem
                key={tab.id ?? tab.name}
                onClick={() => handleAddTab(tab)}
              >
                {getTabLabel ? getTabLabel(tab) : tab.name}
              </MenuItem>
            ))
          )}
        </Menu>
      </Dropdown>
    </Sheet>
  );
}

export default EditableTabs;
