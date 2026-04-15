import VerifyAuth from "@/auth/VerifyAuth";
import { getServerSession } from "@/auth/server";
import getStrategy from "@/util/strategies/getStrategy";
import { redirect } from "next/navigation";
import EditStrategyForm from "./EditStrategyForm";

export default async function EditStrategyPage({
  params,
}: {
  params: Promise<{ strategy: string }>;
}) {
  const { strategy: strategyId } = await params;
  const strategy = await getStrategy(strategyId);
  const session = await getServerSession();

  if (!strategy) {
    redirect("/strategies");
  }

  if (session?.user?.email !== strategy.ownerUser.email) {
    redirect(`/strategies/${strategyId}`);
  }

  return (
    <VerifyAuth>
      <EditStrategyForm
        strategyId={strategyId}
        initialName={strategy.name}
        initialDescription={strategy.description}
        initialIsPublic={strategy.isPublic}
      />
    </VerifyAuth>
  );
}
