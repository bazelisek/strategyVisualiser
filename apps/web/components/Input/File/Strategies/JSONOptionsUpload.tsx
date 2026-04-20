import React, { ChangeEvent, useEffect, useState } from "react";
import UploadFile from "../UploadFile";
import { FormControl, FormHelperText, FormLabel } from "@mui/joy";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import {
  type ConfigOptions,
  parseUserConfigOptions,
} from "@/util/strategies/configuration";

interface JSONOptionsProps {
  onConfigUpload?: ({
    parsedConfig,
    stringConfig,
  }: {
    parsedConfig: ConfigOptions;
    stringConfig: string;
  }) => void;
  name?: string;
  resetTrigger?: number;
  label: string;
}

const JSONOptions: React.FC<JSONOptionsProps> = ({
  onConfigUpload,
  name,
  resetTrigger,
  label
}) => {
  const [info, setInfo] = useState({
    error: false,
    message: "",
    display: false,
  });

  useEffect(() => {
    setInfo({
      error: false,
      message: "",
      display: false,
    });
  }, [resetTrigger]);

  async function handleFileUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) {
      setInfo({ error: true, message: "No file was uploaded", display: true });
      return;
    }

    const fileText = await file.text();
    try {
      const parsedConfig = parseUserConfigOptions(fileText);

      setInfo({
        error: false,
        message: "File " + file.name + " was successfully uploaded.",
        display: true,
      });
      onConfigUpload?.({ parsedConfig, stringConfig: fileText });
    } catch (e) {
      setInfo({
        error: true,
        message: e instanceof Error ? e.message : "An unknown error occurred",
        display: true,
      });
    }
  }
  return (
    <FormControl error={info.error}>
      <FormLabel>{label}</FormLabel>
      <UploadFile
        accept=".json"
        name={name}
        displayName={"Configuration"}
        onChange={handleFileUpload}
      />
      {info.display && (
        <FormHelperText>
          <InfoOutlinedIcon />
          {info.message}
        </FormHelperText>
      )}
    </FormControl>
  );
};

export default JSONOptions;
