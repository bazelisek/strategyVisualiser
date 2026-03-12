import VerifyAuth from "@/auth/VerifyAuth";
import VisualizerHistory from "@/components/VisualizerHistory/VisualizerHistory";
import React from "react";

const Page: React.FC = () => {
  return (
    <VerifyAuth>
      <div className="page" style={{ alignItems: "flex-start" }}>
        <VisualizerHistory />
      </div>
    </VerifyAuth>
  );
};

export default Page;
