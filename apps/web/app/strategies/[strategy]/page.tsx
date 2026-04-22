import VerifyAuth from "@/auth/VerifyAuth";
import getStrategy from "@/util/strategies/getStrategy";
import { Button, Chip, Divider, Sheet, Stack, Typography } from "@mui/joy";
import Author from "@/components/User/Author";
import EventIcon from "@mui/icons-material/Event";
import { Tooltip } from "@mui/material";
import { formatLocalDateTime } from "@/util/time";
import EditCalendarIcon from "@mui/icons-material/EditCalendar";
import { getServerSession } from "@/auth/server";

const Page = async ({ params }: { params: Promise<{ strategy: string }> }) => {
  const { strategy: strategyId } = await params;
  const data = await getStrategy(strategyId);
  if (!data) return;
  const session = await getServerSession();
  const currentUserEmail = session?.user?.email;
  const { name, createdAt, description, isPublic, ownerUser, updatedAt } = data;
  const isOwner = currentUserEmail === ownerUser.email;

  // Display data and make it possible to edit it.
  return (
    <VerifyAuth>
      <Stack alignItems={"center"}>
        <Sheet
          sx={{
            p: 4,
            borderRadius: 20,
            m: 4,
            width: { xs: "90%", sm: "60%" },
          }}
        >
          {isOwner && (
            <Stack direction="row" justifyContent="flex-start" position={'absolute'} right={8*8} sx={{ mb: 1 }}>
              <Button
                component="a"
                href={`/strategies/${strategyId}/edit`}
                size="sm"
                variant="outlined"
              >
                Edit
              </Button>
            </Stack>
          )}
          <Typography level="h1">{name} <Chip variant="outlined" color={isPublic ? "success" : "danger"}>{isPublic ? "Public" : "Private"}</Chip></Typography>
          <Author user={ownerUser} displayUsername />
          <Divider sx={{ my: 1 }} />
          

          <Chip sx={{ px: 1, py: 0.5, mr: 1 }} variant="outlined">
            <div style={{ display: "flex", alignItems: "center" }}>
              <Tooltip title="Created At">
                <EventIcon />
              </Tooltip>
              <Typography> - {formatLocalDateTime(createdAt)}</Typography>
            </div>
          </Chip>

          <Chip sx={{ px: 1, py: 0.5 }} variant="outlined">
            <div style={{ display: "flex", alignItems: "center" }}>
              <Tooltip title="Updated At">
                <EditCalendarIcon />
              </Tooltip>
              <Typography> - {formatLocalDateTime(updatedAt)}</Typography>
            </div>
          </Chip>

          <Divider sx={{ my: 1 }} />
          
          {description && (
            <div>
              <Typography level="h2">Description</Typography>
              <Typography>{description}</Typography>
            </div>
          )}

          
        </Sheet>
      </Stack>
    </VerifyAuth>
  );
};

export default Page;
