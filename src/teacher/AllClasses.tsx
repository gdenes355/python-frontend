import { useContext, useRef, useState } from "react";
import TeacherContainer from "./TeacherContainer";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import { Box, Checkbox, Fab } from "@mui/material";
import ClassDeletePopupMenu, {
  ClassDeletePopupMenuHandle,
} from "./components/ClassDeletePopupMenu";
import NotificationsContext from "../components/NotificationsContext";
import { useClasses } from "./hooks/api/useClasses";
import { useClassesDelete } from "./hooks/api/useClassesDelete";
import { useClassesPatch } from "./hooks/api/useClassesPatch";
import { useClassesCreate } from "./hooks/api/useClassesCreate";
import AddGroupDialog from "./components/AddGroupDialog";
import AddIcon from "@mui/icons-material/Add";

const AllClasses = () => {
  const notificationContext = useContext(NotificationsContext);

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const { data: classes, isLoading: isLoadingClasses } = useClasses();
  const { mutate: deleteClass } = useClassesDelete({
    onSuccess: () => {
      notificationContext.addMessage("Class deleted", "success");
    },
    onError: (error: Error) => {
      notificationContext.addMessage(error.message, "error");
    },
  });
  const { mutate: patchClass } = useClassesPatch({
    onSuccess: () => {
      notificationContext.addMessage("Class updated", "success");
    },
    onError: (error: Error) => {
      notificationContext.addMessage(error.message, "error");
    },
  });
  const { mutate: createClass } = useClassesCreate({
    onSuccess: () => {
      notificationContext.addMessage("Class created", "success");
      setIsAddDialogOpen(false);
    },
    onError: (error: Error) => {
      notificationContext.addMessage(error.message, "error");
    },
  });

  const popupMenuRef = useRef<ClassDeletePopupMenuHandle>(null);

  const columns: GridColDef[] = [
    { field: "name", headerName: "Class name", width: 200 },
    {
      field: "students",
      headerName: "Students",
      width: 200,
      valueGetter: (params) => (params as string[])?.length ?? 0,
    },
    {
      field: "active",
      headerName: "Active",
      width: 200,
      renderCell: (params) => {
        return (
          <Checkbox
            checked={params.value}
            onChange={(e) => {
              patchClass({
                className: params.row.name,
                active: e.target.checked,
              });
            }}
          />
        );
      },
      type: "boolean",
    },
  ];

  const handleRightClick = (e: React.MouseEvent) => {
    e.preventDefault();
    const klass = e.currentTarget.getAttribute("data-id");
    if (!klass) return;
    popupMenuRef.current?.handleContextMenu(e, klass);
  };

  return (
    <TeacherContainer>
      <DataGrid
        rows={classes}
        getRowId={(row) => row.name}
        columns={columns}
        density="compact"
        initialState={{
          pagination: { paginationModel: { pageSize: 15 } },
        }}
        pageSizeOptions={[5, 15, 50, 100]}
        loading={isLoadingClasses}
        disableRowSelectionOnClick
        slotProps={{
          row: {
            onContextMenu: handleRightClick,
          },
        }}
      />
      <ClassDeletePopupMenu ref={popupMenuRef} onDeleteClass={deleteClass} />
      <AddGroupDialog
        groups={classes || []}
        onInputEntered={(className) => createClass({ className })}
        open={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
      />
      <Box
        sx={{
          top: "auto",
          left: "auto",
          position: "absolute",
          right: "6px",
          bottom: "64px",
        }}
      >
        <Fab
          key="toggleGuide"
          size="small"
          color="primary"
          onClick={() => setIsAddDialogOpen(true)}
        >
          <AddIcon />
        </Fab>
      </Box>
    </TeacherContainer>
  );
};

export default AllClasses;
