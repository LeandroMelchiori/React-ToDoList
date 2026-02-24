import React from 'react';

function useLocalStorage(itemName, initialValue) {
  const [state, dispatch] = React.useReducer(reducer, initialState(initialValue));
  const {
    sincronizedItem,
    error,
    loading,
    item,
  } = state;

  // ACTION CREATORS
  const onError = (error) => dispatch({
    type: actionTypes.error,
    payload: error 
  });
  
  const onSuccess = (item) => dispatch({
    type: actionTypes.success,
    payload: item });
  
  const onSyncronize = () => dispatch({
    type: actionTypes.syncronize
  });

  const onSave = (item) => dispatch({ 
    type: actionTypes.save,
    payload: item,
  });

  React.useEffect(() => {
    setTimeout(() => {
      try {
        const localStorageItems =
        localStorage.getItem(itemName);
        let parsedItems;

        if (!localStorageItems) {
          localStorage.setItem(
            itemName,
            JSON.stringify(initialValue));
          parsedItems = initialValue;
        } else {
            parsedItems = 
              JSON.parse(localStorageItems); 
        }
        onSuccess(parsedItems);

      } catch (error) {
        onError(error);
      }
    }, 2000);
  }, [sincronizedItem]);
    
    

  const saveItem = (newItem) => {
    try {
      localStorage.setItem(itemName, JSON.stringify(newItem));
      onSave(newItem);
    } catch (error) {onError(error);}
  }
 
  const sincronizeItem = () => {
    onSyncronize();
  }

  return {item, saveItem, loading, error, sincronizeItem };
}

const initialState = (initialValue) => ({
  sincronizedItem: true,
  error: false,
  loading: true,
  item: initialValue,
});

const actionTypes = {
  error: 'ERROR',
  success: 'SUCCESS',
  syncronize: 'SYNCRONIZE',
  save: 'SAVE',
};
  

const reducerObject = (state, payload) => ({
  [actionTypes.error]: {
    ...state,
    error: true,
    loading: false,
  },

  [actionTypes.success]: {
    ...state,
    error: false,
    loading: false,
    sincronizedItem: true,
    item: payload,
  },
  
  [actionTypes.syncronize]: {
    ...state,
    sincronizedItem: false,
    loading: true,
  },

  [actionTypes.save]: {
    ...state,
    item: payload,
  },
  
});

const reducer = (state, action) => {
  return reducerObject(state, action.payload)[action.type] || state;
}

export { useLocalStorage };