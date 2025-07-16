import React, { useContext, useEffect, useRef } from "react";
import TeacherContainer from "./TeacherContainer";
import { useOutletContext } from "react-router-dom";
import { OutletContextType } from "../auth/AdminWrapper";
import { ClassModel } from "./Models";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import { Checkbox } from "@mui/material";
import SessionContext from "../auth/contexts/SessionContext";
import ClassDeletePopupMenu, {
  ClassDeletePopupMenuHandle,
} from "./components/ClassDeletePopupMenu";
import NotificationsContext from "../components/NotificationsContext";

const AllClasses = () => {
  const oc: OutletContextType = useOutletContext();
  const sessionContext = useContext(SessionContext);
  const notificationContext = useContext(NotificationsContext);

  const [classes, setClasses] = React.useState<ClassModel[]>([]);

  const popupMenuRef = useRef<ClassDeletePopupMenuHandle>(null);

  useEffect(() => {
    oc.request("api/admin/classes").then(setClasses);
  }, [oc]);

  const patchClass = (className: string, active: boolean) => {
    fetch(`${oc.urlBase}/api/admin/classes/${className}`, {
      method: "PATCH",
      cache: "no-cache",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${sessionContext.token}`,
      },
      body: JSON.stringify({ active }),
    })
      .then((resp) => {
        if (resp.status === 200) {
          for (let c of classes) {
            if (c.name === className) {
              c.active = active;
              setClasses([...classes]);
              notificationContext.addMessage("Class updated", "success");
              break;
            }
          }
        } else {
          notificationContext.addMessage("Failed to update class", "error");
        }
      })
      .catch((e) => {
        console.log(e);
        notificationContext.addMessage("Failed to update class", "error");
      });
  };

  const deleteClass = (className: string) => {
    fetch(`${oc.urlBase}/api/admin/classes/${className}`, {
      method: "DELETE",
      cache: "no-cache",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${sessionContext.token}`,
      },
    })
      .then((resp) => {
        if (resp.status === 200) {
          setClasses(classes.filter((c) => c.name !== className));
          notificationContext.addMessage("Class deleted", "success");
        } else {
          notificationContext.addMessage("Failed to delete class", "error");
        }
      })
      .catch((e) => {
        console.log(e);
        notificationContext.addMessage("Failed to delete class", "error");
      });
  };

  const columns: GridColDef[] = [
    { field: "name", headerName: "Class name", width: 200 },
    {
      field: "students",
      headerName: "Students",
      width: 200,
      valueGetter: (params) => (params as string[]).length,
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
              patchClass(params.row.name, e.target.checked);
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
        loading={classes.length === 0}
        disableRowSelectionOnClick
        slotProps={{
          row: {
            onContextMenu: handleRightClick,
          },
        }}
      />
      <ClassDeletePopupMenu ref={popupMenuRef} onDeleteClass={deleteClass} />
    </TeacherContainer>
  );
};

export default AllClasses;
