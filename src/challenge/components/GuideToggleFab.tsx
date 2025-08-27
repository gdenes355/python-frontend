import { Box, Fab } from "@mui/material";
import DevicesFoldIcon from "@mui/icons-material/DevicesFold";

type GuideToggleFabProperties = {
  isGuideMinimised: boolean;
  onGuideDisplayToggle: () => void;
};

export const GuideToggleFab = (props: GuideToggleFabProperties) => {
  return (
    <Box
      sx={{
        top: "55px",
        left: "auto",
        position: "absolute",
        right: "6px",
        bottom: "auto",
      }}
    >
      <Fab
        key="toggleGuide"
        size="small"
        onClick={() => props.onGuideDisplayToggle()}
      >
        <DevicesFoldIcon />
      </Fab>
    </Box>
  );
};
