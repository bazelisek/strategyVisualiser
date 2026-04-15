'use client';
import React, { ChangeEventHandler } from 'react';
import { Button } from '@mui/joy';
import UploadIcon from './UploadIcon';

interface UploadFileProps {
  name?: string;
  displayName: string;
  accept: string;
  onChange: ChangeEventHandler<HTMLInputElement>
}

const UploadFile: React.FC<UploadFileProps> = ({accept, name, displayName, onChange}) => {
  return (
    <div style={{ position: 'relative', display: 'inline-flex' }}>
      <Button
        type="button"
        variant="outlined"
        startDecorator={<UploadIcon />}
      >
        {displayName}
      </Button>
      <input
        type='file'
        id={name}
        name={name}
        accept={accept}
        onChange={onChange}
        style={{
          position: 'absolute',
          inset: 0,
          opacity: 0,
          cursor: 'pointer',
        }}
      />
    </div>
  );
};

export default UploadFile;
