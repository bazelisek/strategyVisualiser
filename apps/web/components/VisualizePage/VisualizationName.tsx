import { updateVisualization } from "@/app/actions/updateVisualization";
import { authClient } from "@/auth-client";
import { useVisualization } from "@/hooks/useVisualization";
import { CircularProgress, Input, Typography } from "@mui/joy";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

export default function VisualizationName({ id }: { id: string }) {
  const { visualization, error, isLoading } = useVisualization(id);
  console.log(visualization);
  const [name, setName] = useState<string>("");

  async function handleTitleUpdate() {
    await updateVisualization(id, { name: name });
  }

  useEffect(() => {
    if (visualization?.name) {
      setName(visualization.name);
    }
  }, [visualization?.name]);
  useEffect(() => {
    if (!name || name === visualization?.name) return;

    const timeout = setTimeout(() => {
      handleTitleUpdate();
    }, 500);

    return () => clearTimeout(timeout);
  }, [name, visualization?.name]);

  if (isLoading) return <CircularProgress />;

  if (error) {
    return (
      <div>
        <Typography>Couldn't fetch visualization name.</Typography>
        <Typography>{error}</Typography>
      </div>
    );
  }

  return <Input value={name} onChange={(e) => setName(e.target.value)} />;
}
