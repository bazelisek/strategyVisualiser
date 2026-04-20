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
import { createStrategy } from "./actions";
import VerifyAuth from "@/auth/VerifyAuth";

export default function NewStrategyPage() {
  const formRef = useRef<HTMLFormElement>(null);
  const [resetTrigger, setResetTrigger] = useState(0);

  async function handleSubmit(formData: FormData) {
    await createStrategy(formData);
    formRef.current?.reset();
    setResetTrigger((current) => current + 1);
  }

  return (
    <VerifyAuth>
      <Stack alignItems={"center"}>
        <Sheet
          sx={{
            p: 5,
            m: 5,
            borderRadius: 20,
            width: { sm: "100%", lg: "40%" },
          }}
        >
          <h2>New Strategy</h2>
          <form
            ref={formRef}
            action={handleSubmit}
            style={{ gap: 12, display: "flex", flexDirection: "column" }}
          >
            <FormControl>
              <FormLabel required>Strategy Name</FormLabel>
              <Input placeholder="My Strategy" name="strategyName" />
            </FormControl>
            <FormControl>
              <FormLabel>Description</FormLabel>
              <Textarea
                placeholder="Type something..."
                name="strategyDescription"
              ></Textarea>
            </FormControl>
            <FormControl>
              <FormLabel>Public</FormLabel>
              <Checkbox defaultChecked={false} name="strategyIsPublic" />
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
              <Button type="submit">Submit</Button>
            </div>
          </form>
        </Sheet>
      </Stack>
    </VerifyAuth>
  );
}
