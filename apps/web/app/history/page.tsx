import VerifyAuth from "@/auth/VerifyAuth";
import VisualizerHistory from "@/components/VisualizerHistory/VisualizerHistory";
import React, { type ReactNode } from "react";

interface PageProps {
  children?: ReactNode;
}

const Page: React.FC<PageProps> = (props) => {
  return (
    <VerifyAuth>
      <div className="page" style={{ alignItems: "flex-start" }}>
        <VisualizerHistory />
      </div>
    </VerifyAuth>
  );
};

export default Page;
