import React from 'react';

function useLocalStorage(itemName, initialValue) {
  const [item, setItem] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(false);
  const [sincronizedItem, setSincronizedItem] = React.useState(true);

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
        
        setItem(parsedItems); 
        setLoading(false);
        setSincronizedItem(true);

       } catch (error) {
        setLoading(false);
        setError(true);
      }
    }, 2000);
  }, [sincronizedItem]);
    
    

  const saveItem = (newItem) => {
  localStorage.setItem(itemName, JSON.stringify(newItem));
  setItem(newItem);
  }

  const sincronizeItem = () => {
    setLoading(true);
    setSincronizedItem(false);
  }

  return {item, saveItem, loading, error, sincronizeItem };



}

export { useLocalStorage };