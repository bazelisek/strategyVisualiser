"use client";
import React, { ReactNode } from "react";
import type { IndicatorKey } from "@/util/indicators";
import { indicatorDefinitions } from "@/util/indicators";
import DropdownBox from "../Form/DropdownBox";

interface NewIndicatorDropdownProps {
  children?: ReactNode;
  onChange: (value: IndicatorKey) => void;
  setOpen: (value: React.SetStateAction<boolean>) => void;
}

const NewIndicatorDropdown: React.FC<NewIndicatorDropdownProps> = ({
  onChange,
  setOpen,
}) => {
  const displayChoices = indicatorDefinitions.map((def) => def.displayName);

  function handleChange(displayName: string) {
    const key = indicatorDefinitions.find(
      (def) => def.displayName === displayName
    )?.key as IndicatorKey | undefined;
    if (key) onChange(key);
  }
  return (
    <DropdownBox
      options={displayChoices}
      onChange={handleChange}
      setOpen={setOpen}
    />
  );
};

export default NewIndicatorDropdown;
