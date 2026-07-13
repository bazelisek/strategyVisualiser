import React, { type ReactNode } from 'react';
import { BASE_PATH } from '@/util/env/constants';

const AppIcon: React.FC = () => {
  return (
    <img style={{height: "40px", marginLeft: '8px', marginRight: '8px'}} src={`${BASE_PATH}/icon.png`} alt="App Icon"></img>
  );
};

export default AppIcon;