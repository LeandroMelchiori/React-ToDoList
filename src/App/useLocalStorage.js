import React from 'react';

function useLocalStorage(itemName, initialValue) {
  const [state, dispatch] = React.useReducer(reducer, initialState(initialValue));
  const {
    synchronizedItem,
    error,
    loading,
    item,
  } = state;

  const onError = (error) => dispatch({
    type: actionTypes.error,
    payload: error 
  });
  
  const onSuccess = (item) => dispatch({
    type: actionTypes.success,
    payload: item });
  
  const onSynchronize = () => dispatch({
    type: actionTypes.synchronize
  });

  const onSave = (item) => dispatch({ 
    type: actionTypes.save,
    payload: item,
  });

  React.useEffect(() => {
    try {
      const localStorageItems = localStorage.getItem(itemName);
      let parsedItems;

      if (!localStorageItems) {
        localStorage.setItem(itemName, JSON.stringify(initialValue));
        parsedItems = initialValue;
      } else {
        parsedItems = JSON.parse(localStorageItems);
      }
      onSuccess(parsedItems);
    } catch (error) {
      onError(error);
    }
  }, [synchronizedItem, itemName, initialValue]);

  const saveItem = (newItem) => {
    try {
      localStorage.setItem(itemName, JSON.stringify(newItem));
      onSave(newItem);
    } catch (error) {onError(error);}
  }
 
  const synchronizeItem = () => {
    onSynchronize();
  }

  return { item, saveItem, loading, error, synchronizeItem };
}

const initialState = (initialValue) => ({
  synchronizedItem: true,
  error: false,
  loading: true,
  item: initialValue,
});

const actionTypes = {
  error: 'ERROR',
  success: 'SUCCESS',
  synchronize: 'SYNCHRONIZE',
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
    synchronizedItem: true,
    item: payload,
  },
  
  [actionTypes.synchronize]: {
    ...state,
    synchronizedItem: false,
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
