"use client";
import { Strategy } from "@/util/strategies/strategies";
import Table from "../common/Table";
import { formatLocalDateTime } from "@/util/time";
import Author from "../User/Author";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function StrategyTable({
  strategies,
  emptyText,
}: {
  strategies: Strategy[];
  emptyText: string;
}) {
  const router = useRouter();
  return (
    <>
      {strategies.length === 0 ? (
        <p>{emptyText}</p>
      ) : (
        <Table
          columns={[
            {
              id: "name",
              header: "Name",
              cell: (row: Strategy) => (
                <Link href={"/strategies/" + row.id}>{row.name}</Link>
              ),
            },
            {
              id: "createdAt",
              header: "Created",
              cell: (row: Strategy) => formatLocalDateTime(row.createdAt),
            },
            {
              id: "updatedAt",
              header: "Updated",
              cell: (row: Strategy) => formatLocalDateTime(row.updatedAt),
            },
            {
              id: "ownerUser",
              header: "Owner",
              cell: (row: Strategy) => (
                <Author user={row.ownerUser} displayUsername />
              ),
            },
          ]}
          rows={strategies}
          slotProps={{
            bodyRow: ({ row, rowIndex }) => ({
              onClick: () => {
                router.push("/strategies/" + row.id);
              },
              hover: true,
              sx:{
                cursor: 'pointer'
              }
            }),
          }}
        ></Table>
      )}
    </>
  );
}
