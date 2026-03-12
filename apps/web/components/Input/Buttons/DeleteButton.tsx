import DeleteIcon from "@mui/icons-material/Delete";
import classes from "./DeleteButton.module.css";
import { IconButton } from "@mui/joy";

interface DeleteButtonProps {
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
}

const DeleteButton: React.FC<DeleteButtonProps> = ({ onClick }) => {
  return (
    <IconButton className={classes.button} type="button" onClick={onClick}>
      <DeleteIcon
        className={classes.icon}
        sx={{
          fontSize: "1.2rem",
        }}
      />
    </IconButton>
  );
};

export default DeleteButton;
