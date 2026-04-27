"use client";

import { Button } from "@mui/joy";
import DeleteIcon from "@mui/icons-material/Delete";
import { useFormStatus } from "react-dom";
import { deleteStrategyAction } from "./edit/actions";

function SubmitDeleteButton() {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      size="sm"
      variant="soft"
      color="danger"
      startDecorator={<DeleteIcon />}
      loading={pending}
    >
      Delete
    </Button>
  );
}

export default function DeleteStrategyButton({
  strategyId,
}: {
  strategyId: string;
}) {
  const deleteAction = deleteStrategyAction.bind(null, strategyId);

  return (
    <form
      action={deleteAction}
      onSubmit={(event) => {
        if (!window.confirm("Delete this strategy permanently?")) {
          event.preventDefault();
        }
      }}
    >
      <SubmitDeleteButton />
    </form>
  );
}
