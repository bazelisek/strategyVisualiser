import VerifyAuth from "@/auth/VerifyAuth";
import getStrategy from "@/util/strategies/getStrategy";
import { Chip, Divider, Sheet, Stack, Typography } from "@mui/joy";
import Author from "@/components/User/Author";
import EventIcon from "@mui/icons-material/Event";
import { Tooltip } from "@mui/material";
import { formatLocalDateTime } from "@/util/time";
import EditCalendarIcon from "@mui/icons-material/EditCalendar";

const Page = async ({ params }: { params: Promise<{ strategy: string }> }) => {
  const { strategy: strategyId } = await params;
  const data = await getStrategy(strategyId);
  if (!data) return;
  const { name, createdAt, description, isPublic, ownerUser, updatedAt } = data;

  // Display data and make it possible to edit it.
  return (
    <VerifyAuth>
      <Stack alignItems={"center"}>
        <Sheet
          sx={{
            p: 4,
            borderRadius: 20,
            m: 4,
            width: { xs: "100%", sm: "90%" },
          }}
        >
          <Typography level="h1">{name}</Typography>
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
