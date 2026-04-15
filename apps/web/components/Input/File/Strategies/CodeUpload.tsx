import { FormControl, FormHelperText, FormLabel } from "@mui/joy";
import React, { ChangeEvent, useEffect, useState } from "react";
import UploadFile from "../UploadFile";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";

const CodeUpload = ({
  onFileUpload,
  name,
  resetTrigger,
}: {
  onFileUpload?: ({
    file,
    fileText,
  }: {
    file: File;
    fileText: string;
  }) => void;
  name?: string;
  resetTrigger?: number;
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
    }

    const fileText = await file!.text();
    try {
      // maybe perform checks

      setInfo({
        error: false,
        message: "File " + file!.name + " was successfully uploaded.",
        display: true,
      });
      onFileUpload?.({ file: file!, fileText });
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
      <FormLabel>Strategy Code</FormLabel>
      <UploadFile
        accept=".java"
        name={name}
        onChange={handleFileUpload}
        displayName="Java Code"
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

export default CodeUpload;
