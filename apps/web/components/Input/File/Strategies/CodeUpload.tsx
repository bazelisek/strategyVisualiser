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
    files,
  }: {
    files: File[];
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
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) {
      setInfo({ error: true, message: "No file was uploaded", display: true });
      return;
    }

    try {
      const fileNames = files.map((file) => file.name);
      setInfo({
        error: false,
        message:
          files.length === 1
            ? `File ${fileNames[0]} was successfully uploaded.`
            : `${files.length} files were successfully uploaded: ${fileNames.join(", ")}`,
        display: true,
      });
      onFileUpload?.({ files });
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
        accept=".java,.py"
        name={name}
        multiple
        onChange={handleFileUpload}
        displayName="Strategy Files"
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
