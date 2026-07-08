import React from 'react';
import { getStoredItem, setStoredItem } from './todoStorage';

type StorageState<T> = {
  synchronizedItem: boolean;
  error: boolean;
  loading: boolean;
  item: T;
};

type StorageAction<T> =
  | { type: 'ERROR'; payload: unknown }
  | { type: 'SUCCESS'; payload: T }
  | { type: 'SYNCHRONIZE' }
  | { type: 'SAVE'; payload: T };

type ParseResult<T> = {
  item: T;
  shouldRepair: boolean;
};

function parseStoredItem<T>(
  storedItem: string | null,
  initialValue: T,
  isValidItem: (item: unknown) => boolean
): ParseResult<T> {
  if (!storedItem) {
    return { item: initialValue, shouldRepair: true };
  }

  let parsedItem: unknown;

  try {
    parsedItem = JSON.parse(storedItem);
  } catch {
    return { item: initialValue, shouldRepair: true };
  }

  if (!isValidItem(parsedItem)) {
    return { item: initialValue, shouldRepair: true };
  }

  return { item: parsedItem as T, shouldRepair: false };
}

function useLocalStorage<T>(
  itemName: string,
  initialValue: T,
  isValidItem: (item: unknown) => boolean = () => true
) {
  const [state, dispatch] = React.useReducer(
    reducer<T>,
    initialState(initialValue)
  );
  const {
    synchronizedItem,
    error,
    loading,
    item,
  } = state;

  const onError = (error: unknown) => dispatch({
    type: actionTypes.error,
    payload: error 
  });
  
  const onSuccess = (item: T) => dispatch({
    type: actionTypes.success,
    payload: item });
  
  const onSynchronize = () => dispatch({
    type: actionTypes.synchronize
  });

  const onSave = (item: T) => dispatch({ 
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

  const saveItem = (newItem: T) => {
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

const initialState = <T,>(initialValue: T): StorageState<T> => ({
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
} as const;
  

const reducer = <T,>(state: StorageState<T>, action: StorageAction<T>): StorageState<T> => {
  switch (action.type) {
    case actionTypes.error:
      return {
        ...state,
        error: true,
        loading: false,
      };
    case actionTypes.success:
      return {
        ...state,
        error: false,
        loading: false,
        synchronizedItem: true,
        item: action.payload,
      };
    case actionTypes.synchronize:
      return {
        ...state,
        synchronizedItem: false,
        loading: true,
      };
    case actionTypes.save:
      return {
        ...state,
        item: action.payload,
      };
    default:
      return state;
  }
}

export { useLocalStorage };
