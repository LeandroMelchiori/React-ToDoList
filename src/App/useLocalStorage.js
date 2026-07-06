import React from 'react';
import { getStoredItem, setStoredItem } from './todoStorage';

function parseStoredItem(storedItem, initialValue, isValidItem) {
  if (!storedItem) {
    return { item: initialValue, shouldRepair: true };
  }

  let parsedItem;

  try {
    parsedItem = JSON.parse(storedItem);
  } catch {
    return { item: initialValue, shouldRepair: true };
  }

  if (!isValidItem(parsedItem)) {
    return { item: initialValue, shouldRepair: true };
  }

  return { item: parsedItem, shouldRepair: false };
}

function useLocalStorage(itemName, initialValue, isValidItem = () => true) {
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
    let isMounted = true;

    async function loadItem() {
      try {
        const storedItem = await getStoredItem(itemName);
        const { item, shouldRepair } = parseStoredItem(storedItem, initialValue, isValidItem);

        if (shouldRepair) {
          await setStoredItem(itemName, JSON.stringify(initialValue));
        }

        if (isMounted) {
          onSuccess(item);
        }
      } catch (error) {
        if (isMounted) {
          onError(error);
        }
      }
    }

    loadItem();

    return () => {
      isMounted = false;
    };
  }, [synchronizedItem, itemName, initialValue, isValidItem]);

  const saveItem = (newItem) => {
    try {
      setStoredItem(itemName, JSON.stringify(newItem)).catch(onError);
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
