import React from "react"; 

function useStorageListener(syncTodos) {
        const [storageChange, setStorageChange] = React.useState(false);

        React.useEffect(() => {
            const onChange = (change) => {
                if (change.key === "TODOS_V1") {
                setStorageChange(true);
                }
            };

            window.addEventListener("storage", onChange);

            return () => {
                window.removeEventListener("storage", onChange);
      };
    }, [syncTodos]);

        const toggleShow = () => {
            syncTodos();
            setStorageChange(false);
        }

        return {
            show: storageChange,
            toggleShow
        };
    }

export { useStorageListener };
