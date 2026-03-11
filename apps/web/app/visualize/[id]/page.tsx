import VerifyAuth from "@/auth/VerifyAuth";
import VisualizePage from "@/components/VisualizePage/VisualizePage";

async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  // use id
  return (
    <VerifyAuth>
      <VisualizePage id={id} />
    </VerifyAuth>
  );
}

export default Page;
