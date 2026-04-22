"use client";

import CodeUpload from "@/components/Input/File/Strategies/CodeUpload";
import JSONOptions from "@/components/Input/File/Strategies/JSONOptionsUpload";
import {
  Button,
  FormControl,
  FormLabel,
  Input,
  Sheet,
  Stack,
  Textarea,
} from "@mui/joy";
import { Checkbox } from "@mui/joy";
import { useRef, useState } from "react";
import { updateStrategy } from "./actions";

export default function EditStrategyForm({
  strategyId,
  initialName,
  initialDescription,
  initialIsPublic,
}: {
  strategyId: string;
  initialName: string;
  initialDescription: string;
  initialIsPublic: boolean;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [resetTrigger, setResetTrigger] = useState(0);

  async function handleSubmit(formData: FormData) {
    await updateStrategy(strategyId, formData);
    formRef.current?.reset();
    setResetTrigger((current) => current + 1);
  }

  return (
    <Stack alignItems={"center"}>
      <Sheet
        sx={{
          p: 5,
          m: 5,
          borderRadius: 20,
          width: { sm: "100%", lg: "40%" },
        }}
      >
        <h2>Edit Strategy</h2>
        <form
          ref={formRef}
          action={handleSubmit}
          style={{ gap: 12, display: "flex", flexDirection: "column" }}
        >
          <FormControl>
            <FormLabel required>Strategy Name</FormLabel>
            <Input
              placeholder="My Strategy"
              name="strategyName"
              defaultValue={initialName}
            />
          </FormControl>
          <FormControl>
            <FormLabel>Description</FormLabel>
            <Textarea
              placeholder="Type something..."
              name="strategyDescription"
              defaultValue={initialDescription}
            />
          </FormControl>
          <FormControl>
            <FormLabel>Public</FormLabel>
            <Checkbox defaultChecked={initialIsPublic} name="strategyIsPublic" />
          </FormControl>
          <CodeUpload
            onFileUpload={() => {}}
            name="strategyCode"
            resetTrigger={resetTrigger}
          />
          <JSONOptions
            onConfigUpload={() => {}}
            name="strategyConfig"
            resetTrigger={resetTrigger}
            label="Configuration Options"
          />
          <JSONOptions
            onConfigUpload={() => {}}
            name="strategyRequirements"
            resetTrigger={resetTrigger}
            label="Requirements"
          />
          <div>
            <Button type="submit">Save</Button>
          </div>
        </form>
      </Sheet>
    </Stack>
  );
}
