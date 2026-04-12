import { List, Sheet } from "@mui/joy";

export default function Page() {
  return (
    <div style={{ display: "flex", justifyContent: "center", padding: "2rem" }}>
      <Sheet
        variant="soft"
        sx={{
          borderRadius: "1rem",
          padding: "2rem",
          width: { sm: "90%", md: "50%" },
        }}
      >
        <h1 style={{ textAlign: "center" }}>Strategies</h1>
        <Sheet variant="outlined" sx={{ borderRadius: "0.5rem", padding: "1rem", marginTop: "1rem" }}>
          <List></List>
        </Sheet>
      </Sheet>
    </div>
  );
}
