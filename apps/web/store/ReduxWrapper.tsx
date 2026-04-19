'use client'
import React, { ReactNode } from 'react';
import { Provider } from 'react-redux';
import { persistor, store } from './reduxStore';
import { PersistGate } from 'redux-persist/integration/react';
import ChartLoading from '@/components/common/ChartLoading';

interface ReduxWrapperProps {
  children?: ReactNode;
}

const ReduxWrapper: React.FC<ReduxWrapperProps> = (props) => {
  return (
    <Provider store={store}>
      {/* Add a loading spinner here so the user knows something is happening */}
      <PersistGate 
        loading={
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
            <ChartLoading />
          </div>
        } 
        persistor={persistor}
      >
        {props.children}
      </PersistGate>
    </Provider>
  );
};

export default ReduxWrapper;