import * as React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Modal from '@mui/material/Modal';
import BookUpload from '../../book/components/BookUpload';

const style = {
  position: 'absolute' as 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 400,
  bgcolor: 'background.paper',
  border: '2px solid #000',
  boxShadow: 24,
  p: 4,
};

type BookUploadModalProps = {
  visible: boolean;
  onBookUploaded: (file:File) => void;
  onClose: () => void;
};


export default function BookUploadModal(props:BookUploadModalProps) {

  return (
      <Modal
        open={props.visible}
        onClose={props.onClose}
        aria-labelledby="upload book zip"
        aria-describedby="upload a new book zip of challenges"
      >
        <Box sx={style}>
          <Typography id="upload-bookzip-title" variant="h6" component="h2">
            UPLOAD BOOK ZIP
          </Typography>
          <BookUpload
            onBookUploaded={(file) => {
              props.onBookUploaded(file);
            }}
        />
        </Box>
      </Modal>
  );
}