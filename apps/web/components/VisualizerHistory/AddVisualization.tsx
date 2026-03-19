"use client";
import { useGetAuthStatus } from "@/auth/useGetAuthStatus";
import { VisualizerParams } from "@/util/visualizerTypes";
import { Button } from "@mui/joy";
import { useRouter } from "next/navigation";
import { configInitialState } from "@/store/slices/configSlice";

const AddVisualization = ({
  params,
}: {
  params: {
    id?: string | undefined;
    name: string;
    params: VisualizerParams;
    createdAt?: number;
    updatedAt?: number;
  };
}) => {
  const { isAuthenticated } = useGetAuthStatus();
  const router = useRouter();

  async function handleClick() {
    if (!isAuthenticated) {
      console.error("User is not authenticated");
      return;
    }

    try {
      const res = await fetch("/api/history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: params.id,
          name: params.name,
          params: {
            ...params.params,
            defaults: params.params.defaults ?? configInitialState,
          },
          createdAt: params.createdAt,
          updatedAt: params.updatedAt,
        }),
      });

      if (!res.ok) {
        console.error("Failed to add visualization");
        return;
      }
      const data = await res.json();
      const newId = data?.item?.id ?? params.id;
      if (newId) {
        router.push(`/visualize/${newId}`);
      } else {
        console.error("Missing new visualization id");
      }
    } catch (error) {
      console.error("Failed to add visualization", error);
    }
  }
  return <Button onClick={handleClick}>Add Visualization</Button>;
};

export default AddVisualization;
