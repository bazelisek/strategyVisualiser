'use client'
import React, { ReactNode } from 'react';
import { Provider } from 'react-redux';
import { store } from './reduxStore';

interface ReduxWrapperProps {
  children?: ReactNode;
}

const ReduxWrapper: React.FC<ReduxWrapperProps> = (props) => {
  return (
    <Provider store={store}>
      {props.children}
    </Provider>
  );
};

export default ReduxWrapper;